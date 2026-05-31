// ============================================================
// commands.js — Comandos personalizados de Cypress
// Finanzas360 — Fase 3: Testing E2E
// ============================================================

/**
 * cy.login([email], [password])
 *
 * Autenticación programática: hace POST al backend para obtener
 * un JWT real y lo guarda en localStorage. Evita pasar por la UI
 * de login en cada test que lo requiere.
 *
 * Requiere:
 *   - Backend corriendo en Cypress.env('apiUrl')
 *   - cypress.env.json con adminEmail y adminPassword configurados
 */
Cypress.Commands.add('login', (email, password) => {
  const userEmail = email ?? Cypress.env('adminEmail')
  const userPassword = password ?? Cypress.env('adminPassword')

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login`,
    body: { email: userEmail, password: userPassword },
    failOnStatusCode: true,
  }).then(({ body }) => {
    // localStorage.setItem() aquí afectaría el frame del Cypress runner,
    // NO el localStorage de localhost:5173 donde corre la app.
    // cy.visit() establece localhost:5173 como origen del AUT, y
    // cy.window() da acceso al window real de la app para setear el token.
    cy.visit('/login')
    cy.window().then((win) => {
      win.localStorage.setItem('token', body.token)
      win.localStorage.setItem('user', JSON.stringify(body.user))
    })
  })
})

/**
 * cy.navegarA(paginaId)
 *
 * Navega dentro de /app usando el menú dropdown de escritorio.
 * El navbar de Finanzas360 usa onMouseEnter para abrir dropdowns,
 * por eso se usa trigger('mouseenter') en lugar de click en el grupo.
 *
 * Ejemplos de paginaId válidos:
 *   'ingresos', 'gastos', 'todos', 'deudas', 'salarios',
 *   'suscripciones', 'comprobantes', 'excel', 'usuarios', 'respaldo'
 */

Cypress.Commands.add('navegarA', (paginaId) => {
  const grupos = {
    ingresos:      'Movimientos',
    gastos:        'Movimientos',
    todos:         'Movimientos',
    deudas:        'Movimientos',
    salarios:      'Movimientos',
    suscripciones: 'Movimientos',
    comprobantes:  'Documentos',
    excel:         'Documentos',
    usuarios:      'Administración',
    respaldo:      'Administración',
  }

  const labels = {
    ingresos:      'Ingresos',
    gastos:        'Gastos',
    todos:         'Todos',
    deudas:        'Deudas',
    salarios:      'Salarios',
    suscripciones: 'Suscripciones',
    comprobantes:  'Comprobantes',
    excel:         'Importar Excel',
    usuarios:      'Usuarios',
    respaldo:      'Respaldo',
  }

  const grupo = grupos[paginaId]
  const label = labels[paginaId]

  if (!grupo) {
    // Dashboard es un link directo, no está en un dropdown
    cy.get('nav').contains('button', 'Dashboard').click()
    return
  }

  // Abrir el dropdown del grupo con mouseenter
  // cy.get('nav').contains('button', grupo).parent().trigger('mouseenter')
  // Hacer clic en el ítem del dropdown
  // cy.get('nav').contains('button', label).click()
  // cy.contains('button', label, { timeout: 10000 }).click()
  cy.get('nav')
    .contains('button', grupo)
    .trigger('mouseover', { force: true })
    .trigger('mouseenter', { force: true })

  cy.contains(label, { timeout: 10000 })
    .should('be.visible')
    .click({ force: true })
})
