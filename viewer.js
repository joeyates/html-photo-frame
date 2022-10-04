import EventEmitter from './event-emitter.js'

class Viewer extends EventEmitter {
  constructor(parent, logger) {
    super()
    this.parent = parent
    this.caption = null
    this.img = null
    this.preloadedReady = false
    this.preloader = null
    this.preloadImage = null
    this.preloadIndex = null
    this.showCaption = false
    this.showIndex = null
  }

  start() {
    this.preloader = new Image()
    this.caption = document.createElement('h1')
    this.caption.classList.add('caption')
    this.parent.append(this.caption)
    this.img = document.createElement('img')
    this.img.src = ''
    this.parent.append(this.img)
  }

  preload(image, index) {
    this.preloadedReady = false
    this.preloadImage = image
    this.preloadIndex = index
    this.preloader.src = image.url
    this.preloader.onload = this.imageLoaded.bind(this)
    this.preloader.onerror = this.imageFailed.bind(this)
  }

  cancelPreload() {
    this.preloader.onload = null
    this.preloader.onerror = null
  }

  imageLoaded() {
    this.preloadedReady = true
    this.emit('imageLoaded')
  }

  imageFailed() {
    this.preloadedReady = false
    this.emit('imageFailed')
  }

  show() {
    if (!this.preloadedReady) {
      return
    }
    const captionHeight = this.showCaption ? CAPTION_HEIGHT : 0
    const viewport = this.parent.getBoundingClientRect()
    const viewportWidth = viewport.right - viewport.left - 16
    const viewportHeight = viewport.bottom - viewport.top - (16 + captionHeight)
    const viewportProportions = viewportHeight / viewportWidth
    const imageWidth = this.preloadImage.width
    const imageHeight = this.preloadImage.height
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
    this.img.src = this.preloadImage.url
    this.img.width = width
    this.img.height = height
    this.img.style.left = left
    this.img.style.top = top
    this.img.style.visibility = 'visible'
    if (this.showCaption) {
      this.caption.style.visibility = 'visible'
      this.caption.innerHTML = this.preloadImage.url
    } else {
      this.caption.style.visibility = 'hidden'
    }
    this.showIndex = this.preloadIndex
  }
}

export default Viewer
