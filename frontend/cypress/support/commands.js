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
    localStorage.setItem('token', body.token)
    localStorage.setItem('user', JSON.stringify(body.user))
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
  cy.get('nav').contains('button', grupo).parent().trigger('mouseenter')
  // Hacer clic en el ítem del dropdown
  cy.get('nav').contains('button', label).click()
})
