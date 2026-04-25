import { z } from "zod"
import { router, protectedProcedure } from "@/server/trpc"

export const currencyRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.currency.findMany({
      include: {
        ratesFrom: true,
        ratesTo: true,
      },
      orderBy: { code: "asc" },
    })
  }),

  convert: protectedProcedure
    .input(z.object({
      amount: z.number(),
      from: z.string(),
      to: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (input.from === input.to) return { amount: input.amount, rate: 1 }

      const rate = await ctx.prisma.exchangeRate.findUnique({
        where: { fromCurrency_toCurrency: { fromCurrency: input.from, toCurrency: input.to } },
      })

      if (!rate) {
        const reverseRate = await ctx.prisma.exchangeRate.findUnique({
          where: { fromCurrency_toCurrency: { fromCurrency: input.to, toCurrency: input.from } },
        })
        if (reverseRate) {
          return { amount: input.amount / Number(reverseRate.rate), rate: 1 / Number(reverseRate.rate) }
        }
        throw new Error(`No hay tasa de cambio definida para ${input.from} → ${input.to}`)
      }

      return { amount: input.amount * Number(rate.rate), rate: Number(rate.rate) }
    }),

  setExchangeRate: protectedProcedure
    .input(z.object({
      fromCurrency: z.string().min(1),
      toCurrency: z.string().min(1),
      rate: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.exchangeRate.findUnique({
        where: { fromCurrency_toCurrency: { fromCurrency: input.fromCurrency, toCurrency: input.toCurrency } },
      })

      if (existing) {
        return ctx.prisma.exchangeRate.update({
          where: { id: existing.id },
          data: { rate: input.rate },
        })
      }

      return ctx.prisma.exchangeRate.create({
        data: { fromCurrency: input.fromCurrency, toCurrency: input.toCurrency, rate: input.rate },
      })
    }),

  deleteExchangeRate: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const rate = await ctx.prisma.exchangeRate.findUnique({ where: { id: input } })
      if (!rate) throw new Error("Tasa no encontrada")
      return ctx.prisma.exchangeRate.delete({ where: { id: input } })
    }),

  seedDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.prisma.currency.count()
    if (existing > 0) return { skipped: true }

    const currencies = [
      { code: "DOP", name: "Peso Dominicano", symbol: "RD$" },
      { code: "USD", name: "Dólar Estadounidense", symbol: "US$" },
      { code: "EUR", name: "Euro", symbol: "€" },
    ]

    for (const c of currencies) {
      await ctx.prisma.currency.create({ data: c })
    }

    await ctx.prisma.exchangeRate.create({
      data: { fromCurrency: "USD", toCurrency: "DOP", rate: 60 },
    })

    return { created: true }
  }),
})
