class ImageDetails {
  constructor(image, index, img) {
    this.image = image
    this.index = index
    this.img = img
    this.loadingCancelled = false
  }

  load(success, failure) {
    this.img.src = this.image.url
    this.img.decode()
      .then(() => {
        if (!this.loadingCancelled) {
          success.call(null, this)
        }
      })
      .catch((...args) => failure.call(null, this, ...args))
  }

  cancelLoading() {
    this.loadingCancelled = true
  }
}

export default ImageDetails
