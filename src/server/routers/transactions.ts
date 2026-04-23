import { z } from "zod"
import { router, protectedProcedure } from "@/server/trpc"

export const transactionRouter = router({
  list: protectedProcedure
    .input(z.object({
      accountId: z.string().optional(),
      limit: z.number().int().positive().default(50),
      offset: z.number().int().min(0).default(0),
    }).optional())
    .query(({ ctx, input }) => {
      const where: any = { userId: ctx.user.id }
      if (input?.accountId) {
        where.creditAccountId = input.accountId
      }
      return ctx.prisma.transaction.findMany({
        where,
        include: {
          creditAccount: { select: { id: true, name: true, color: true } },
          subscription: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        take: input?.limit ?? 50,
        skip: input?.offset ?? 0,
      })
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.transaction.findFirst({
        where: { id: input, userId: ctx.user.id },
        include: {
          creditAccount: { select: { id: true, name: true } },
          subscription: { select: { id: true, name: true } },
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      description: z.string().min(1),
      amount: z.number(),
      type: z.enum(["INCOME", "EXPENSE"]).default("EXPENSE"),
      date: z.string().datetime({ offset: true }),
      category: z.string().optional(),
      notes: z.string().optional(),
      creditAccountId: z.string().optional(),
      subscriptionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.creditAccountId) {
        const account = await ctx.prisma.creditAccount.findFirst({
          where: { id: input.creditAccountId, owners: { some: { userId: ctx.user.id } } },
        })
        if (!account) throw new Error("Account not found")
      }
      return ctx.prisma.transaction.create({
        data: {
          ...input,
          date: new Date(input.date),
          userId: ctx.user.id,
        },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      description: z.string().min(1).optional(),
      amount: z.number().optional(),
      type: z.enum(["INCOME", "EXPENSE"]).optional(),
      date: z.string().datetime({ offset: true }).optional(),
      category: z.string().optional(),
      notes: z.string().optional(),
      creditAccountId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const tx = await ctx.prisma.transaction.findFirst({
        where: { id, userId: ctx.user.id },
      })
      if (!tx) throw new Error("Transaction not found")
      const updateData = { ...data }
      if (data.date) {
        updateData.date = new Date(data.date) as any
      }
      return ctx.prisma.transaction.update({ where: { id }, data: updateData })
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const tx = await ctx.prisma.transaction.findFirst({
        where: { id: input, userId: ctx.user.id },
      })
      if (!tx) throw new Error("Transaction not found")
      return ctx.prisma.transaction.delete({ where: { id: input } })
    }),

  getSummary: protectedProcedure
    .input(z.object({
      months: z.number().int().positive().default(1),
    }).optional())
    .query(async ({ ctx, input }) => {
      const since = new Date()
      since.setMonth(since.getMonth() - (input?.months ?? 1))

      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          userId: ctx.user.id,
          date: { gte: since },
        },
      })

      const totalExpenses = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalIncome = transactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const byCategory = transactions
        .filter((t) => t.type === "EXPENSE" && t.category)
        .reduce((acc: Record<string, number>, t) => {
          const cat = t.category!
          acc[cat] = (acc[cat] || 0) + Number(t.amount)
          return acc
        }, {})

      return { totalExpenses, totalIncome, balance: totalIncome - totalExpenses, byCategory }
    }),
})
