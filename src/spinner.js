// Spinner SVG and CSS from https://codepen.io/supah/pen/BjYLdW

class Spinner {
  constructor(parent) {
    this.parent = parent
  }

  show() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.svg.setAttribute('viewBox', '0 0 50 50')
    this.svg.classList.add('spinner')
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', '25')
    circle.setAttribute('cy', '25')
    circle.setAttribute('r', '20')
    circle.setAttribute('stroke-width', '5')
    this.svg.appendChild(circle)
    this.parent.appendChild(this.svg)
  }

  hide() {
    if (this.svg) {
      this.svg.remove()
      this.svg = null
    }
  }
}

export default Spinner
