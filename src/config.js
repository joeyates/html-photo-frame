import EventEmitter from './event-emitter.js'
import shuffle from './shuffle.js'

const DEFAULT_TIMEOUT = 5000

class Config extends EventEmitter {
  constructor(window) {
    super()
    this.window = window
    this.images = null
    this.timeout = null
  }

  get url() {
    const search = this.window.location.search
    if (search === '') {
      return null
    }
    const params = new URLSearchParams(search)
    return params.get('config')
  }

  load() {
    fetch(this.url)
      .then(response => {
        switch(response.status) {
        case 200:
          return response.json()
        case 404:
          throw `Configuration file '${this.configURL}' not found`
        default:
          throw `Unexpected response status: ${response.status}`
        }
      })
      .then(data => {
        this.images = shuffle(data.images)
        this.timeout = data.timeout || DEFAULT_TIMEOUT
        this.emit('loaded')
      })
      .catch(error => {
        this.emit('failed', error)
      })
  }
}

export default Config
