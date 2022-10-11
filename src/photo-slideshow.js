import Images from './images.js'
import KeyWatcher from './key-watcher.js'
import Logger from './logger.js'

class PhotoSlideshow {
  constructor(window, element) {
    this.window = window
    this.element = element
    this.help = null
    this.keyWatcher = null
    this.notes = []
    this.status = null
    this.logger = new Logger()
    this.images = new Images(this.window, this.element, this.logger)
  }

  run() {
    const errors = []
    if (!this.window) {
      errors.push('window is null')
    }
    if (!this.element) {
      errors.push('element is null')
    }
    if (errors.length > 0) {
      const error = errors.join("\n")
      this.logger.error(error)
      if (this.element) {
        this.element.innerHTML = error
      }
      return
    }
    this.window.addEventListener('resize', this.images.resize.bind(this.images))
    this.images.addEventListener('error', this.imagesError.bind(this))
    this.images.addEventListener('updateStatus', this.updateStatus.bind(this))
    this.images.start()
    this.setupKeyWatcher()
  }

  imagesError(error) {
    this.logger.error(error)
    this.element.innerHTML = error
  }

  setupKeyWatcher() {
    this.keyWatcher = new KeyWatcher(this.window.document, this.logger)
    this.keyWatcher.addEventListener('c', this.images.toggleCaptions.bind(this.images))
    this.keyWatcher.addEventListener('f', this.images.toggleFocusMode.bind(this.images))
    this.keyWatcher.addEventListener('del', this.images.removeCurrent.bind(this.images))
    this.keyWatcher.addEventListener('h', this.toggleHelp.bind(this))
    this.keyWatcher.addEventListener('l', this.listNotes.bind(this))
    this.keyWatcher.addEventListener('left', this.images.goToPrevious.bind(this.images))
    this.keyWatcher.addEventListener('minus', this.images.slowDown.bind(this.images))
    this.keyWatcher.addEventListener('n', this.addNote.bind(this))
    this.keyWatcher.addEventListener('plus', this.images.speedUp.bind(this.images))
    this.keyWatcher.addEventListener('q', this.lessVerbose.bind(this))
    this.keyWatcher.addEventListener('r', this.resetNotes.bind(this))
    this.keyWatcher.addEventListener('right', this.images.goToNext.bind(this.images))
    this.keyWatcher.addEventListener('space', this.images.togglePause.bind(this.images))
    this.keyWatcher.addEventListener('v', this.moreVerbose.bind(this))
    this.keyWatcher.run()
  }

  addNote() {
    const image = this.images.currentImage
    const exists = this.notes.findIndex(url => url === image.url)
    if (exists !== -1) {
      return
    }
    this.logger.debug(`Adding note for '${image.url}'`)
    this.notes.push(image.url)
  }

  lessVerbose() {
    const changed = this.logger.lessVerbose()
    if (changed) {
      this.logger.debug(`Logger level reduced to ${this.logger.level}`)
    } else {
      this.logger.debug(`Logger level unchanged: ${this.logger.level}`)
    }
    this.updateStatus()
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
    this.updateStatus()
  }

  resetNotes() {
    this.notes = []
  }

  toggleHelp() {
    if (this.help) {
      this.help.remove()
      this.help = null
    } else {
      this.help = this.window.document.createElement('p')
      this.help.classList.add('help')
      this.help.innerHTML = `
      c - show/hide captions,<br>
      f - enter/leave 'focus' mode<br>
      h - show/hide this help,<br>
      l - list notes,<br>
      n - add current image to list of notes,<br>
      q - show less logging messages,<br>
      r - reset (clear) the list of notes,<br>
      v - show more logging messages,<br>
      ← - go to previous image,<br>
      → - go to next image,<br>
      + - change slides more frequently,<br>
      - - change slides less frequently,<br>
      &lt;space> - pause/restart slideshow,<br>
      &lt;del> - remove current image
      `
      this.element.append(this.help)
    }
  }

  updateStatus() {
    if (this.status) {
      this.status.remove()
      this.status = null
    }
    let html = ''
    if (this.images.showCaption) {
      html += '<h1>C</h1>'
    }
    if (this.images.inFocusMode) {
      html += '<h1>F</h1>'
    }
    if (this.images.paused) {
      html += '<h1>P</h1>'
    }
    if (this.logger.level === Logger.DEBUG) {
      html += '<h1>V</h1>'
    }
    this.status = this.window.document.createElement('p')
    this.status.classList.add('status')
    this.status.innerHTML = html
    this.element.append(this.status)
  }
}

export default PhotoSlideshow
