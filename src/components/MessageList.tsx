import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Bot, User, Copy, Check } from 'lucide-react'
import type { Message } from '../types'
import clsx from 'clsx'

interface MessageListProps {
  messages: Message[]
  streaming?: boolean
}

function renderInline(text: string) {
  const parts: ReactNode[] = []
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  const src = text
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push(src.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('`')) {
      parts.push(
        <code key={m.index} className="inline-code">
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('**')) {
      parts.push(<strong key={m.index}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      parts.push(<em key={m.index}>{token.slice(1, -1)}</em>)
    }
    last = m.index + token.length
  }
  if (last < src.length) parts.push(src.slice(last))
  return parts
}

function renderContent(content: string) {
  const blocks = content.split(/(```[\s\S]*?```)/g)
  return blocks.map((block, i) => {
    if (block.startsWith('```')) {
      const match = block.match(/^```(\w+)?\n?([\s\S]*?)```$/)
      const lang = match?.[1] ?? ''
      const code = match?.[2] ?? block.slice(3, -3)
      return (
        <pre key={i} className="code-block">
          {lang && <div className="code-lang">{lang}</div>}
          <code>{code}</code>
        </pre>
      )
    }
    return (
      <div key={i} className="md-block">
        {block.split('\n').map((line, j) => {
          if (!line) return <br key={j} />
          if (line.startsWith('> ')) {
            return (
              <blockquote key={j} className="quote">
                {renderInline(line.slice(2))}
              </blockquote>
            )
          }
          return <p key={j}>{renderInline(line)}</p>
        })}
      </div>
    )
  })
}

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      className="msg-action"
      title="Copy"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setOk(true)
        setTimeout(() => setOk(false), 1200)
      }}
    >
      {ok ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

export function MessageList({ messages, streaming }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, streaming])

  if (messages.length === 0) {
    return (
      <div className="empty-chat">
        <div className="empty-orb">G</div>
        <h2>What should we build?</h2>
        <p>Start a conversation. Switch models anytime. Pin threads you care about.</p>
        <div className="suggestion-grid">
          {[
            'Explain this codebase architecture',
            'Write a React component with TypeScript',
            'Debug a flaky CI failure',
            'Draft a PR description',
          ].map((s) => (
            <div key={s} className="suggestion">
              {s}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((m) => (
        <div key={m.id} className={clsx('message', m.role)}>
          <div className={clsx('avatar', m.role)}>
            {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
          </div>
          <div className="message-body">
            <div className="message-head">
              <span className="role-label">{m.role === 'user' ? 'You' : 'Grok'}</span>
              {m.model && <span className="model-tag">{m.model}</span>}
              <CopyButton text={m.content} />
            </div>
            <div className={clsx('message-content', m.streaming && 'streaming')}>
              {renderContent(m.content)}
              {m.streaming && <span className="cursor" />}
            </div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
