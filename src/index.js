import Controller from './controller.js'

const viewer = document.getElementById('viewer')
const controller = new Controller(window, viewer)
controller.run()
