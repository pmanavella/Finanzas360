const request = require('supertest')
const app = require('../index')

describe('Health Check', () => {

  it('GET /api/health → responde 200', async () => {
    const res = await request(app)
      .get('/api/health')
    expect(res.status).toBe(200)
  })

  it('Respuesta tiene status ok', async () => {
    const res = await request(app)
      .get('/api/health')
    expect(res.body).toHaveProperty('status', 'ok')
  })

  it('Respuesta tiene timestamp', async () => {
    const res = await request(app)
      .get('/api/health')
    expect(res.body).toHaveProperty('timestamp')
  })

})