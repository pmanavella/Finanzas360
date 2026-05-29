import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'

export default function ConfirmDeleteModal({ title, message, onConfirm, onCancel }) {
  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full fade-in"
        style={{ maxWidth: 400 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-bold text-gray-900 mb-2 text-[16px]">{title}</h3>
        <div className="text-sm text-gray-500 mb-5">{message}</div>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 justify-center"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
