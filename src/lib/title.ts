export function titleFromPrompt(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'New conversation'
  return cleaned.length > 42 ? `${cleaned.slice(0, 42)}…` : cleaned
}
