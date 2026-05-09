import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import FinancialDashboard from './components/Dashboard'
import Movimientos from './components/Movimientos'
import Comprobantes from './components/Comprobantes'
import ImportarExcel from './components/ImportarExcel'
import Deudas from './components/Deudas'
import Salarios from './components/Salarios'
import Usuarios from './components/Usuarios'
import TodosMovimientos from './components/TodosMovimientos'

function getUserFromStorage() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

function FinancialApp() {
  const [page, setPage] = useState('dashboard')
  const [openForm, setOpenForm] = useState(null)
  const user = getUserFromStorage()

  const navigate = (p, extra) => {
    setPage(p)
    if (extra) setOpenForm(extra)
    else setOpenForm(null)
  }

  return (
    <Layout page={page} onNavigate={navigate}>
      {page === 'dashboard'    && <FinancialDashboard onNavigate={navigate} />}
      {page === 'ingresos'     && (
        <Movimientos tipo="Ingreso" openForm={openForm} onFormClose={() => setOpenForm(null)} />
      )}
      {page === 'gastos'       && (
        <Movimientos tipo="Gasto" openForm={openForm} onFormClose={() => setOpenForm(null)} />
      )}
      {page === 'deudas'       && <Deudas />}
      {page === 'salarios'     && <Salarios user={user} />}
      {page === 'comprobantes' && <Comprobantes />}
      {page === 'excel'        && <ImportarExcel />}
      {page === 'todos'        && <TodosMovimientos />}
      {page === 'usuarios'     && <Usuarios />}
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><FinancialApp /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
