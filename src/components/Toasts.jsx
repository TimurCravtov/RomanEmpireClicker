import { useEffect } from 'react'
import '../styles/achievements.css'

const TOAST_MS = 4000

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.key), TOAST_MS)
    return () => clearTimeout(id)
  }, [toast.key, onDismiss])

  const { achievement } = toast
  return (
    <div className="toast" role="status">
      <img src={achievement.icon} alt="" />
      <div>
        <div className="toast__title">{achievement.name}</div>
        <div className="toast__desc">{achievement.desc}</div>
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
