import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { IconHeart, IconX } from './Icons'

type ToastKind = 'ok' | 'err' | 'fav'

interface ToastState {
  id: number
  msg: string
  kind: ToastKind
}

const ToastCtx = createContext<(msg: string, kind?: ToastKind) => void>(() => {})

export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextId = useRef(1)

  const show = useCallback((msg: string, kind: ToastKind = 'ok') => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ id: nextId.current++, msg, kind })
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <div key={toast.id} className={`toast ${toast.kind}`} role="status">
          <span className="ico">
            {toast.kind === 'err' ? <IconX size={18} /> : toast.kind === 'fav' ? <IconHeart size={18} /> : '✓'}
          </span>
          {toast.msg}
        </div>
      )}
    </ToastCtx.Provider>
  )
}
