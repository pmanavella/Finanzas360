// ============================================================
// usuarios.cy.js — Tests E2E de Gestión de Usuarios
// Finanzas360 — Fase 3: Testing E2E
//
// Requisito: usuario con rol 'admin' (solo admin accede a Usuarios)
//
// Selectores usados:
//   - data-testid="input-nombre"   → input nombre en modal
//   - data-testid="input-email"    → input email en modal
//   - data-testid="input-password" → input password en modal
//   - data-testid="select-rol"     → select rol en modal
//   - button "Nuevo usuario"       → abre el modal
//   - button "Guardar"             → submit del formulario
//
// Nota sobre el botón de acciones (MoreVertical):
//   Tiene opacity-0 por CSS group-hover. Se usa { force: true }
//   porque Cypress no activa :hover via CSS. Esto es esperado y seguro.
// ============================================================

describe('Gestión de usuarios', () => {

  beforeEach(() => {
    // Autenticación programática — no pasa por la UI de login
    cy.login()
    cy.visit('/app')
    // Navegar a Usuarios via dropdown de Administración
    cy.navegarA('usuarios')
    cy.contains('h2', 'Gestión de usuarios').should('be.visible')
  })

  // ----------------------------------------------------------
  // Modal "Nuevo usuario"
  // ----------------------------------------------------------
  it('abre el modal "Nuevo usuario" al hacer clic en el botón', () => {
    cy.contains('button', 'Nuevo usuario').click()
    cy.contains('h3', 'Nuevo usuario').should('be.visible')
  })

  it('cierra el modal al hacer clic en Cancelar', () => {
    cy.contains('button', 'Nuevo usuario').click()
    cy.contains('h3', 'Nuevo usuario').should('be.visible')
    cy.contains('button', 'Cancelar').click()
    cy.contains('h3', 'Nuevo usuario').should('not.exist')
  })

  // ----------------------------------------------------------
  // Crear usuario
  // ----------------------------------------------------------
  it('crea un nuevo usuario y aparece en la tabla', () => {
    // Email único con timestamp para evitar duplicados entre ejecuciones
    const emailUnico = `cypress.${Date.now()}@finanzas360.com`

    cy.contains('button', 'Nuevo usuario').click()
    cy.contains('h3', 'Nuevo usuario').should('be.visible')

    cy.get('[data-testid="input-nombre"]').type('Cypress Test')
    cy.get('[data-testid="input-email"]').type(emailUnico)
    cy.get('[data-testid="input-password"]').type('cypress123')
    cy.get('[data-testid="select-rol"]').select('usuario')

    cy.contains('button', 'Guardar').click()

    // El modal debe cerrarse
    cy.contains('h3', 'Nuevo usuario').should('not.exist')
    // El nuevo usuario debe aparecer en la tabla
    cy.contains('Cypress Test').should('be.visible')
  })

  // ----------------------------------------------------------
  // Validación de formulario vacío
  // ----------------------------------------------------------
  it('muestra error de validación al enviar formulario sin nombre', () => {
    cy.contains('button', 'Nuevo usuario').click()
    cy.contains('h3', 'Nuevo usuario').should('be.visible')

    // Enviar sin completar ningún campo
    cy.contains('button', 'Guardar').click()

    // Debe aparecer al menos un mensaje de error de campo
    cy.get('p.text-red-500').should('be.visible')
    // El modal sigue abierto
    cy.contains('h3', 'Nuevo usuario').should('be.visible')
  })

  // ----------------------------------------------------------
  // Eliminación lógica
  // ----------------------------------------------------------
  it('eliminar usuario lo quita del listado', () => {
    const emailUnico = `cypress.del.${Date.now()}@finanzas360.com`

    // 1. Crear el usuario que después se eliminará
    cy.contains('button', 'Nuevo usuario').click()
    cy.get('[data-testid="input-nombre"]').type('Cypress Eliminar')
    cy.get('[data-testid="input-email"]').type(emailUnico)
    cy.get('[data-testid="input-password"]').type('cypress123')
    cy.get('[data-testid="select-rol"]').select('usuario')
    cy.contains('button', 'Guardar').click()
    cy.contains('Cypress Eliminar').should('be.visible')

    // 2. Clic en el botón de acciones de esa fila
    //    (force: true porque el botón es opacity-0 por CSS group-hover)
    cy.contains('tr', 'Cypress Eliminar')
      .find('button')
      .click({ force: true })

    // 3. Clic en "Eliminar" del dropdown
    //    Cypress auto-acepta window.confirm por defecto
    cy.contains('button', 'Eliminar').click()

    // 4. El usuario ya no debe aparecer en la tabla
    cy.contains('Cypress Eliminar').should('not.exist')
  })

})
