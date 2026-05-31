// ============================================================
// trazabilidad.cy.js — Tests E2E de Trazabilidad
// Finanzas360 — Fase 3: Testing E2E
//
// TODO: Implementar en Fase QA cuando exista la base finanzas360_qa
//
// Flujos a implementar:
//   - Abrir modal de trazabilidad desde un movimiento
//   - Validar visibilidad de created_by y created_at
//   - Validar historial de cambios
//   - Verificar que el endpoint GET /api/movimientos/trazabilidad
//     responde correctamente (solo admin)
// ============================================================

describe('Trazabilidad', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/app')
    cy.navegarA('todos')
    cy.contains('h1', 'Todos los movimientos').should('be.visible')
  })

  it('abre el modal de trazabilidad de movimientos', () => {
    cy.contains('button', 'Trazabilidad').should('be.visible').click()
  
    cy.contains('Trazabilidad de movimientos', { timeout: 10000 }).should('be.visible')
    cy.contains('registros', { timeout: 10000 }).should('be.visible')
  
    cy.contains('Gasto Cypress Test', { timeout: 10000 }).should('be.visible')
    cy.contains(Cypress.env('adminEmail')).should('be.visible')
  })

  it('muestra información de auditoría de movimientos existentes', () => {
    cy.contains('button', 'Trazabilidad').click()

    cy.contains(Cypress.env('adminEmail')).should('be.visible')
    cy.contains('@').should('be.visible')
  })

  it('permite cerrar el modal de trazabilidad', () => {
    cy.contains('button', 'Trazabilidad').click()
    cy.contains('Trazabilidad de movimientos').should('be.visible')

    cy.contains('button', 'Cerrar').click()
    cy.contains('Trazabilidad de movimientos').should('not.exist')
  })
})