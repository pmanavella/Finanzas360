// ============================================================
// libroDiario.cy.js — Tests E2E de Libro Diario
// Finanzas360 — Fase 3: Testing E2E
//
// TODO: Implementar en Fase QA cuando exista la base finanzas360_qa
//
// Flujos a implementar:
//   - Generar libro diario con datos
//   - Validar comportamiento sin registros (tabla vacía)
//   - Validar generación de PDF
//   - Validar filtros por fecha
// ============================================================

describe('Libro Diario', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/app')
    cy.navegarA('todos')
    cy.contains('h1', 'Todos los movimientos').should('be.visible')
  })

  it('abre el modal para generar Libro Diario', () => {
    cy.contains('button', 'Libro diario').click()

    cy.contains('h2', 'Generar Libro Diario').should('be.visible')
    cy.contains('label', 'Mes').should('be.visible')
    cy.contains('label', 'Año').should('be.visible')
    cy.contains('button', 'Revisar movimientos').should('be.visible')
  })

  it('muestra la revisión de movimientos del período seleccionado', () => {
    cy.contains('button', 'Libro diario').click()
    cy.contains('button', 'Revisar movimientos').click()

    cy.contains('Revisión').should('be.visible')
    cy.contains('FECHA').should('be.visible')
    cy.contains('TIPO').should('be.visible')
    cy.contains('CLASIFICACIÓN CONTABLE').should('be.visible')
    cy.contains('FUENTE / MODALIDAD').should('be.visible')
    cy.contains('button', 'Confirmar y generar PDF').should('be.visible')
  })

  it('permite cerrar el modal de Libro Diario', () => {
    cy.contains('button', 'Libro diario').click()
    cy.contains('h2', 'Generar Libro Diario').should('be.visible')

    cy.contains('button', 'Cancelar').click()
    cy.contains('h2', 'Generar Libro Diario').should('not.exist')
  })
})
