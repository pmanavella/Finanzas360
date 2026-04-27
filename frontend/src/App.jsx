import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import FinancialDashboard from './components/Dashboard'
import Movimientos from './components/Movimientos'
import Comprobantes from './components/Comprobantes'
import ImportarExcel from './components/ImportarExcel'

function FinancialApp() {
  const [page, setPage] = useState('dashboard')
  const [openForm, setOpenForm] = useState(null)

  const navigate = (p, extra) => {
    setPage(p)
    if (extra) setOpenForm(extra)
    else setOpenForm(null)
  }

  return (
    <Layout page={page} onNavigate={navigate}>
      {page === 'dashboard' && <FinancialDashboard onNavigate={navigate} />}
      {page === 'ingresos' && (
        <Movimientos tipo="Ingreso" openForm={openForm} onFormClose={() => setOpenForm(null)} />
      )}
      {page === 'gastos' && (
        <Movimientos tipo="Gasto" openForm={openForm} onFormClose={() => setOpenForm(null)} />
      )}
      {page === 'comprobantes' && <Comprobantes />}
      {page === 'excel' && <ImportarExcel />}
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app" element={<ProtectedRoute><FinancialApp /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
