import EventEmitter from './event-emitter.js'
import ImageLoader from './image-loader.js'
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
        if (this.ready) {
          if (this.showing.index === this.ready.index) {
            return this.showing.index + 1
          } else {
            // The ready image hasn't been shown
            return this.ready.index
          }
        } else {
          return this.showing.index + 1
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

  // Find the lowest index of all current images
  // and return one less than that
  get previousIndex() {
    const p = this.preloader?.index
    const r = this.ready?.index
    const s = this.showing?.index
    const indexes = []
    p !== undefined && indexes.push(p)
    r !== undefined && indexes.push(r)
    s !== undefined && indexes.push(s)
    if (indexes.length === 0) {
      return -1
    }
    const min = Math.min(...indexes)
    return min - 1
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
    this.preloader = new ImageLoader(image, index, new Image())
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
    this.ready = null
  }

  imageLoaded(details) {
    this.spinner.hide()
    this.ready = this.preloader
    // Unset preloader **before** emitting signals, as some callbacks
    // end up being so slow, the following preload gets borked.
    this.preloader = null
    this.emit('imageLoaded', details.image, details.index)
  }

  imageFailed(details, error) {
    this.emit('imageFailed', details.image, details.index, error)
    this.preloader = null
  }

  showPreloaded() {
    if (!this.ready) {
      this.logger.warn('Viewer.showPreloaded - No image ready')
      return
    }
    this.logger.debug(`Showing preloaded image ${this.ready.index} '${this.ready.image.url}'`)
    if (this.showing) {
      this.showing.img.remove()
    }
    this.showing = this.ready
    this.ready = null
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
