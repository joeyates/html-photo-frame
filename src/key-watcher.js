import EventEmitter from './event-emitter.js'

const MAPPING = {
  32: 'space',
  37: 'left',
  39: 'right',
  46: 'del',
  61: 'plus',
  65: 'a',
  66: 'b',
  67: 'c',
  68: 'd',
  69: 'e',
  70: 'f',
  71: 'g',
  72: 'h',
  73: 'i',
  74: 'j',
  75: 'k',
  76: 'l',
  77: 'm',
  78: 'n',
  79: 'o',
  80: 'p',
  81: 'q',
  82: 'r',
  83: 's',
  84: 't',
  85: 'u',
  86: 'v',
  87: 'w',
  88: 'x',
  89: 'y',
  90: 'z',
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
