// ============================================================
// auth.cy.js — Tests E2E de Autenticación
// Finanzas360 — Fase 3: Testing E2E
//
// Selectores usados (sin data-testid):
//   - input[placeholder="admin@finanzas360.com"] → campo email
//   - input[type="password"]                     → campo contraseña
//   - button "Ingresar al sistema"               → botón de submit
//   - .bg-red-50                                 → contenedor de error
// ============================================================

describe('Autenticación — Login', () => {

  beforeEach(() => {
    cy.visit('/login')
  })

  // ----------------------------------------------------------
  // Renderizado del formulario
  // ----------------------------------------------------------
  it('muestra el formulario de login con todos sus elementos', () => {
    cy.contains('h2', 'Iniciar sesión').should('be.visible')
    cy.get('input[placeholder="admin@finanzas360.com"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.contains('button', 'Ingresar al sistema').should('be.visible')
  })

  // ----------------------------------------------------------
  // Login exitoso
  // ----------------------------------------------------------
  it('login exitoso con credenciales válidas redirige a /app', () => {
    cy.get('input[placeholder="admin@finanzas360.com"]')
      .type(Cypress.env('adminEmail'))

    cy.get('input[type="password"]')
      .type(Cypress.env('adminPassword'))

    cy.contains('button', 'Ingresar al sistema').click()

    cy.url({ timeout: 10000 }).should('include', '/app')

    // Verificar que el token quedó en localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.not.be.null
    })
  })

  // ----------------------------------------------------------
  // Login inválido
  // ----------------------------------------------------------
  it('credenciales incorrectas muestran mensaje de error', () => {
    cy.get('input[placeholder="admin@finanzas360.com"]')
      .type('usuarioinexistente@test.com')

    cy.get('input[type="password"]')
      .type('contraseñaincorrecta')

    cy.contains('button', 'Ingresar al sistema').click()

    cy.get('.bg-red-50').should('be.visible')
    // Verificar que no hubo redirección
    cy.url().should('include', '/login')
  })

  // ----------------------------------------------------------
  // Validación de campo email vacío
  // ----------------------------------------------------------
  it('campos vacíos muestran error de validación de email', () => {
    cy.contains('button', 'Ingresar al sistema').click()
    cy.contains('Ingresá un correo electrónico válido').should('be.visible')
    cy.url().should('include', '/login')
  })

  // ----------------------------------------------------------
  // Validación de email con formato inválido
  // ----------------------------------------------------------
  it('email con formato inválido muestra error de validación', () => {
    cy.get('input[placeholder="admin@finanzas360.com"]')
      .type('no-es-un-email')

    cy.contains('button', 'Ingresar al sistema').click()

    cy.contains('Ingresá un correo electrónico válido').should('be.visible')
  })

  // ----------------------------------------------------------
  // Validación de contraseña muy corta
  // ----------------------------------------------------------
  it('contraseña de menos de 6 caracteres muestra error de validación', () => {
    cy.get('input[placeholder="admin@finanzas360.com"]')
      .type('admin@finanzas360.com')

    cy.get('input[type="password"]')
      .type('123') // menor a MIN_PASSWORD_LENGTH (6)

    cy.contains('button', 'Ingresar al sistema').click()

    cy.contains('al menos').should('be.visible')
  })

  // ----------------------------------------------------------
  // Token no persiste si hay error
  // ----------------------------------------------------------
  it('login fallido no guarda token en localStorage', () => {
    cy.get('input[placeholder="admin@finanzas360.com"]')
      .type('incorrecto@finanzas360.com')

    cy.get('input[type="password"]')
      .type('wrongpassword')

    cy.contains('button', 'Ingresar al sistema').click()

    cy.get('.bg-red-50').should('be.visible')

    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null
    })
  })

})
