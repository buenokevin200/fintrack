import { initTRPC, TRPCError } from "@trpc/server"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import { auth } from "@/lib/auth"
import { prisma } from "@/server/db/prisma"

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = await auth()
  return {
    session,
    prisma,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create()

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  })
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
