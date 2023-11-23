import Slideshow from './slideshow.js'
import KeyWatcher from './key-watcher.js'
import Logger from './logger.js'

class Controller {
  constructor(window, element) {
    this.window = window
    this.element = element
    this.help = null
    this.keyWatcher = null
    this.notes = []
    this.status = null
    this.logger = new Logger()
    this.slideshow = new Slideshow(this.window, this.element, this.logger)
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
    this.window.addEventListener('resize', this.slideshow.resize.bind(this.slideshow))
    this.slideshow.addEventListener('error', this.imagesError.bind(this))
    this.slideshow.addEventListener('missingImage', this.missingImage.bind(this))
    this.slideshow.addEventListener('updateStatus', this.updateStatus.bind(this))
    this.slideshow.start()
    this.setupKeyWatcher()
  }

  imagesError(error) {
    this.logger.error(error)
    this.element.innerHTML = error
  }

  missingImage(image) {
    this.notes.push(`Missing ${image.url}`)
  }

  setupKeyWatcher() {
    this.keyWatcher = new KeyWatcher(this.window.document, this.logger)
    this.keyWatcher.addEventListener('c', this.slideshow.toggleCaptions.bind(this.slideshow))
    this.keyWatcher.addEventListener('f', this.slideshow.toggleFocusMode.bind(this.slideshow))
    this.keyWatcher.addEventListener('del', this.slideshow.removeCurrent.bind(this.slideshow))
    this.keyWatcher.addEventListener('h', this.toggleHelp.bind(this))
    this.keyWatcher.addEventListener('l', this.listNotes.bind(this))
    this.keyWatcher.addEventListener('left', this.slideshow.goToPrevious.bind(this.slideshow))
    this.keyWatcher.addEventListener('minus', this.slideshow.slowDown.bind(this.slideshow))
    this.keyWatcher.addEventListener('n', this.addNote.bind(this))
    this.keyWatcher.addEventListener('plus', this.slideshow.speedUp.bind(this.slideshow))
    this.keyWatcher.addEventListener('q', this.lessVerbose.bind(this))
    this.keyWatcher.addEventListener('r', this.resetNotes.bind(this))
    this.keyWatcher.addEventListener('right', this.slideshow.goToNext.bind(this.slideshow))
    this.keyWatcher.addEventListener('space', this.slideshow.togglePause.bind(this.slideshow))
    this.keyWatcher.addEventListener('v', this.moreVerbose.bind(this))
    this.keyWatcher.run()
  }

  addNote() {
    const image = this.slideshow.currentImage
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
      n - add current image URL to list of notes,<br>
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
    if (this.slideshow.showCaption) {
      html += '<h1>C</h1>'
    }
    if (this.slideshow.inFocusMode) {
      html += '<h1>F</h1>'
    }
    if (this.slideshow.paused) {
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

export default Controller
