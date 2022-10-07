import EventEmitter from './event-emitter.js'
import ImageDetails from './image-details.js'
import Spinner from './spinner.js'

const CAPTION_HEIGHT = 32

class Viewer extends EventEmitter {
  constructor(parent, logger) {
    super()
    this.parent = parent
    this.logger = logger
    this.caption = null
    this.img = null
    this.preloader = null
    this.ready = null
    this.showCaption = false
    this.showing = null
  }

  get nextIndex() {
    if (this.preloader) {
      return this.preloader.index + 1
    } else {
      if (this.showing) {
        if (this.showing.index === this.ready.index) {
          return this.showing.index + 1
        } else {
          // The ready image hasn't been shown
          return this.ready.index
        }
      } else {
        // Nothing has been shown yet
        if (this.ready) {
          return this.ready.index
        } else {
          // preload not yet called
          return 0
        }
      }
    }
  }

  get previousIndex() {
    if (this.preloader) {
      return this.preloader.index - 1
    } else {
      if (this.ready) {
        return this.ready.index - 1
      } else {
        return -1
      }
    }
  }

  get showIndex() {
    return this.showing?.index
  }

  start() {
    this.spinner = new Spinner(this.parent)
    this.spinner.show()
    this.caption = document.createElement('h1')
    this.caption.classList.add('caption')
    this.parent.append(this.caption)
  }

  preload(image, index) {
    this.preloader = new ImageDetails(image, index, new Image())
    this.preloader.load(
      this.imageLoaded.bind(this),
      this.imageFailed.bind(this)
    )
  }

  cancelPreload() {
    if (this.preloader) {
      this.preloader.cancelLoading()
      this.preloader = null
    }
  }

  imageLoaded(details) {
    this.spinner.hide()
    this.ready = ImageDetails.clone(details)
    this.emit('imageLoaded', details.image, details.index)
    this.preloader = null
  }

  imageFailed(details, ...args) {
    this.emit('imageFailed', details.image, details.index)
    this.preloader = null
  }

  showPreloaded() {
    if (!this.ready) {
      return
    }
    this.logger.debug(`Showing preloaded image ${this.ready.index} '${this.ready.image.url}'`)
    if (this.showing) {
      this.showing.img.remove()
    }
    this.showing = ImageDetails.clone(this.ready)
    this.parent.append(this.showing.img)
    this.resize()
  }

  resize() {
    if (!this.showing) {
      return
    }
    const captionHeight = this.showCaption ? CAPTION_HEIGHT : 0
    const viewport = this.parent.getBoundingClientRect()
    const viewportWidth = viewport.right - viewport.left - 16
    let viewportHeight = viewport.bottom - viewport.top - (16 + captionHeight)
    const viewportProportions = viewportHeight / viewportWidth
    const imageWidth = this.showing.img.naturalWidth
    const imageHeight = this.showing.img.naturalHeight
    const imageProportions = imageHeight / imageWidth
    let width, height
    let left, top
    if (imageProportions > viewportProportions) {
      // leave space at the sides
      const verticalScaling = imageHeight / viewportHeight
      width = imageWidth / verticalScaling
      height = viewportHeight
      left = `${(viewportWidth - width) / 2}px`
      top = 0
    } else {
      // leave space top and bottom
      const horizontalScaling = imageWidth / viewportWidth
      width = viewportWidth
      height = imageHeight / horizontalScaling
      left = 0
      // Recalculate height ignoring caption
      viewportHeight = viewport.bottom - viewport.top - 16
      top = `${(viewportHeight - height) / 2}px`
    }
    this.showing.img.width = width
    this.showing.img.height = height
    this.showing.img.style.left = left
    this.showing.img.style.top = top
    if (this.showCaption) {
      this.caption.style.visibility = 'visible'
      this.caption.innerHTML = this.showing.image.url
    } else {
      this.caption.style.visibility = 'hidden'
    }
  }
}

export default Viewer
