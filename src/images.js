import Config from './config.js'
import EventEmitter from './event-emitter.js'
import Timings from './timings.js'
import Viewer from './viewer.js'

const MINIMUM_TIMEOUT = 500

class Images extends EventEmitter {
  constructor(window, element, logger) {
    super()
    this.logger = logger
    this.images = null
    this.timings = new Timings({logger})
    this.paused = false
    this.previousShow = null
    this.showNextTimeout = null
    this.timeout = null
    this.config = new Config(window)
    this.viewer = new Viewer(element, logger)
  }

  get currentImage() {
    const index = this.viewer.showIndex
    if (index === null) {
      return null
    }
    return this.images[index]
  }

  get inFocusMode() {
    return this.images !== this.config.images
  }

  get showIndex() {
    return this.viewer.showIndex
  }

  get showCaption() {
    return this.viewer.showCaption
  }

  start() {
    if (!this.config.url) {
      this.emit('error', 'supply a config=URL query parameter')
      return
    }
    this.config.addEventListener('loaded', this.configLoaded.bind(this))
    this.config.addEventListener('failed', this.configFailed.bind(this))
    this.config.load()
  }

  configLoaded() {
    this.images = this.config.images
    this.timeout = this.config.timeout
    this.logger.debug('Starting slideshow')
    this.viewer.addEventListener('imageLoaded', this.imageLoaded.bind(this))
    this.viewer.addEventListener('imageFailed', this.imageFailed.bind(this))
    this.viewer.start()
    this.preload(0)
  }

  configFailed(error) {
    this.emit('error', error)
  }

  goToNext() {
    this.logger.debug('Skipping forwards')
    this.stopTimeout()
    this.showPreloadingImageImmediately()
    this.next()
  }

  goToPrevious() {
    this.logger.debug('Skipping backwards')
    this.showPreloadingImageImmediately()
    this.previous()
  }

  resize() {
    this.viewer.resize()
  }

  slowDown() {
    this.timeout = this.timeout + 500
    this.logger.debug(`Slide change timeout increased to ${this.timeout}ms`)
  }

  speedUp() {
    if (this.timeout <= MINIMUM_TIMEOUT) {
      this.logger.debug(`Can't change slide change timeout as it is already at the quickest (${MINIMUM_TIMEOUT}ms)`)
      return
    }
    this.timeout = this.timeout - 500
    this.logger.debug(`Slide change timeout reduced to ${this.timeout}ms`)
  }

  toggleCaptions() {
    if (this.viewer.showCaption) {
      this.viewer.showCaption = false
      this.viewer.resize()
      this.logger.debug('Hide caption')
    } else {
      this.viewer.showCaption = true
      this.viewer.resize()
      this.logger.debug('Show caption')
    }
    this.emit('updateStatus')
  }

  toggleFocusMode() {
    const current = this.currentImage
    if (!current) {
      this.logger.debug("Can't toggle focus mode as there's no current image")
      return
    }
    this.stopTimeout()
    this.viewer.cancelPreload()
    if (this.inFocusMode) {
      this.logger.debug('Leaving focus mode')
      this.images = this.config.images
    } else {
      const path = current.url.replace(/\/[^/]*$/, '')
      const images = this.config.images.filter(i => i.url.startsWith(path))
      this.logger.debug(`Starting focus mode, ${images.length} images starting with '${path}'`)
      this.images = images
    }
    const currentIndex = this.images.findIndex(i => i.url === current.url)
    let nextIndex
    if (currentIndex === this.images.length - 1) {
      nextIndex = 0
    } else {
      nextIndex = currentIndex + 1
    }
    this.preload(nextIndex)
    this.emit('updateStatus')
  }

  togglePause() {
    if (this.paused) {
      this.logger.debug('Resuming slideshow')
      this.next()
      this.paused = false
    } else {
      this.logger.debug('Pausing slideshow')
      this.stopTimeout()
      this.viewer.cancelPreload()
      this.paused = true
    }
    this.emit('updateStatus')
  }

  removeCurrent() {
    this.logger.debug('Deleting current image')
    this.stopTimeout()
    const index = this.viewer.showIndex
    this.removeImage(index)
    let nextIndex
    if (index === this.images.length) {
      nextIndex = 0
    } else {
      nextIndex = index
    }
    this.showPreloadingImageImmediately()
    this.preload(index)
  }

  removeImage(index) {
    if (!index) {
      return
    }
    if (index > this.images.length - 1) {
      this.logger.error(`Can't remove image ${index}, max index is ${this.images.length}`)
      return
    }
    if (this.images.length === 1) {
      this.logger.error("Can't remove last image")
      return
    }
    const image = this.images[index]
    this.logger.debug(`Removing image ${index}/${this.images.length} '${image.url}'`)
    this.images.splice(index, 1)
  }

  previous() {
    let previousIndex = this.viewer.previousIndex
    if (previousIndex < 0) {
      previousIndex = this.images.length - 1
    }
    this.logger.debug(`Preloading previous image, current ${this.viewer.showIndex}, next ${previousIndex}`)
    this.preload(previousIndex)
  }

  next() {
    let nextIndex = this.viewer.nextIndex
    if (nextIndex >= this.images.length) {
      nextIndex = 0
      this.logger.debug('Reached last image, looping back to first')
    }
    this.logger.debug(`Preloading image ${nextIndex}`)
    this.preload(nextIndex)
  }

  stopTimeout() {
    if (this.showNextTimeout) {
      clearTimeout(this.showNextTimeout)
      this.showNextTimeout = null
    }
  }

  preload(index) {
    this.stopTimeout()
    const next = this.images[index]
    this.logger.debug(`Preloading image ${index}/${this.images.length}, '${next.url}'`)
    this.viewer.preload(next, index)
  }

  showPreloadingImageImmediately() {
    this.previousShow = null
  }

  imageLoaded(image, index) {
    this.stopTimeout()
    this.logger.debug(`Loading complete for image ${index} '${image.url}'`)
    if (!this.previousShow) {
      this.showPreloaded('first')
      return
    }
    // We've waited for the image to download
    const now = new Date()
    const elapsed = now - this.previousShow
    // Have we waited more than the usual wait time between images?
    const remainder = this.timeout - elapsed
    if (remainder < 0) {
      this.showPreloaded('late')
      return
    }
    // Wait the remainder of the time
    this.showNextTimeout = setTimeout(() => {
      this.showPreloaded(`with remainder ${remainder}`)
    }, remainder)
  }

  showPreloaded(reason) {
    this.stopTimeout()
    this.viewer.showPreloaded()
    this.logTimings(reason)
    this.previousShow = new Date
    this.next()
  }

  logTimings(reason) {
    const index = this.viewer.showIndex
    const current = this.currentImage
    this.timings.add({reason, index, url: current.url})
    this.timings.log()
  }

  imageFailed(image, index, error) {
    this.logger.warn(`Failed to download image '${image.url}'`, error)
    this.emit('missingImage', image)
    this.removeImage(index)
    let nextIndex
    if (index === this.images.length) {
      nextIndex = 0
    } else {
      nextIndex = index
    }
    this.showPreloadingImageImmediately()
    this.preload(nextIndex)
  }
}

export default Images
