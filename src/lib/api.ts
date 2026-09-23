import type { AppSettings, Message } from '../types'

export interface ChatRequest {
  model: string
  messages: Message[]
  settings: AppSettings
  signal?: AbortSignal
  onToken?: (token: string) => void
}

function toApiMessages(messages: Message[], systemPrompt: string) {
  const apiMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }))

  if (systemPrompt.trim()) {
    return [{ role: 'system' as const, content: systemPrompt }, ...apiMessages]
  }
  return apiMessages
}

async function mockReply(
  messages: Message[],
  model: string,
  onToken?: (token: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const last = [...messages].reverse().find((m) => m.role === 'user')
  const prompt = last?.content?.trim() || 'Hello'
  const reply =
    `**${model}** (demo mode — add an xAI API key in Settings for live replies)\n\n` +
    `You said:\n> ${prompt.slice(0, 280)}${prompt.length > 280 ? '…' : ''}\n\n` +
    `I can help with coding, debugging, architecture, and writing. ` +
    `Use the sidebar to switch conversations, the model picker to change models, ` +
    `and the mode chips (Agent / Ask / Chat) to change how I respond.`

  if (!onToken) return reply

  const chunks = reply.split(/(\s+)/)
  let out = ''
  for (const chunk of chunks) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    out += chunk
    onToken(chunk)
    await new Promise((r) => setTimeout(r, 12 + Math.random() * 28))
  }
  return out
}

export async function chatCompletion(req: ChatRequest): Promise<string> {
  const { model, messages, settings, signal, onToken } = req

  if (!settings.apiKey.trim()) {
    return mockReply(messages, model, onToken, signal)
  }

  const body = {
    model,
    messages: toApiMessages(messages, settings.systemPrompt),
    temperature: settings.temperature,
    stream: settings.stream && Boolean(onToken),
  }

  const res = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${errText.slice(0, 400)}`)
  }

  if (!body.stream || !res.body || !onToken) {
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return data.choices?.[0]?.message?.content ?? ''
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const token = parsed.choices?.[0]?.delta?.content ?? ''
        if (token) {
          full += token
          onToken(token)
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  return full
}
