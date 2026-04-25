import { NextResponse } from "next/server"
import { prisma } from "@/server/db/prisma"
import {
  sendPaymentReminder,
  sendBudgetAlert,
} from "@/server/telegram"

export async function GET() {
  const now = new Date()
  const results: string[] = []

  const users = await prisma.user.findMany({
    where: { telegramChatId: { not: null } },
  })

  for (const user of users) {
    if (!user.telegramChatId) continue

    // Payment reminders: subscriptions due within reminder window
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
        nextBillingDate: {
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    })

    for (const sub of dueSubscriptions) {
      const daysLeft = Math.ceil(
        (sub.nextBillingDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )
      if (daysLeft <= sub.reminderDaysBefore && daysLeft >= 0) {
        await sendPaymentReminder(
          user.telegramChatId,
          sub.name,
          `${Number(sub.amount)} ${sub.currency}`,
          sub.nextBillingDate.toISOString().split("T")[0],
          daysLeft
        )
        results.push(`Payment reminder sent to ${user.email} for ${sub.name}`)
      }
    }

    // Budget alerts: categories exceeding 80%
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
    })

    for (const budget of budgets) {
      const spent = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          category: budget.category,
          type: "EXPENSE",
          date: { gte: budget.startDate },
        },
        _sum: { amount: true },
      })

      const spentAmount = Number(spent._sum.amount ?? 0)
      const budgetAmount = Number(budget.amount)
      if (budgetAmount > 0 && spentAmount / budgetAmount >= 0.8) {
        await sendBudgetAlert(
          user.telegramChatId,
          budget.category,
          `${budgetAmount}`,
          `${spentAmount}`,
          Math.round((spentAmount / budgetAmount) * 100)
        )
        results.push(`Budget alert sent to ${user.email} for ${budget.category}`)
      }
    }
  }

  return NextResponse.json({
    success: true,
    processed: results,
    timestamp: now.toISOString(),
  })
}
