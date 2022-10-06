import EventEmitter from './event-emitter.js'

// Character codes
const DEL = 46
const LEFT_ARROW = 37
const LETTER_C = 67
const LETTER_Q = 81
const LETTER_V = 86
const MINUS = 173
const PLUS = 61
const RIGHT_ARROW = 39
const SPACE = 32

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
    switch(evt.keyCode) {
    case SPACE:
      this.emit('space')
      break
    case LEFT_ARROW:
      this.emit('left')
      break
    case RIGHT_ARROW:
      this.emit('right')
      break
    case DEL:
      this.emit('del')
      break
    case PLUS:
      this.emit('plus')
      break
    case LETTER_C:
      this.emit('c')
      break
    case LETTER_Q:
      this.emit('q')
      break
    case LETTER_V:
      this.emit('v')
      break
    case MINUS:
      this.emit('minus')
      break
    default:
      this.logger.debug(`Unhandled keypress: ${evt.keyCode}`)
    }
  }
}

export default KeyWatcher
