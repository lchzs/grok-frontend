import { useState } from 'react'
import { X, Eye, EyeOff, RotateCcw } from 'lucide-react'
import type { AppSettings } from '../types'
import { DEFAULT_SETTINGS } from '../lib/storage'

interface SettingsModalProps {
  open: boolean
  settings: AppSettings
  onClose: () => void
  onSave: (settings: AppSettings) => void
  onExport: () => void
  onImport: (file: File) => void
  onClearAll: () => void
}

export function SettingsModal({
  open,
  settings,
  onClose,
  onSave,
  onExport,
  onImport,
  onClearAll,
}: SettingsModalProps) {
  const [draft, setDraft] = useState(settings)
  const [showKey, setShowKey] = useState(false)

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <label className="field">
            <span>xAI API key</span>
            <div className="input-with-btn">
              <input
                type={showKey ? 'text' : 'password'}
                value={draft.apiKey}
                placeholder="xai-…"
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              />
              <button
                className="icon-btn"
                type="button"
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <small>Stored only in this browser. Leave empty for demo replies.</small>
          </label>

          <label className="field">
            <span>API base URL</span>
            <input
              value={draft.baseUrl}
              onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
            />
          </label>

          <label className="field">
            <span>System prompt</span>
            <textarea
              rows={4}
              value={draft.systemPrompt}
              onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Temperature · {draft.temperature.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={draft.temperature}
              onChange={(e) =>
                setDraft({ ...draft, temperature: Number(e.target.value) })
              }
            />
          </label>

          <label className="field row">
            <span>Stream responses</span>
            <input
              type="checkbox"
              checked={draft.stream}
              onChange={(e) => setDraft({ ...draft, stream: e.target.checked })}
            />
          </label>

          <div className="settings-actions-block">
            <button className="btn ghost" onClick={onExport}>
              Export conversations
            </button>
            <label className="btn ghost file-btn">
              Import conversations
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onImport(f)
                }}
              />
            </label>
            <button className="btn danger-ghost" onClick={onClearAll}>
              Clear all local data
            </button>
          </div>
        </div>

        <div className="modal-foot">
          <button
            className="btn ghost"
            onClick={() => setDraft({ ...DEFAULT_SETTINGS, apiKey: draft.apiKey })}
          >
            <RotateCcw size={14} /> Reset defaults
          </button>
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={() => {
              onSave(draft)
              onClose()
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
