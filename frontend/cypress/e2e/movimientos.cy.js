// ============================================================
// movimientos.cy.js — Tests E2E de Movimientos (Ingresos / Gastos)
// Finanzas360 — Fase 3: Testing E2E
//
// Selectores usados:
//   - data-testid="input-descripcion" → input descripción en FormMovimiento
//   - data-testid="input-monto"       → input monto en FormMovimiento
//   - button "Nuevo Ingreso"          → abre FormMovimiento desde Ingresos
//   - button "Nuevo Gasto"            → abre FormMovimiento desde Gastos
//   - button "Crear registro"         → submit de FormMovimiento
//   - button "Ingreso" / "Gasto"      → selector de tipo dentro del form
//   - input[type="date"]              → campo fecha
// ============================================================

describe('Movimientos — Ingresos', () => {

  beforeEach(() => {
    cy.login()
    cy.visit('/app')
    cy.navegarA('ingresos')
    cy.contains('h1', 'Ingresos').should('be.visible')
  })

  // ----------------------------------------------------------
  // Abrir formulario
  // ----------------------------------------------------------
  it('abre el formulario de nuevo ingreso', () => {
    cy.contains('button', 'Nuevo Ingreso').click()
    cy.contains('h2', 'Nuevo movimiento').should('be.visible')
  })

  it('cierra el formulario al hacer clic en Cancelar', () => {
    cy.contains('button', 'Nuevo Ingreso').click()
    cy.contains('h2', 'Nuevo movimiento').should('be.visible')
    cy.contains('button', 'Cancelar').click()
    cy.contains('h2', 'Nuevo movimiento').should('not.exist')
  })

  // ----------------------------------------------------------
  // Crear ingreso
  // ----------------------------------------------------------
  it('crea un ingreso y aparece en la tabla', () => {
    cy.fixture('movimiento').then((mov) => {
      cy.contains('button', 'Nuevo Ingreso').click()

      // Seleccionar tipo Ingreso (puede estar por defecto pero lo confirmamos)
      cy.contains('button', 'Ingreso').click()

      cy.get('[data-testid="input-descripcion"]').clear().type(mov.descripcion)
      cy.get('[data-testid="input-monto"]').clear().type(mov.monto)

      cy.contains('button', 'Crear registro').click()

      // Debe aparecer el mensaje de éxito o el modal cerrarse
      cy.contains('h2', 'Nuevo movimiento', { timeout: 8000 }).should('not.exist')
      // El ingreso debe aparecer en la tabla
      cy.contains(mov.descripcion).should('be.visible')
    })
  })

  // ----------------------------------------------------------
  // Validación de campo obligatorio
  // ----------------------------------------------------------
  it('muestra error al intentar guardar sin descripción', () => {
    cy.contains('button', 'Nuevo Ingreso').click()
    cy.contains('h2', 'Nuevo movimiento').should('be.visible')

    // Solo llenar monto, dejar descripción vacía
    cy.get('[data-testid="input-monto"]').clear().type('5000')

    cy.contains('button', 'Crear registro').click()

    // Debe aparecer el mensaje de error de descripción
    cy.contains('La descripción no puede estar vacía').should('be.visible')
    // El modal sigue abierto
    cy.contains('h2', 'Nuevo movimiento').should('be.visible')
  })

  it('muestra error al intentar guardar sin monto', () => {
    cy.contains('button', 'Nuevo Ingreso').click()
    cy.contains('h2', 'Nuevo movimiento').should('be.visible')

    cy.get('[data-testid="input-descripcion"]').type('Test sin monto')
    // No completar monto

    cy.contains('button', 'Crear registro').click()

    cy.contains('mayor a 0').should('be.visible')
    cy.contains('h2', 'Nuevo movimiento').should('be.visible')
  })

})

// ----------------------------------------------------------
// Gastos (verificación de tipo)
// ----------------------------------------------------------
describe('Movimientos — Gastos', () => {

  beforeEach(() => {
    cy.login()
    cy.visit('/app')
    cy.navegarA('gastos')
    cy.contains('h1', 'Gastos').should('be.visible')
  })

  it('abre el formulario de nuevo gasto', () => {
    cy.contains('button', 'Nuevo Gasto').click()
    cy.contains('h2', 'Nuevo movimiento').should('be.visible')
  })

  it('crea un gasto y aparece en la tabla', () => {
    cy.contains('button', 'Nuevo Gasto').click()

    // Confirmar que el tipo Gasto está activo
    cy.contains('button', 'Gasto').click()

    cy.get('[data-testid="input-descripcion"]').clear().type('Gasto Cypress Test')
    cy.get('[data-testid="input-monto"]').clear().type('1500')

    cy.contains('button', 'Crear registro').click()

    cy.contains('h2', 'Nuevo movimiento', { timeout: 8000 }).should('not.exist')
    cy.contains('Gasto Cypress Test').should('be.visible')
  })

})
