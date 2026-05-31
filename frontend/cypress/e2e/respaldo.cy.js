describe('Respaldo', () => {
    beforeEach(() => {
      cy.login()
      cy.visit('/app')
      cy.navegarA('respaldo')
      cy.contains('h1', 'Respaldo').should('be.visible')
    })
  
    it('abre la vista de respaldo', () => {
      cy.contains('Respaldo').should('be.visible')
    })
  
    it('muestra opciones de exportación', () => {
      cy.contains(/JSON|json/).should('be.visible')
      cy.contains(/XLSX|Excel|xlsx/i).should('be.visible')
    })
  
    it('permite seleccionar formato JSON', () => {
      cy.contains(/JSON/i).click()
      cy.contains(/JSON/i).should('be.visible')
    })
  
    it('permite seleccionar formato XLSX o Excel', () => {
      cy.contains(/XLSX|Excel/i).click()
      cy.contains(/XLSX|Excel/i).should('be.visible')
    })
  
    it('muestra opción para importar respaldo', () => {
      cy.contains(/Importar|Cargar/i).should('be.visible')
    })
  })