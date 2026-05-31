const request = require('supertest')
const app = require('../index')

let adminToken = ''
let rolUsuarioId = null

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin.qa@finanzas360.com',
      password: 'admin123'
    })
  adminToken = res.body.token

  const rolesRes = await request(app)
    .get('/api/rbac/roles')
    .set('Authorization', `Bearer ${adminToken}`)
  const roles = rolesRes.body.data || []
  const rolUsuario = roles.find(r => r.nombre === 'usuario') || roles[0]
  rolUsuarioId = rolUsuario?.id || null
})

describe('Usuarios - RBAC', () => {

  it('Admin puede listar usuarios', async () => {
    const res = await request(app)
      .get('/api/rbac/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('Sin token no puede listar usuarios', async () => {
    const res = await request(app)
      .get('/api/rbac/usuarios')
    expect(res.status).toBe(401)
  })

  it('Admin puede listar roles', async () => {
    const res = await request(app)
      .get('/api/rbac/roles')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('Admin puede crear un usuario', async () => {
    const res = await request(app)
      .post('/api/rbac/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Usuario Test QA',
        email: `test.qa.${Date.now()}@finanzas360.com`,
        password: 'test1234',
        estado: 'Activo',
        rol_id: rolUsuarioId
      })
    expect(res.status).toBe(201)
  })

  it('Token inválido no puede crear usuario', async () => {
    const res = await request(app)
      .post('/api/rbac/usuarios')
      .set('Authorization', 'Bearer token_falso')
      .send({
        nombre: 'Intruso',
        email: 'intruso@test.com',
        password: 'test1234'
      })
    expect(res.status).toBe(401)
  })

  it('Admin puede editar un usuario', async () => {
    const email = `editar.qa.${Date.now()}@finanzas360.com`
    const crear = await request(app)
      .post('/api/rbac/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Usuario Editar QA',
        email: email,
        password: 'test1234',
        rol_id: rolUsuarioId,
        estado: 'Activo'
      })
    const usuarioId = crear.body.id

    const res = await request(app)
      .put(`/api/rbac/usuarios/${usuarioId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Usuario Editado QA',
        email: email,
        rol_id: rolUsuarioId,
        estado: 'Activo'
      })
    expect(res.status).toBe(200)
  })

  it('Admin puede eliminar lógicamente un usuario', async () => {
    const crear = await request(app)
      .post('/api/rbac/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Usuario Eliminar QA',
        email: `eliminar.qa.${Date.now()}@finanzas360.com`,
        password: 'test1234',
        rol_id: rolUsuarioId,
        estado: 'Activo'
      })
    const usuarioId = crear.body.id

    const res = await request(app)
      .delete(`/api/rbac/usuarios/${usuarioId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

})