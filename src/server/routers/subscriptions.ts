import { z } from "zod"
import { router, protectedProcedure } from "@/server/trpc"

export const subscriptionRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.subscription.findMany({
      where: {
        OR: [
          { userId: ctx.user.id },
          { sharedWith: { some: { userId: ctx.user.id } } },
        ],
      },
      include: {
        sharedWith: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { transactions: true } },
      },
      orderBy: { nextBillingDate: "asc" },
    })
  }),

  getById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.subscription.findFirst({
        where: {
          id: input,
          OR: [
            { userId: ctx.user.id },
            { sharedWith: { some: { userId: ctx.user.id } } },
          ],
        },
        include: {
          sharedWith: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      category: z.string().optional(),
      amount: z.number().positive(),
      currency: z.string().default("DOP"),
      billingCycle: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
      nextBillingDate: z.string().datetime({ offset: true }),
      reminderDaysBefore: z.number().int().min(0).default(3),
      notes: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.subscription.create({
        data: {
          ...input,
          nextBillingDate: new Date(input.nextBillingDate),
          userId: ctx.user.id,
        },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      category: z.string().optional(),
      amount: z.number().positive().optional(),
      currency: z.string().optional(),
      billingCycle: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
      nextBillingDate: z.string().datetime({ offset: true }).optional(),
      reminderDaysBefore: z.number().int().min(0).optional(),
      status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const sub = await ctx.prisma.subscription.findFirst({
        where: { id, userId: ctx.user.id },
      })
      if (!sub) throw new Error("Subscription not found or not authorized")
      const updateData = { ...data }
      if (data.nextBillingDate) {
        updateData.nextBillingDate = new Date(data.nextBillingDate) as any
      }
      return ctx.prisma.subscription.update({ where: { id }, data: updateData })
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const sub = await ctx.prisma.subscription.findFirst({
        where: { id: input, userId: ctx.user.id },
      })
      if (!sub) throw new Error("Subscription not found or not authorized")
      return ctx.prisma.subscription.delete({ where: { id: input } })
    }),

  share: protectedProcedure
    .input(z.object({
      subscriptionId: z.string(),
      email: z.string().email(),
      role: z.enum(["OWNER", "MEMBER", "VIEWER"]).default("VIEWER"),
    }))
    .mutation(async ({ ctx, input }) => {
      const sub = await ctx.prisma.subscription.findFirst({
        where: { id: input.subscriptionId, userId: ctx.user.id },
      })
      if (!sub) throw new Error("Subscription not found or not authorized")

      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (!user) throw new Error("User not found")

      return ctx.prisma.subscriptionShare.create({
        data: {
          subscriptionId: input.subscriptionId,
          userId: user.id,
          role: input.role,
        },
      })
    }),

  unshare: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const share = await ctx.prisma.subscriptionShare.findUnique({
        where: { id: input },
        include: { subscription: true },
      })
      if (!share || share.subscription.userId !== ctx.user.id) {
        throw new Error("Not authorized")
      }
      return ctx.prisma.subscriptionShare.delete({ where: { id: input } })
    }),

  upcoming: protectedProcedure
    .input(z.object({
      days: z.number().int().positive().default(30),
    }))
    .query(({ ctx, input }) => {
      const from = new Date()
      const to = new Date()
      to.setDate(to.getDate() + input.days)

      return ctx.prisma.subscription.findMany({
        where: {
          OR: [
            { userId: ctx.user.id },
            { sharedWith: { some: { userId: ctx.user.id } } },
          ],
          status: "ACTIVE",
          nextBillingDate: { gte: from, lte: to },
        },
        orderBy: { nextBillingDate: "asc" },
      })
    }),
})
