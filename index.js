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

class PhotoSlideshow {
  constructor(window, viewer) {
    this.window = window
    this.viewer = viewer
    this._errors = null
    this.images = null
    this.img = null
    this.loadCheckInterval = null
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
    if (!this.ok) {
      return
    }
    this.img = document.createElement('img')
    this.img.src = ''
    this.viewer.append(this.img)
    this.preloader = new Image()
    this.preloader.onload = this.imageLoaded.bind(this)
    this.preloader.onerror = this.imageFailed.bind(this)
    this.loadConfig().then(() => {
      this.loadCheckInterval = setInterval(this.start.bind(this), 1000)
    })
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

  next() {
    let nextIndex
    if (this.index < this.images.length - 1) {
      nextIndex = this.index + 1
    } else {
      nextIndex = 0
    }
    this.preload(nextIndex)
  }

  preload(index) {
    const next = this.images[index]
    this.preloadIndex = index
    this.preloader.src = next.url
  }

  imageLoaded() {
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
    this.nextTimeout = null
    const viewport = this.viewer.getBoundingClientRect()
    const viewportWidth = viewport.right - viewport.left - 16
    const viewportHeight = viewport.bottom - viewport.top - 16
    const viewportProportions = viewportHeight / viewportWidth
    this.index = this.preloadIndex
    this.preloadIndex = null
    const image = this.images[this.index]
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
    console.error('imageFailed')
    // TODO: remove the current image from this.images
    // TODO: reset index if index was pointing at last image
    // TODO: call preload
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
