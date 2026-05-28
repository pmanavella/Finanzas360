import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // URL base del frontend corriendo localmente
    baseUrl: 'http://localhost:5173',

    // Dónde buscar los tests
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',

    // Viewport desktop estándar
    viewportWidth: 1280,
    viewportHeight: 720,

    // No grabar video por defecto (acelera los tests)
    video: false,

    // Screenshot solo cuando falla
    screenshotOnRunFailure: true,

    // Timeouts razonables para un backend local
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    // Variables de entorno — las credenciales van en cypress.env.json (gitignored)
    env: {
      apiUrl: 'http://localhost:3001',
    },
  },
})
