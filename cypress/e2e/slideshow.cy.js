context('Without a config parameter', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('shows an error', () => {
    cy.get('#viewer').should(e => {
      expect(e).to.contain('supply a config')
    })
  })
})

context('With a valid config', () => {
  beforeEach(() => {
    cy.visit('/?config=/cypress/fixtures/conf.json')
  })

  it('shows images', () => {
    cy.get('#viewer img').should('have.attr', 'src').should('eq', '/cypress/fixtures/camera.jpg')
  })
})
