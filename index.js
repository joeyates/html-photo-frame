const shuffle = array => {
  const shuffled = new Array(array.length)
  let i = 0
  while (array.length > 0) {
    const j = Math.floor(Math.random() * array.length)
    shuffled[i] = array[j]
    i++
    array.splice(j, 1)
  }
  return shuffled
}

class Logger {
  constructor() {
    this.level = Logger.INFO
  }

  moreVerbose() {
    if (this.level >= Logger.MOST_VERBOSE) {
      return false
    }
    this.level++
    return true
  }

  lessVerbose() {
    if (this.level <= Logger.LEAST_VERBOSE) {
      return false
    }
    this.level--
    return true
  }

  debug(...args) {
    if (this.level < Logger.DEBUG) {
      return
    }
    console.log((new Date()).toJSON(), ...args)
  }

  info(...args) {
    if (this.level < Logger.INFO) {
      return
    }
    console.log(...args)
  }

  warn(...args) {
    if (this.level < Logger.WARN) {
      return
    }
    console.log(...args)
  }

  error(...args) {
    if (this.level < Logger.ERROR) {
      return
    }
    console.log(...args)
  }

  fatal(...args) {
    if (this.level < Logger.FATAL) {
      return
    }
    console.log(...args)
  }
}

Logger.FATAL = 0
Logger.ERROR = 1
Logger.WARN = 2
Logger.INFO = 3
Logger.DEBUG = 4
Logger.MOST_VERBOSE = Logger.DEBUG
Logger.LEAST_VERBOSE = Logger.FATAL

class PhotoSlideshow {
  constructor(window, viewer) {
    this.window = window
    this.viewer = viewer
    this._errors = null
    this.images = null
    this.img = null
    this.loadCheckInterval = null
    this.logger = null
    this.index = null
    this.showNextTimeout = null
    this.preloader = null
    this.preloadIndex = null
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
    if (!this.viewer) {
      this._errors.push('viewer is null')
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
    this.img = document.createElement('img')
    this.img.src = ''
    this.viewer.append(this.img)
    this.preloader = new Image()
    this.preloader.onload = this.imageLoaded.bind(this)
    this.preloader.onerror = this.imageFailed.bind(this)
    this.captureInput()
    this.loadConfig().then(() => {
      this.loadCheckInterval = setInterval(this.start.bind(this), 1000)
    })
  }

  captureInput() {
    document.onkeydown = this.keydown.bind(this)
  }

  keydown(evt) {
    evt = evt || window.event
    switch(evt.keyCode) {
    case 32: { // <spacebar>
      if (this.showNextTimeout) {
        // Pause
        this.stopTimeout()
      } else {
        // Restart
        this.showPreloadingImageImmediatly()
        this.preload(this.index)
      }
      break
    }
    case 37: { // <-
      this.showPreloadingImageImmediatly()
      this.previous()
      break
    }
    case 39: { // ->
      this.showPreloadingImageImmediatly()
      this.next()
      break
    }
    case 46: { // <del>
      this.stopTimeout()
      this.removeCurrent()
      this.showPreloadingImageImmediatly()
      this.preload(this.index)
      break
    }
    case 61: { // +
      // Speed up changes
      if (this.timeout <= 500) {
        return
      }
      this.timeout = this.timeout - 500
      break
    }
    case 81: { // q
      const changed = this.logger.lessVerbose()
      if (changed) {
        console.debug(`Logger level reduced to ${this.logger.level}`)
      } else {
        console.debug(`Logger level unchanged: ${this.logger.level}`)
      }
      break
    }
    case 86: { // v
      const changed = this.logger.moreVerbose()
      if (changed) {
        console.debug(`Logger level increased to ${this.logger.level}`)
      } else {
        console.debug(`Logger level unchanged: ${this.logger.level}`)
      }
      break
    }
    case 173: { // -
      // Slow down changes
      this.timeout = this.timeout + 500
      console.debug(`Slide change timeout increased to ${this.timeout}`)
      break
    }
    default:
      this.logger.debug(`Unhandled keypress: ${evt.keyCode}`)
    }
  }

  removeCurrent() {
    if (this.images.length <= 1) {
      this.logger.error("Can't remove last image")
      return
    }
    const image = this.images[this.index]
    this.logger.debug(`Removing image ${this.index}/${this.images.length} '${image.url}'`)
    this.images.splice(this.index, 1)
    if (this.index === this.images.length + 1) {
      this.index = 0
    }
  }

  loadConfig() {
    return new Promise((resolve, _reject) => {
      fetch(this.configURL)
        .then(response => response.json())
        .then(data => {
          this.images = shuffle(data.images)
          this.timeout = data.timeout || PhotoSlideshow.DEFAULT_TIMEOUT
          resolve()
        })
    })
  }

  start() {
    if (!this.images) {
      console.log('No config yet')
      return
    }
    clearInterval(this.loadCheckInterval)
    this.index = 0
    this.preload(0)
  }

  previous() {
    let nextIndex
    if (this.index < 1) {
      nextIndex = this.images.length - 1
    } else {
      nextIndex = this.index - 1
    }
    this.preload(nextIndex)
  }

  next() {
    let nextIndex
    if (this.index < this.images.length - 1) {
      nextIndex = this.index + 1
      this.logger.debug('Incrementing image index')
    } else {
      nextIndex = 0
      this.logger.debug('Reached last image, looping back to first')
    }
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
    this.preloadIndex = index
    this.preloader.src = next.url
  }

  showPreloadingImageImmediatly() {
    this.previousShow = null
  }

  imageLoaded() {
    const image = this.images[this.preloadIndex]
    this.logger.debug(`Loading complete for image ${this.preloadIndex} '${image.url}'`)
    if (!this.previousShow) {
      this.showNext()
      return
    }
    // We've waited for the image to download
    const now = new Date()
    const elapsed = now - this.previousShow
    // Have we waited more than the usual wait time between images?
    const remainder = this.timeout - elapsed
    if (remainder < 0) {
      this.showNext()
      return
    }
    // Wait the remainder of the time
    this.showNextTimeout = setTimeout(this.showNext.bind(this), remainder)
  }

  showNext() {
    this.index = this.preloadIndex
    this.preloadIndex = null
    const image = this.images[this.index]
    this.logger.debug(`Showing preloaded image: '${image.url}'`)
    this.showNextTimeout = null
    const viewport = this.viewer.getBoundingClientRect()
    const viewportWidth = viewport.right - viewport.left - 16
    const viewportHeight = viewport.bottom - viewport.top - 16
    const viewportProportions = viewportHeight / viewportWidth
    const imageWidth = image.width
    const imageHeight = image.height
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
    this.img.src = this.preloader.src
    this.img.width = width
    this.img.height = height
    this.img.style.left = left
    this.img.style.top = top
    this.img.style.visibility = 'visible'
    this.previousShow = new Date
    this.next()
  }

  imageFailed() {
    const image = this.images[this.index]
    this.logger.warn(`Failed to download image '${image.url}'`)
    this.removeCurrent()
    this.showPreloadingImageImmediatly()
    this.preload(this.index)
  }
}

PhotoSlideshow.DEFAULT_TIMEOUT = 5000

const viewer = document.getElementById('viewer')
const slides = new PhotoSlideshow(window, viewer)
if (slides.ok) {
  slides.run()
} else {
  const error = slides.error
  console.error(error)
  if (viewer) {
    viewer.innerHTML = error
  }
}
