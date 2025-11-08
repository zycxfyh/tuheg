import type { Game, Character, WorldBookEntry } from '@prisma/client'
import type { SubmitActionDto } from '@tuheg/common-backend'
export interface GameActionJobData {
  gameId: string
  userId: string
  playerAction: SubmitActionDto
  gameStateSnapshot: Game & {
    character: Character | null
    worldBook: WorldBookEntry[]
  }
  correlationId?: string
}
export interface LogicCompletePayload {
  gameId: string
  userId: string
  playerAction: SubmitActionDto
}
//# sourceMappingURL=queue.types.d.ts.map
