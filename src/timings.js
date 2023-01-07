class Timings {
  constructor({logger}) {
    this.logger = logger
    this.previous = new Date()
    this.timings = []
  }

  add({reason, index, url}) {
    const now = new Date()
    const elapsed = (now - this.previous) / 1000
    this.timings.push({index, elapsed, reason, url})
    this.previous = now
  }

  log() {
    this.logger.table(this.timings)
  }
}

export default Timings
