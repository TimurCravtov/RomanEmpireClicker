import { useEffect } from 'react'
import '../styles/achievements.css'

const TOAST_MS = 5000

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.key), TOAST_MS)
    return () => clearTimeout(id)
  }, [toast.key, onDismiss])

  return (
    <div className="toast" role="status" onClick={() => onDismiss(toast.key)}>
      <img src={toast.icon} alt="" />
      <div>
        {toast.label && <div className="toast__label">{toast.label}</div>}
        <div className="toast__title">{toast.title}</div>
        <div className="toast__desc">{toast.desc}</div>
      </div>
    </div>
  )
}

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <Toast key={t.key} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
