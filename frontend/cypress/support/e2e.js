// ============================================================
// e2e.js — Archivo de soporte global para tests E2E
// Se ejecuta automáticamente antes de cada spec
// ============================================================

import './commands'

// Suprimir errores de ResizeObserver (falso-positivo común en React + Cypress)
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver loop')) return false
  // Propagar cualquier otro error real
})
