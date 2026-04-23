import { z } from "zod"
import { router, protectedProcedure } from "@/server/trpc"

export const creditCardRouter = router({
  listByAccount: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.creditCard.findMany({
        where: {
          account: { owners: { some: { userId: ctx.user.id } } },
          accountId: input,
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      accountId: z.string(),
      lastFourDigits: z.string().length(4),
      cardholderName: z.string().min(1),
      isPrimary: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.creditAccount.findFirst({
        where: { id: input.accountId, owners: { some: { userId: ctx.user.id } } },
      })
      if (!account) throw new Error("Account not found")
      return ctx.prisma.creditCard.create({ data: input })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      lastFourDigits: z.string().length(4).optional(),
      cardholderName: z.string().min(1).optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const card = await ctx.prisma.creditCard.findFirst({
        where: { id, account: { owners: { some: { userId: ctx.user.id } } } },
      })
      if (!card) throw new Error("Card not found")
      return ctx.prisma.creditCard.update({ where: { id }, data })
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const card = await ctx.prisma.creditCard.findFirst({
        where: { id: input, account: { owners: { some: { userId: ctx.user.id } } } },
      })
      if (!card) throw new Error("Card not found")
      return ctx.prisma.creditCard.delete({ where: { id: input } })
    }),
})
