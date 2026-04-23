import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Movimientos from './components/Movimientos'
import Comprobantes from './components/Comprobantes'
import ImportarExcel from './components/ImportarExcel'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [openForm, setOpenForm] = useState(null) // { tipo: 'Ingreso' | 'Gasto' }

  const navigate = (p, extra) => {
    setPage(p)
    if (extra) setOpenForm(extra)
    else setOpenForm(null)
  }

  return (
    <Layout page={page} onNavigate={navigate}>
      {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
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
