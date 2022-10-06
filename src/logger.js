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
    console.log(this.timestamp(), ...args)
  }

  info(...args) {
    if (this.level < Logger.INFO) {
      return
    }
    console.log(this.timestamp(), ...args)
  }

  warn(...args) {
    if (this.level < Logger.WARN) {
      return
    }
    console.log(this.timestamp(), ...args)
  }

  error(...args) {
    if (this.level < Logger.ERROR) {
      return
    }
    console.log(this.timestamp(), ...args)
  }

  fatal(...args) {
    if (this.level < Logger.FATAL) {
      return
    }
    console.log(this.timestamp(), ...args)
  }

  timestamp() {
    return (new Date()).toJSON()
  }
}

Logger.FATAL = 0
Logger.ERROR = 1
Logger.WARN = 2
Logger.INFO = 3
Logger.DEBUG = 4
Logger.MOST_VERBOSE = Logger.DEBUG
Logger.LEAST_VERBOSE = Logger.FATAL

export default Logger
