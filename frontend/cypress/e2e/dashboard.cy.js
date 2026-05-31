describe('Dashboard', () => {
    beforeEach(() => {
      cy.login()
      cy.visit('/app')
      cy.contains('h1', 'Resumen financiero').should('be.visible')
    })
  
    it('renderiza el dashboard principal', () => {
      cy.contains('Resumen financiero').should('be.visible')
      cy.contains('Ingresos del mes').should('be.visible')
      cy.contains('Gastos del mes').should('be.visible')
      cy.contains('Balance neto').should('be.visible')
      cy.contains('Comprobantes').should('be.visible')
    })
  
    it('muestra la sección de movimientos recientes', () => {
      cy.contains('Movimientos recientes').should('be.visible')
      cy.contains('Últimos registros').should('be.visible')
      cy.contains('Todos').should('be.visible')
      cy.contains('Ingresos').should('be.visible')
      cy.contains('Gastos').should('be.visible')
    })
  
    it('permite acceder a ingresos desde el dashboard', () => {
      cy.contains('button', 'Nuevo Ingreso').click()
      cy.contains('h1', 'Ingresos', { timeout: 10000 }).should('be.visible')
    })
  
    it('permite acceder a gastos desde el dashboard', () => {
      cy.contains('button', 'Nuevo Gasto').click()
      cy.contains('h1', 'Gastos', { timeout: 10000 }).should('be.visible')
    })
  })