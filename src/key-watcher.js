import EventEmitter from './event-emitter.js'

const MAPPING = {
  32: 'space',
  37: 'left',
  39: 'right',
  46: 'del',
  61: 'plus',
  67: 'c',
  76: 'l',
  78: 'n',
  81: 'q',
  82: 'r',
  86: 'v',
  173: 'minus'
}

class KeyWatcher extends EventEmitter {
  constructor(document, logger) {
    super()
    this.document = document
    this.logger = logger
  }

  run() {
    document.onkeydown = this.keydown.bind(this)
  }

  keydown(evt) {
    let event = MAPPING[evt.keyCode]
    if (!event) {
      this.logger.debug(`Unhandled keypress: ${evt.keyCode}`)
    }
    if (evt.ctrlKey) {
      event = `Ctrl+${event}`
    }
    if (evt.shiftKey) {
      event = `Shift+${event}`
    }
    this.emit(event)
  }
}

export default KeyWatcher
