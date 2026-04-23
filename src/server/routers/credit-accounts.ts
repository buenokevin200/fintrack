import { z } from "zod"
import { router, protectedProcedure } from "@/server/trpc"

export const creditAccountRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.creditAccount.findMany({
      where: {
        owners: { some: { userId: ctx.user.id } },
      },
      include: {
        cards: true,
        owners: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  }),

  getById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.creditAccount.findFirst({
        where: { id: input, owners: { some: { userId: ctx.user.id } } },
        include: {
          cards: true,
          owners: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      issuer: z.string().min(1),
      creditLimit: z.number().positive(),
      closingDay: z.number().int().min(1).max(31),
      dueDay: z.number().int().min(1).max(31),
      color: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.creditAccount.create({
        data: {
          ...input,
          owners: {
            create: { userId: ctx.user.id, role: "OWNER" },
          },
        },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      issuer: z.string().min(1).optional(),
      creditLimit: z.number().positive().optional(),
      closingDay: z.number().int().min(1).max(31).optional(),
      dueDay: z.number().int().min(1).max(31).optional(),
      color: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const account = await ctx.prisma.creditAccount.findFirst({
        where: { id, owners: { some: { userId: ctx.user.id } } },
      })
      if (!account) throw new Error("Account not found")
      return ctx.prisma.creditAccount.update({ where: { id }, data })
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.creditAccount.findFirst({
        where: { id: input, owners: { some: { userId: ctx.user.id, role: "OWNER" } } },
      })
      if (!account) throw new Error("Account not found or not authorized")
      return ctx.prisma.creditAccount.delete({ where: { id: input } })
    }),
})
