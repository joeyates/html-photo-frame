class ImageDetails {
  static clone(details) {
    return new ImageDetails(details.image, details.index, details.img)
  }

  constructor(image, index, img) {
    this.image = image
    this.index = index
    this.img = img
  }

  load(success, failure) {
    this.img.src = this.image.url
    this.img.decode()
      .then(() => success.call(null, this))
      .catch((...args) => failure.call(null, this, ...args))
  }
}

export default ImageDetails
