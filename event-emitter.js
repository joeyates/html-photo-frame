class EventEmitter {
  constructor() {
    this.events = {}
  }

  addEventListener(name, callback) {
    this.events[name] = callback
  }

  emit(name, ...args) {
    const callback = this.events[name]
    if (!callback) {
      return
    }
    callback.call(...args)
  }
}

export default EventEmitter
