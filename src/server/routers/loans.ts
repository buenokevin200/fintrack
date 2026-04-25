import { z } from "zod"
import { router, protectedProcedure } from "@/server/trpc"

export const loanRouter = router({
  listByAccount: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.loan.findMany({
        where: {
          accountId: input,
          account: { owners: { some: { userId: ctx.user.id } } },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      accountId: z.string(),
      name: z.string().min(1),
      totalAmount: z.number().positive(),
      installments: z.number().int().positive(),
      interestRate: z.number().min(0).default(0),
      startDate: z.string().datetime({ offset: true }),
      monthlyPayment: z.number().positive(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.creditAccount.findFirst({
        where: { id: input.accountId, owners: { some: { userId: ctx.user.id } } },
      })
      if (!account) throw new Error("Account not found")
      return ctx.prisma.loan.create({
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
      name: z.string().min(1).optional(),
      totalAmount: z.number().positive().optional(),
      installments: z.number().int().positive().optional(),
      paidInstallments: z.number().int().min(0).optional(),
      interestRate: z.number().min(0).optional(),
      monthlyPayment: z.number().positive().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const loan = await ctx.prisma.loan.findFirst({
        where: { id, userId: ctx.user.id },
      })
      if (!loan) throw new Error("Loan not found")
      return ctx.prisma.loan.update({ where: { id }, data })
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const loan = await ctx.prisma.loan.findFirst({
        where: { id: input, userId: ctx.user.id },
      })
      if (!loan) throw new Error("Loan not found")
      return ctx.prisma.loan.delete({ where: { id: input } })
    }),
})
