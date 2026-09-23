export type Role = 'user' | 'assistant' | 'system'

export type AgentMode = 'agent' | 'ask' | 'chat'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
  model?: string
  streaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  modelId: string
  mode: AgentMode
  messages: Message[]
  createdAt: number
  updatedAt: number
  pinned?: boolean
}

export interface ModelOption {
  id: string
  name: string
  description: string
  provider: string
  badge?: string
}

export interface AppSettings {
  apiKey: string
  baseUrl: string
  systemPrompt: string
  temperature: number
  stream: boolean
  theme: 'dark' | 'dim'
}

export interface AppState {
  conversations: Conversation[]
  activeId: string | null
  settings: AppSettings
  sidebarCollapsed: boolean
}
