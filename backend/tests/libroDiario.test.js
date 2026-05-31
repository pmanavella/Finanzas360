const request = require('supertest')
const app = require('../index')

let adminToken = ''

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin.qa@finanzas360.com',
      password: 'admin123'
    })
  adminToken = res.body.token
})

describe('Libro Diario - Trazabilidad', () => {

  it('Admin puede obtener trazabilidad', async () => {
    const res = await request(app)
      .get('/api/movimientos/trazabilidad')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('Respuesta tiene estructura correcta', async () => {
    const res = await request(app)
      .get('/api/movimientos/trazabilidad')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('Sin token no puede acceder a trazabilidad', async () => {
    const res = await request(app)
      .get('/api/movimientos/trazabilidad')
    expect(res.status).toBe(401)
  })

  it('Admin puede obtener métricas de movimientos', async () => {
    const res = await request(app)
      .get('/api/movimientos/metricas')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toBeDefined()
  })

})