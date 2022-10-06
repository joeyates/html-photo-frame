import PhotoSlideshow from './photo-slideshow.js'

const viewer = document.getElementById('viewer')
const slides = new PhotoSlideshow(window, viewer)
if (slides.ok) {
  slides.run()
} else {
  const error = slides.error
  console.error(error)
  if (viewer) {
    viewer.innerHTML = error
  }
}
