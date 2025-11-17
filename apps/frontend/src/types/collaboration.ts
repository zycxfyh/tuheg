export interface Collaborator {
  id: string
  name: string
  avatar?: string
  color: string
  cursor: {
    x: number
    y: number
    visible: boolean
  }
  selection?: {
    start: number
    end: number
    text: string
  }
  lastActivity: Date
  isOnline: boolean
}

export interface CollaborationSession {
  sessionId: string
  gameId: string
  collaborators: Collaborator[]
  isActive: boolean
  createdAt: Date
}

export interface CollaborationMessage {
  type: 'join' | 'leave' | 'cursor_update' | 'selection_update' | 'text_change'
  userId: string
  sessionId: string
  data: any
  timestamp: Date
}
