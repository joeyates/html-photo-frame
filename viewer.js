import EventEmitter from './event-emitter.js'

const CAPTION_HEIGHT = 32

class ImageDetails {
  constructor(image, index) {
    this.image = image
    this.index = index
    this.img = null
  }

  load(success, failure) {
    this.img = new Image()
    this.img.onload = success
    this.img.onerror = failure
    this.img.src = this.image.url
  }
}

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
    if (!this.showing) {
      return null
    }
    return this.showing.index
  }

  start() {
    this.caption = document.createElement('h1')
    this.caption.classList.add('caption')
    this.parent.append(this.caption)
    this.img = document.createElement('img')
    this.img.src = ''
    this.parent.append(this.img)
  }

  preload(image, index) {
    this.preloader = new ImageDetails(image, index)
    this.preloader.load(this.imageLoaded.bind(this), this.imageFailed.bind(this))
  }

  cancelPreload() {
    this.preloader = null
  }

  imageLoaded() {
    if (!this.preloader) {
      return
    }
    this.ready = this.preloader
    this.emit('imageLoaded', this.preloader.image, this.preloader.index)
    this.preloader = null
  }

  imageFailed() {
    this.emit('imageFailed', this.preloader.image, this.preloader.index)
    this.preloader = null
  }

  showPreloaded() {
    if (!this.ready) {
      return
    }
    this.logger.debug(`Showing preloaded image ${this.ready.index} '${this.ready.image.url}'`)
    this.showing = this.ready
    this.resize()
  }

  resize() {
    const captionHeight = this.showCaption ? CAPTION_HEIGHT : 0
    const viewport = this.parent.getBoundingClientRect()
    const viewportWidth = viewport.right - viewport.left - 16
    const viewportHeight = viewport.bottom - viewport.top - (16 + captionHeight)
    const viewportProportions = viewportHeight / viewportWidth
    const imageWidth = this.showing.image.width
    const imageHeight = this.showing.image.height
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
      top = `${(viewportHeight - height) / 2}px`
    }
    this.img.style.visibility = 'hidden'
    this.img.src = this.showing.image.url
    this.img.width = width
    this.img.height = height
    this.img.style.left = left
    this.img.style.top = top
    this.img.style.visibility = 'visible'
    if (this.showCaption) {
      this.caption.style.visibility = 'visible'
      this.caption.innerHTML = this.showing.src
    } else {
      this.caption.style.visibility = 'hidden'
    }
  }
}

export default Viewer
