# Finanzas360 - MVP

Sistema de gestión financiera para startups. Permite registrar ingresos y gastos, gestionar comprobantes digitales con OCR, importar desde Excel y consultar con filtros.

---

## Stack Tecnológico

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Base de datos**: Supabase (PostgreSQL)
- **OCR**: Tesseract.js (client-side) + pdf-parse
- **Excel**: xlsx (SheetJS)

---

## Requisitos Previos

- Node.js 18+
- npm 9+
- Cuenta en [Supabase](https://supabase.com) (gratuita)

---

## 1. Configurar Supabase

1. Crear un nuevo proyecto en [app.supabase.com](https://app.supabase.com)
2. Ir a **SQL Editor** y ejecutar el contenido del archivo `supabase/schema.sql`
3. Ir a **Settings → API** y copiar:
   - `Project URL` → lo usarás como `SUPABASE_URL`
   - `anon public key` → lo usarás como `SUPABASE_ANON_KEY`
   - `service_role key` → lo usarás como `SUPABASE_SERVICE_KEY`
4. Ir a **Storage** → crear un bucket llamado `comprobantes` y marcarlo como **público**

---

## 2. Configurar el Backend

```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:

```
PORT=3001
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key
```

Luego instalar dependencias y ejecutar:

```bash
npm install
npm run dev
```

El backend estará disponible en `http://localhost:3001`

---

## 3. Configurar el Frontend

```bash
cd frontend
cp .env.example .env
```

Editar `.env`:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
VITE_API_URL=http://localhost:3001
```

Luego instalar dependencias y ejecutar:

```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`

---

## 4. Estructura del Proyecto

```
finanzas360/
├── README.md
├── supabase/
│   └── schema.sql          # Script SQL para crear las tablas
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── index.js             # Servidor Express principal
│   └── routes/
│       ├── movimientos.js   # CRUD ingresos y gastos
│       ├── comprobantes.js  # Upload y OCR
│       └── excel.js         # Importación Excel
└── frontend/
    ├── .env.example
    ├── package.json
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── lib/
        │   └── supabase.js
        ├── components/
        │   ├── Layout.jsx
        │   ├── Dashboard.jsx
        │   ├── Movimientos.jsx
        │   ├── FormMovimiento.jsx
        │   ├── Comprobantes.jsx
        │   └── ImportarExcel.jsx
        └── index.css
```

---

## 5. Plantilla Excel para Importación

El archivo Excel debe tener las siguientes columnas (en ese orden):

| fecha | descripcion | categoria | tipo | monto | proveedor_cliente |
|-------|-------------|-----------|------|-------|-------------------|
| 2026-04-01 | Servidor AWS | Tecnología | Gasto | 38400 | AWS |

Tipos válidos: `Ingreso` o `Gasto`

Categorías válidas: `Tecnología`, `RRHH`, `Insumos`, `Servicios`, `Inversión`, `Otros`

---

## Funcionalidades del MVP

- ✅ Dashboard con métricas (ingresos, gastos, balance)
- ✅ Registro manual de ingresos y gastos
- ✅ Edición y eliminación de movimientos
- ✅ Filtros por fecha, tipo y categoría
- ✅ Carga de comprobantes (imagen/PDF)
- ✅ OCR automático al cargar comprobante
- ✅ Vinculación comprobante ↔ movimiento
- ✅ Importación masiva desde Excel
- ✅ Validación de estructura del archivo Excel
