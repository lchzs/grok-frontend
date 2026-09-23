import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Sparkles } from 'lucide-react'
import { MODELS, getModel } from '../lib/models'
import clsx from 'clsx'

interface ModelPickerProps {
  modelId: string
  onChange: (id: string) => void
  disabled?: boolean
}

export function ModelPicker({ modelId, onChange, disabled }: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = getModel(modelId)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="model-picker" ref={ref}>
      <button
        className="model-trigger"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <Sparkles size={14} />
        <span>{current.name}</span>
        <ChevronDown size={14} className={clsx(open && 'rot')} />
      </button>

      {open && (
        <div className="model-menu">
          <div className="model-menu-head">Select model</div>
          {MODELS.map((m) => (
            <button
              key={m.id}
              className={clsx('model-option', m.id === modelId && 'selected')}
              onClick={() => {
                onChange(m.id)
                setOpen(false)
              }}
            >
              <div className="model-option-main">
                <div className="model-option-title">
                  <strong>{m.name}</strong>
                  {m.badge && <span className="badge">{m.badge}</span>}
                </div>
                <span className="model-option-desc">{m.description}</span>
                <span className="model-option-prov">{m.provider} · {m.id}</span>
              </div>
              {m.id === modelId && <Check size={16} className="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
