export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: Role
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface ConversationState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}

export interface ApiKeySettings {
  tavilyApiKey: string
  googleStudioApiKey: string
}
