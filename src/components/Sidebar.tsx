import {
  MessageSquarePlus,
  Search,
  Pin,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Settings,
  MoreHorizontal,
  Pencil,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Conversation } from '../types'
import clsx from 'clsx'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  collapsed: boolean
  onToggleCollapse: () => void
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onPin: (id: string) => void
  onOpenSettings: () => void
}

function groupLabel(ts: number): string {
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startYesterday = startToday - 86400000
  if (ts >= startToday) return 'Today'
  if (ts >= startYesterday) return 'Yesterday'
  if (ts >= startToday - 7 * 86400000) return 'Previous 7 days'
  return 'Older'
}

export function Sidebar({
  conversations,
  activeId,
  collapsed,
  onToggleCollapse,
  onNew,
  onSelect,
  onDelete,
  onRename,
  onPin,
  onOpenSettings,
}: SidebarProps) {
  const [query, setQuery] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...conversations].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
    if (!q) return list
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q)),
    )
  }, [conversations, query])

  const groups = useMemo(() => {
    const map = new Map<string, Conversation[]>()
    for (const c of filtered) {
      const label = c.pinned ? 'Pinned' : groupLabel(c.updatedAt)
      const arr = map.get(label) ?? []
      arr.push(c)
      map.set(label, arr)
    }
    return [...map.entries()]
  }, [filtered])

  if (collapsed) {
    return (
      <aside className="sidebar collapsed">
        <button className="icon-btn" onClick={onToggleCollapse} title="Expand sidebar">
          <PanelLeft size={18} />
        </button>
        <button className="icon-btn primary" onClick={onNew} title="New conversation">
          <MessageSquarePlus size={18} />
        </button>
        <div className="spacer" />
        <button className="icon-btn" onClick={onOpenSettings} title="Settings">
          <Settings size={18} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand">
          <div className="brand-mark">G</div>
          <div className="brand-text">
            <strong>Grok</strong>
            <span>Frontend</span>
          </div>
        </div>
        <button className="icon-btn" onClick={onToggleCollapse} title="Collapse sidebar">
          <PanelLeftClose size={18} />
        </button>
      </div>

      <button className="new-chat-btn" onClick={onNew}>
        <MessageSquarePlus size={16} />
        New conversation
      </button>

      <div className="search-box">
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations"
        />
      </div>

      <div className="conv-list">
        {groups.map(([label, items]) => (
          <div key={label} className="conv-group">
            <div className="conv-group-label">{label}</div>
            {items.map((c) => (
              <div
                key={c.id}
                className={clsx('conv-item', c.id === activeId && 'active')}
                onClick={() => onSelect(c.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenuId(c.id)
                }}
              >
                {editingId === c.id ? (
                  <input
                    className="rename-input"
                    autoFocus
                    value={editTitle}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => {
                      if (editTitle.trim()) onRename(c.id, editTitle.trim())
                      setEditingId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editTitle.trim()) onRename(c.id, editTitle.trim())
                        setEditingId(null)
                      }
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                ) : (
                  <>
                    <div className="conv-title-row">
                      {c.pinned && <Pin size={11} className="pin-icon" />}
                      <span className="conv-title">{c.title}</span>
                    </div>
                    <span className="conv-meta">
                      {c.messages.length} msg · {c.modelId}
                    </span>
                  </>
                )}

                <button
                  className="conv-more"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuId(menuId === c.id ? null : c.id)
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>

                {menuId === c.id && (
                  <div className="conv-menu" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingId(c.id)
                        setEditTitle(c.title)
                        setMenuId(null)
                      }}
                    >
                      <Pencil size={13} /> Rename
                    </button>
                    <button
                      onClick={() => {
                        onPin(c.id)
                        setMenuId(null)
                      }}
                    >
                      <Pin size={13} /> {c.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      className="danger"
                      onClick={() => {
                        onDelete(c.id)
                        setMenuId(null)
                      }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-hint">No conversations found</div>}
      </div>

      <div className="sidebar-foot">
        <button className="settings-link" onClick={onOpenSettings}>
          <Settings size={15} />
          Settings
        </button>
      </div>
    </aside>
  )
}
