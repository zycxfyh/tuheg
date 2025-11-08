import type { User } from '@prisma/client'
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>
    }
  }
}
export type _UserType = User
//# sourceMappingURL=express.types.d.ts.map
