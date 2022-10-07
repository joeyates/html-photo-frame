import KeyWatcher from './key-watcher.js'
import Logger from './logger.js'
import shuffle from './shuffle.js'
import Viewer from './viewer.js'

class PhotoSlideshow {
  constructor(window, element) {
    this.window = window
    this.element = element
    this._errors = null
    this.images = null
    this.keyWatcher = null
    this.loadCheckInterval = null
    this.logger = null
    this.notes = []
    this.showNextTimeout = null
    this.paused = false
    this.previousShow = null
    this.timeout = null
  }

  get configURL() {
    const search = this.window.location.search
    if (search === '') {
      return null
    }
    const params = new URLSearchParams(search)
    return params.get('config')
  }

  get errors() {
    if (this._errors) {
      return this._errors
    }
    this._errors = []
    if (!this.window) {
      this._errors.push('window is null')
    }
    if (!this.element) {
      this._errors.push('element is null')
    }
    if (!this.configURL) {
      this._errors.push('supply a config=URL query parameter')
    }
    return this._errors
  }

  get error() {
    return this.errors.join("\n")
  }

  get ok() {
    return this.errors.length === 0
  }

  run() {
    this.logger = new Logger()
    if (!this.ok) {
      return
    }
    this.viewer = new Viewer(this.element, this.logger)
    this.viewer.addEventListener('imageLoaded', this.imageLoaded.bind(this))
    this.viewer.addEventListener('imageFailed', this.imageFailed.bind(this))
    this.viewer.start()
    this.setupKeyWatcher()
    this.trackWindowResizing()
    this.loadConfig()
      .then(() => {
        this.loadCheckInterval = setInterval(this.start.bind(this), 1000)
      })
      .catch(error => {
        return
      })
  }

  start() {
    if (!this.images) {
      this.logger.debug('No config yet')
      return
    }
    clearInterval(this.loadCheckInterval)
    this.logger.debug('Starting slideshow')
    this.preload(0)
  }

  setupKeyWatcher() {
    this.keyWatcher = new KeyWatcher(this.window.document, this.logger)
    this.keyWatcher.addEventListener('c', this.toggleCaptions.bind(this))
    this.keyWatcher.addEventListener('del', this.removeCurrent.bind(this))
    this.keyWatcher.addEventListener('left', this.goToPrevious.bind(this))
    this.keyWatcher.addEventListener('minus', this.slowDown.bind(this))
    this.keyWatcher.addEventListener('plus', this.speedUp.bind(this))
    this.keyWatcher.addEventListener('l', this.listNotes.bind(this))
    this.keyWatcher.addEventListener('n', this.addNote.bind(this))
    this.keyWatcher.addEventListener('q', this.lessVerbose.bind(this))
    this.keyWatcher.addEventListener('r', this.resetNotes.bind(this))
    this.keyWatcher.addEventListener('right', this.goToNext.bind(this))
    this.keyWatcher.addEventListener('space', this.togglePause.bind(this))
    this.keyWatcher.addEventListener('v', this.moreVerbose.bind(this))
    this.keyWatcher.run()
  }

  addNote() {
    const index = this.viewer.showIndex
    if (index === null) {
      return
    }
    const image = this.images[index]
    const exists = this.notes.findIndex(url => url === image.url)
    if (exists !== -1) {
      return
    }
    this.logger.debug(`Adding note for '${image.url}'`)
    this.notes.push(image.url)
  }

  goToNext() {
    this.logger.debug('Skipping forwards')
    this.stopTimeout()
    this.showPreloadingImageImmediatly()
    this.next()
  }

  goToPrevious() {
    this.logger.debug('Skipping backwards')
    this.showPreloadingImageImmediatly()
    this.previous()
  }

  lessVerbose() {
    const changed = this.logger.lessVerbose()
    if (changed) {
      this.logger.debug(`Logger level reduced to ${this.logger.level}`)
    } else {
      this.logger.debug(`Logger level unchanged: ${this.logger.level}`)
    }
  }

  listNotes() {
    alert(this.notes.join("\n"))
  }

  moreVerbose() {
    const changed = this.logger.moreVerbose()
    if (changed) {
      this.logger.debug(`Logger level increased to ${this.logger.level}`)
    } else {
      this.logger.debug(`Logger level unchanged: ${this.logger.level}`)
    }
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
    this.showPreloadingImageImmediatly()
    this.preload(index)
  }

  resetNotes() {
    this.notes = []
  }

  slowDown() {
    this.timeout = this.timeout + 500
    this.logger.debug(`Slide change timeout increased to ${this.timeout}ms`)
  }

  speedUp() {
    if (this.timeout <= PhotoSlideshow.MINIMUM_TIMEOUT) {
      this.logger.debug(`Can't change slide change timeout as it is already at the quickest (${PhotoSlideshow.MINIMUM_TIMEOUT}ms)`)
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
  }

  trackWindowResizing() {
    this.window.addEventListener('resize', this.resize.bind(this))
  }

  resize() {
    this.viewer.resize()
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

  loadConfig() {
    return new Promise((resolve, reject) => {
      fetch(this.configURL)
        .then(response => {
          switch(response.status) {
          case 200:
            return response.json()
          case 404:
            throw '404 File not found'
          default:
            throw `Unexpected response status: ${response.status}`
          }
        })
        .then(data => {
          this.images = shuffle(data.images)
          this.timeout = data.timeout || PhotoSlideshow.DEFAULT_TIMEOUT
          resolve()
        })
        .catch(error => {
          this.logger.error(error)
          reject(error)
        })
    })
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

  showPreloadingImageImmediatly() {
    this.previousShow = null
  }

  imageLoaded(image, index) {
    this.logger.debug(`Loading complete for image ${index} '${image.url}'`)
    if (!this.previousShow) {
      this.showPreloaded()
      return
    }
    // We've waited for the image to download
    const now = new Date()
    const elapsed = now - this.previousShow
    // Have we waited more than the usual wait time between images?
    const remainder = this.timeout - elapsed
    if (remainder < 0) {
      this.showPreloaded()
      return
    }
    // Wait the remainder of the time
    this.showNextTimeout = setTimeout(this.showPreloaded.bind(this), remainder)
  }

  showPreloaded() {
    this.showNextTimeout = null
    this.logger.debug(`Showing ${this.viewer.ready.image.url}`)
    this.viewer.showPreloaded()
    this.previousShow = new Date
    this.next()
  }

  imageFailed(image, index) {
    this.logger.warn(`Failed to download image '${image.url}'`)
    this.removeImage(index)
    let nextIndex
    if (index === this.images.length) {
      nextIndex = 0
    } else {
      nextIndex = index
    }
    this.showPreloadingImageImmediatly()
    this.preload(nextIndex)
  }
}

PhotoSlideshow.DEFAULT_TIMEOUT = 5000
PhotoSlideshow.MINIMUM_TIMEOUT = 500

export default PhotoSlideshow
