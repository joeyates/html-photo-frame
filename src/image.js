class Image {
  constructor({url, caption}) {
    this.url = url
    this.caption = caption
  }

  set caption(value) {
    this._caption = value
  }

  get caption() {
    return this._caption || this.url
  }
}

export default Image
