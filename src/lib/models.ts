import type { ModelOption } from '../types'

export const MODELS: ModelOption[] = [
  {
    id: 'grok-4',
    name: 'Grok 4',
    description: 'Flagship reasoning and coding model',
    provider: 'xAI',
    badge: 'Latest',
  },
  {
    id: 'grok-4-fast-reasoning',
    name: 'Grok 4 Fast',
    description: 'Faster responses with strong reasoning',
    provider: 'xAI',
    badge: 'Fast',
  },
  {
    id: 'grok-3',
    name: 'Grok 3',
    description: 'Balanced quality and latency',
    provider: 'xAI',
  },
  {
    id: 'grok-3-mini',
    name: 'Grok 3 Mini',
    description: 'Lightweight model for quick tasks',
    provider: 'xAI',
    badge: 'Mini',
  },
  {
    id: 'grok-2-latest',
    name: 'Grok 2',
    description: 'Previous generation general model',
    provider: 'xAI',
  },
]

export const DEFAULT_MODEL_ID = MODELS[0].id

export function getModel(id: string): ModelOption {
  return MODELS.find((m) => m.id === id) ?? MODELS[0]
}
