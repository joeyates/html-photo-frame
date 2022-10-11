import PhotoSlideshow from './photo-slideshow.js'

const viewer = document.getElementById('viewer')
const slides = new PhotoSlideshow(window, viewer)
slides.run()
