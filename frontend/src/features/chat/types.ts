export type Role = 'user' | 'assistant' | 'system'
export type TodoStatus = 'pending' | 'in_progress' | 'completed'

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

export interface AgentTodo {
  content: string
  status: TodoStatus
}

export interface AgentRunProgress {
  todos: AgentTodo[]
}
