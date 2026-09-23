import type { AppSettings, AppState, Conversation } from '../types'
import { DEFAULT_MODEL_ID } from './models'
import { uid } from './id'

const STORAGE_KEY = 'grok-frontend-state-v1'

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  baseUrl: 'https://api.x.ai/v1',
  systemPrompt:
    'You are Grok, built by xAI. Be helpful, direct, and a little witty. Prefer clear technical answers with concrete next steps.',
  temperature: 0.7,
  stream: true,
  theme: 'dark',
}

export function createConversation(partial?: Partial<Conversation>): Conversation {
  const now = Date.now()
  return {
    id: uid('conv'),
    title: 'New conversation',
    modelId: DEFAULT_MODEL_ID,
    mode: 'agent',
    messages: [],
    createdAt: now,
    updatedAt: now,
    pinned: false,
    ...partial,
  }
}

export function defaultState(): AppState {
  const conv = createConversation()
  return {
    conversations: [conv],
    activeId: conv.id,
    settings: { ...DEFAULT_SETTINGS },
    sidebarCollapsed: false,
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.conversations?.length) return defaultState()
    return {
      ...defaultState(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    }
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
