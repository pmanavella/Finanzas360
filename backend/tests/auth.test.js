const request = require('supertest')
const app = require('../index')

describe('Auth', () => {

  it('Login correcto → devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.qa@finanzas360.com',
        password: 'admin123'
      })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('Login con credenciales inválidas → devuelve 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noexiste@finanzas360.com',
        password: 'wrongpassword'
      })
    expect(res.status).toBe(401)
  })

  it('Login sin email → devuelve error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'admin123' })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('Token inválido → acceso denegado en ruta protegida', async () => {
    const res = await request(app)
      .get('/api/movimientos')
      .set('Authorization', 'Bearer token_falso_123')
    expect(res.status).toBe(401)
  })

  it('Sin token → acceso denegado en ruta protegida', async () => {
    const res = await request(app)
      .get('/api/movimientos')
    expect(res.status).toBe(401)
  })

})