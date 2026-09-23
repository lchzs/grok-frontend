import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { ModelPicker } from './components/ModelPicker'
import { MessageList } from './components/MessageList'
import { Composer } from './components/Composer'
import { SettingsModal } from './components/SettingsModal'
import {
  createConversation,
  defaultState,
  loadState,
  saveState,
} from './lib/storage'
import { chatCompletion } from './lib/api'
import { uid } from './lib/id'
import { titleFromPrompt } from './lib/title'
import type { AgentMode, AppSettings, AppState, Conversation, Message } from './types'
import { Eraser, Download, RefreshCw } from 'lucide-react'
import './App.css'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme
  }, [state.settings.theme])

  const active = useMemo(
    () => state.conversations.find((c) => c.id === state.activeId) ?? null,
    [state.conversations, state.activeId],
  )

  const updateActive = useCallback((fn: (c: Conversation) => Conversation) => {
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === s.activeId ? fn(c) : c,
      ),
    }))
  }, [])

  const handleNew = () => {
    const conv = createConversation({
      modelId: active?.modelId,
      mode: active?.mode ?? 'agent',
    })
    setState((s) => ({
      ...s,
      conversations: [conv, ...s.conversations],
      activeId: conv.id,
    }))
    setError(null)
  }

  const handleDelete = (id: string) => {
    setState((s) => {
      const next = s.conversations.filter((c) => c.id !== id)
      if (next.length === 0) {
        const conv = createConversation()
        return { ...s, conversations: [conv], activeId: conv.id }
      }
      const activeId = s.activeId === id ? next[0].id : s.activeId
      return { ...s, conversations: next, activeId }
    })
  }

  const handleSend = async (text: string) => {
    if (!active || busy) return
    setError(null)

    const userMsg: Message = {
      id: uid('msg'),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }
    const assistantId = uid('msg')
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      model: active.modelId,
      streaming: true,
    }

    const modePrefix =
      active.mode === 'agent'
        ? '[Mode: Agent — be concrete, propose steps, write code when useful]\n\n'
        : active.mode === 'ask'
          ? '[Mode: Ask — answer carefully, no irreversible actions]\n\n'
          : ''

    updateActive((c) => ({
      ...c,
      title: c.messages.length === 0 ? titleFromPrompt(text) : c.title,
      messages: [...c.messages, userMsg, assistantMsg],
      updatedAt: Date.now(),
    }))

    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)

    const history: Message[] = [
      ...active.messages,
      { ...userMsg, content: modePrefix + text },
    ]

    try {
      await chatCompletion({
        model: active.modelId,
        messages: history,
        settings: state.settings,
        signal: controller.signal,
        onToken: (token) => {
          setState((s) => ({
            ...s,
            conversations: s.conversations.map((c) => {
              if (c.id !== s.activeId) return c
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + token }
                    : m,
                ),
                updatedAt: Date.now(),
              }
            }),
          }))
        },
      })

      setState((s) => ({
        ...s,
        conversations: s.conversations.map((c) => {
          if (c.id !== s.activeId) return c
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m,
            ),
          }
        }),
      }))
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setState((s) => ({
          ...s,
          conversations: s.conversations.map((c) => {
            if (c.id !== s.activeId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      streaming: false,
                      content: m.content || '_(stopped)_',
                    }
                  : m,
              ),
            }
          }),
        }))
      } else {
        const msg = e instanceof Error ? e.message : 'Request failed'
        setError(msg)
        setState((s) => ({
          ...s,
          conversations: s.conversations.map((c) => {
            if (c.id !== s.activeId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      streaming: false,
                      content: m.content || `Error: ${msg}`,
                    }
                  : m,
              ),
            }
          }),
        }))
      }
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const handleClearThread = () => {
    if (!active) return
    updateActive((c) => ({
      ...c,
      messages: [],
      title: 'New conversation',
      updatedAt: Date.now(),
    }))
    setError(null)
  }

  const handleRegenerate = () => {
    if (!active || busy) return
    const lastUserIdx = [...active.messages]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find((x) => x.m.role === 'user')
    if (!lastUserIdx) return
    const prompt = lastUserIdx.m.content
    updateActive((c) => ({
      ...c,
      messages: c.messages.slice(0, lastUserIdx.i),
      updatedAt: Date.now(),
    }))
    // slight delay so state settles
    setTimeout(() => handleSend(prompt), 0)
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grok-frontend-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as AppState
      if (!parsed.conversations?.length) throw new Error('Invalid export file')
      setState({
        ...defaultState(),
        ...parsed,
        settings: { ...state.settings, ...parsed.settings },
      })
      setSettingsOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    }
  }

  const clearAll = () => {
    if (!confirm('Clear all conversations and settings stored in this browser?')) return
    const next = defaultState()
    setState(next)
    setSettingsOpen(false)
  }

  return (
    <div className="app-shell">
      <Sidebar
        conversations={state.conversations}
        activeId={state.activeId}
        collapsed={state.sidebarCollapsed}
        onToggleCollapse={() =>
          setState((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }))
        }
        onNew={handleNew}
        onSelect={(id) => {
          setState((s) => ({ ...s, activeId: id }))
          setError(null)
        }}
        onDelete={handleDelete}
        onRename={(id, title) =>
          setState((s) => ({
            ...s,
            conversations: s.conversations.map((c) =>
              c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
            ),
          }))
        }
        onPin={(id) =>
          setState((s) => ({
            ...s,
            conversations: s.conversations.map((c) =>
              c.id === id ? { ...c, pinned: !c.pinned, updatedAt: Date.now() } : c,
            ),
          }))
        }
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <ModelPicker
              modelId={active?.modelId ?? 'grok-4'}
              disabled={busy}
              onChange={(modelId) =>
                updateActive((c) => ({ ...c, modelId, updatedAt: Date.now() }))
              }
            />
            <span className="thread-title">{active?.title ?? 'Grok'}</span>
          </div>
          <div className="topbar-right">
            <button
              className="icon-btn"
              title="Regenerate last reply"
              disabled={busy || !active?.messages.some((m) => m.role === 'assistant')}
              onClick={handleRegenerate}
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="icon-btn"
              title="Clear thread"
              disabled={busy || !active?.messages.length}
              onClick={handleClearThread}
            >
              <Eraser size={16} />
            </button>
            <button className="icon-btn" title="Export all" onClick={exportData}>
              <Download size={16} />
            </button>
            {!state.settings.apiKey && (
              <button className="pill warn" onClick={() => setSettingsOpen(true)}>
                Demo mode
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="banner error">
            <span>{error}</span>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="chat-scroll">
          <MessageList messages={active?.messages ?? []} streaming={busy} />
        </div>

        <Composer
          mode={active?.mode ?? 'agent'}
          onModeChange={(mode: AgentMode) =>
            updateActive((c) => ({ ...c, mode, updatedAt: Date.now() }))
          }
          onSend={handleSend}
          onStop={handleStop}
          busy={busy}
        />
      </main>

      <SettingsModal
        open={settingsOpen}
        settings={state.settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(settings: AppSettings) =>
          setState((s) => ({ ...s, settings }))
        }
        onExport={exportData}
        onImport={importData}
        onClearAll={clearAll}
      />
    </div>
  )
}
