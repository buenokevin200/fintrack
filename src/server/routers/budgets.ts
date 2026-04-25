import { z } from "zod"
import { router, protectedProcedure } from "@/server/trpc"

export const budgetRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.budget.findMany({
      where: { userId: ctx.user.id },
      orderBy: { startDate: "desc" },
    })
  }),

  getSummary: protectedProcedure
    .input(z.object({ months: z.number().int().positive().default(1) }).optional())
    .query(async ({ ctx, input }) => {
      const since = new Date()
      since.setMonth(since.getMonth() - (input?.months ?? 1))

      const budgets = await ctx.prisma.budget.findMany({
        where: { userId: ctx.user.id, startDate: { gte: since } },
      })

      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          userId: ctx.user.id,
          date: { gte: since },
          type: "EXPENSE",
        },
      })

      const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
      const byCategory: Record<string, { budget: number; spent: number }> = {}

      for (const b of budgets) {
        if (!byCategory[b.category]) {
          byCategory[b.category] = { budget: 0, spent: 0 }
        }
        byCategory[b.category].budget += Number(b.amount)
      }

      for (const tx of transactions) {
        const cat = tx.category || "Sin categoría"
        if (!byCategory[cat]) {
          byCategory[cat] = { budget: 0, spent: 0 }
        }
        byCategory[cat].spent += Number(tx.amount)
      }

      return {
        totalBudget,
        totalSpent: transactions.reduce((s, t) => s + Number(t.amount), 0),
        byCategory,
        budgets,
      }
    }),

  create: protectedProcedure
    .input(z.object({
      category: z.string().min(1),
      icon: z.string().optional(),
      amount: z.number().positive(),
      period: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
      startDate: z.string().datetime({ offset: true }),
      notes: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.budget.create({
        data: {
          ...input,
          startDate: new Date(input.startDate),
          userId: ctx.user.id,
        },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      category: z.string().min(1).optional(),
      icon: z.string().optional(),
      amount: z.number().positive().optional(),
      period: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const budget = await ctx.prisma.budget.findFirst({
        where: { id, userId: ctx.user.id },
      })
      if (!budget) throw new Error("Budget not found")
      return ctx.prisma.budget.update({ where: { id }, data })
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const budget = await ctx.prisma.budget.findFirst({
        where: { id: input, userId: ctx.user.id },
      })
      if (!budget) throw new Error("Budget not found")
      return ctx.prisma.budget.delete({ where: { id: input } })
    }),
})
