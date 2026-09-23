import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Square, Paperclip, Command } from 'lucide-react'
import type { AgentMode } from '../types'
import clsx from 'clsx'

interface ComposerProps {
  mode: AgentMode
  onModeChange: (mode: AgentMode) => void
  onSend: (text: string) => void
  onStop: () => void
  busy: boolean
  disabled?: boolean
}

const MODES: { id: AgentMode; label: string; hint: string }[] = [
  { id: 'agent', label: 'Agent', hint: 'Plan and act' },
  { id: 'ask', label: 'Ask', hint: 'Read-only answers' },
  { id: 'chat', label: 'Chat', hint: 'Casual conversation' },
]

export function Composer({ mode, onModeChange, onSend, onStop, busy, disabled }: ComposerProps) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const submit = () => {
    const value = text.trim()
    if (!value || busy || disabled) return
    onSend(value)
    setText('')
    if (ref.current) {
      ref.current.style.height = 'auto'
    }
  }

  return (
    <div className="composer-wrap">
      <div className="mode-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={clsx('mode-chip', mode === m.id && 'active')}
            onClick={() => onModeChange(m.id)}
            title={m.hint}
            disabled={busy}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className={clsx('composer', busy && 'busy')}>
        <button className="icon-btn ghost" title="Attach (coming soon)" disabled>
          <Paperclip size={16} />
        </button>
        <textarea
          ref={ref}
          rows={1}
          value={text}
          disabled={disabled}
          placeholder={
            mode === 'agent'
              ? 'Describe a task for Grok…'
              : mode === 'ask'
                ? 'Ask a question…'
                : 'Message Grok…'
          }
          onChange={(e) => {
            setText(e.target.value)
            const el = e.target
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 180)}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        {busy ? (
          <button className="send-btn stop" onClick={onStop} title="Stop">
            <Square size={14} />
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={submit}
            disabled={!text.trim() || disabled}
            title="Send (Enter)"
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>

      <div className="composer-hint">
        <Command size={11} />
        <span>Enter to send · Shift+Enter for newline · Local history auto-saves</span>
      </div>
    </div>
  )
}
