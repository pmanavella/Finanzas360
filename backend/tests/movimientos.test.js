const request = require('supertest')
const app = require('../index')

let adminToken = ''
let movimientoId = null

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin.qa@finanzas360.com',
      password: 'admin123'
    })
  adminToken = res.body.token
})

describe('Movimientos', () => {

  it('Admin puede obtener movimientos', async () => {
    const res = await request(app)
      .get('/api/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('Admin puede obtener métricas', async () => {
    const res = await request(app)
      .get('/api/movimientos/metricas')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('Admin puede crear un movimiento', async () => {
    const res = await request(app)
      .post('/api/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fecha: '2026-05-08',
        descripcion: 'Test movimiento QA',
        categoria: 'Servicios',
        tipo: 'Ingreso',
        monto: 10000
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    movimientoId = res.body.id
  })

  it('Crear movimiento sin campos obligatorios → error 400', async () => {
    const res = await request(app)
      .post('/api/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ descripcion: 'Sin monto ni fecha' })
    expect(res.status).toBe(400)
  })

  it('Sin token no puede obtener movimientos', async () => {
    const res = await request(app)
      .get('/api/movimientos')
    expect(res.status).toBe(401)
  })

  it('Admin puede ver trazabilidad', async () => {
    const res = await request(app)
      .get('/api/movimientos/trazabilidad')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('Admin puede eliminar un movimiento', async () => {
    if (!movimientoId) return
    const res = await request(app)
      .delete(`/api/movimientos/${movimientoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

})