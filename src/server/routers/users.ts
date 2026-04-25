import { z } from "zod"
import bcrypt from "bcryptjs"
import { router, publicProcedure, protectedProcedure } from "@/server/trpc"

export const userRouter = router({
  register: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.user.findUnique({ where: { email: input.email } })
      if (exists) {
        throw new Error("El email ya está registrado")
      }
      const passwordHash = await bcrypt.hash(input.password, 12)
      return ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
        },
      select: { id: true, name: true, email: true, createdAt: true, telegramChatId: true },
      })
    }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, name: true, email: true, createdAt: true, telegramChatId: true },
    })
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).optional(),
    }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
        select: { id: true, name: true, email: true },
      })
    }),

  updateTelegramChatId: protectedProcedure
    .input(z.object({
      telegramChatId: z.string().min(1),
    }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { telegramChatId: input.telegramChatId },
        select: { id: true, telegramChatId: true },
      })
    }),

  removeTelegram: protectedProcedure
    .mutation(({ ctx }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { telegramChatId: null },
        select: { id: true },
      })
    }),
})
