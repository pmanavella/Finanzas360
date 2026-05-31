describe('Suscripciones', () => {
    beforeEach(() => {
      cy.login()
      cy.visit('/app')
      cy.navegarA('suscripciones')
      cy.contains(/Suscripciones/i, { timeout: 10000 }).should('be.visible')
    })
  
    afterEach(() => {
      cy.document().then((doc) => {
        const body = doc.body
  
        if (body && body.querySelector('.modal-overlay')) {
          cy.contains('button', 'Cancelar').click()
        }
      })
    })
  
    it('abre el formulario de nueva suscripción', () => {
      cy.contains('button', /Nueva suscripción|Nueva Suscripción/i).click()
  
      cy.contains(/Nueva suscripción/i).should('be.visible')
      cy.contains(/Nombre/i).should('be.visible')
      cy.contains(/Monto/i).should('be.visible')
      cy.contains(/Moneda/i).should('be.visible')
      cy.contains(/Frecuencia/i).should('be.visible')
  
      cy.contains('button', 'Cancelar').click()
    })
  
    it('permite completar los campos principales de una suscripción', () => {
      const nombre = `Suscripción Cypress ${Date.now()}`
  
      cy.contains('button', /Nueva suscripción|Nueva Suscripción/i).click()
      cy.contains(/Nueva suscripción/i).should('be.visible')
  
      cy.get('.modal-body').within(() => {
        cy.get('input').eq(0).clear().type(nombre)
        cy.get('input').eq(1).clear().type('Plan Cypress QA')
        cy.get('input').eq(2).clear().type('Proveedor Cypress')
        cy.get('input[type="number"]').first().clear().type('5000')
  
        cy.contains('button', 'ARS').should('be.visible')
        cy.contains('button', 'USD').should('be.visible')
        cy.contains('button', 'Activa').should('be.visible')
        cy.contains('button', 'Pausada').should('be.visible')
        cy.contains('button', 'Cancelada').should('be.visible')
      })
  
      cy.contains('button', 'Cancelar').click()
    })
  
    it('muestra validación al intentar guardar sin nombre', () => {
      cy.contains('button', /Nueva suscripción|Nueva Suscripción/i).click()
  
      cy.contains('button', 'Crear suscripción').click()
  
      cy.contains(/nombre|obligatorio|requerido|completá/i).should('be.visible')
    })
  })