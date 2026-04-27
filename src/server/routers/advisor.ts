import { z } from "zod"
import { router, protectedProcedure } from "@/server/trpc"
import { callDeepSeek, buildFinancialContext } from "@/server/deepseek"

export const advisorRouter = router({
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { deepseekApiKey: true, deepseekModel: true },
    })

    if (!user?.deepseekApiKey) {
      return { text: "No has configurado tu API key de DeepSeek. Ve a Configuración para agregarla y poder usar el asesor financiero.", error: "No API key" }
    }

    const since = new Date()
    since.setMonth(since.getMonth() - 3)

    const [accounts, subscriptions, budgets, loans, transactions, dailyExpenses] = await Promise.all([
      ctx.prisma.creditAccount.findMany({
        where: { owners: { some: { userId: ctx.user.id } } },
        include: { loans: true, _count: { select: { transactions: true } } },
      }),
      ctx.prisma.subscription.findMany({
        where: { userId: ctx.user.id },
        orderBy: { nextBillingDate: "asc" },
      }),
      ctx.prisma.budget.findMany({
        where: { userId: ctx.user.id },
      }),
      ctx.prisma.loan.findMany({
        where: { userId: ctx.user.id },
      }),
      ctx.prisma.transaction.findMany({
        where: { userId: ctx.user.id, type: "EXPENSE" },
        orderBy: { date: "desc" },
        take: 100,
      }),
      // daily expenses last 7 days
      (async () => {
        const days: { date: string; total: number }[] = []
        for (let i = 6; i >= 0; i--) {
          const day = new Date()
          day.setDate(day.getDate() - i)
          day.setHours(0, 0, 0, 0)
          const next = new Date(day)
          next.setDate(next.getDate() + 1)
          const result = await ctx.prisma.transaction.aggregate({
            where: {
              userId: ctx.user.id,
              type: "EXPENSE",
              date: { gte: day, lt: next },
            },
            _sum: { amount: true },
          })
          days.push({
            date: day.toISOString().split("T")[0],
            total: Number(result._sum.amount ?? 0),
          })
        }
        return days
      })(),
    ])

    const totalExpenses = transactions.reduce((s, t) => s + Number(t.amount), 0)
    const byCategory = transactions.reduce((acc: Record<string, number>, t) => {
      if (t.category) acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
      return acc
    }, {})

    const summary = { totalExpenses, byCategory }

    const context = buildFinancialContext({ accounts, subscriptions, budgets, loans, summary, dailyExpenses })

    const systemPrompt = `Eres un asesor financiero experto. Analiza los siguientes datos financieros del usuario y proporciona recomendaciones personalizadas en español.
Estructura tu respuesta en secciones claras con emojis:

📊 **Resumen general**: un breve resumen de la situación financiera.
⚠️ **Alertas**: patrones de gasto preocupantes o suscripciones altas.
💡 **Recomendaciones**: consejos accionables para mejorar sus finanzas.
🎯 **Metas sugeridas**: metas financieras realistas basadas en sus datos.

Sé específico, usa números reales de los datos, y da consejos prácticos. NO inventes datos.
Máximo 500 palabras.`

    try {
      const text = await callDeepSeek(user.deepseekApiKey, user.deepseekModel || "deepseek-chat", [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Datos financieros:\n${context}\n\nPor favor, analiza estos datos y dame recomendaciones.` },
      ])
      return { text, error: null }
    } catch (error) {
      return {
        text: null,
        error: error instanceof Error ? error.message : "Error al conectar con DeepSeek",
      }
    }
  }),
})
