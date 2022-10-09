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
