require('dotenv').config();
const express = require('express');
const cors = require('cors');

const movimientosRoutes = require('./routes/movimientos');
const comprobantesRoutes = require('./routes/comprobantes');
const excelRoutes = require('./routes/excel');
const authRoutes = require('./routes/authRoutes');
const deudasRoutes = require('./routes/deudas');
const salariosRoutes = require('./routes/salarios');
const rbacRoutes = require('./routes/rbac');
const backupRoutes = require('./routes/backup');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas existentes
app.use('/api/auth', authRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/comprobantes', comprobantesRoutes);
app.use('/api/excel', excelRoutes);

// Nuevas rutas
app.use('/api/deudas', deudasRoutes);
app.use('/api/salarios', salariosRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/backup', backupRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(`❌ [${req.method}] ${req.path} →`, err.message);
  if (err.details) console.error('   Detalle Supabase:', err.details);
  if (err.hint)    console.error('   Hint Supabase:', err.hint);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Finanzas360 Backend corriendo en http://localhost:${PORT}`);
  console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`🔑 Service Key cargada: ${process.env.SUPABASE_SERVICE_KEY ? 'SÍ' : 'NO ❌'}`);
});
