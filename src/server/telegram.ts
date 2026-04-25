const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function callTelegramApi(method: string, body: Record<string, unknown>) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN not configured")
    return null
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return await res.json()
  } catch (error) {
    console.error("Telegram API error:", error)
    return null
  }
}

export async function sendTelegramMessage(chatId: string, text: string) {
  return callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  })
}

export async function sendPaymentReminder(
  chatId: string,
  name: string,
  amount: string,
  date: string,
  daysLeft: number
) {
  const text = [
    `📅 <b>Recordatorio de pago</b>`,
    ``,
    `<b>${name}</b>`,
    `💰 Monto: ${amount}`,
    `📆 Vence: ${date}`,
    `⏰ Quedan <b>${daysLeft} días</b>`,
  ].join("\n")
  return sendTelegramMessage(chatId, text)
}

export async function sendBudgetAlert(
  chatId: string,
  category: string,
  budget: string,
  spent: string,
  percentage: number
) {
  const text = [
    `⚠️ <b>Alerta de presupuesto</b>`,
    ``,
    `📂 Categoría: <b>${category}</b>`,
    `💵 Presupuesto: ${budget}`,
    `💸 Gastado: ${spent} (${percentage}%)`,
  ].join("\n")
  return sendTelegramMessage(chatId, text)
}

export async function sendWeeklySummary(
  chatId: string,
  totalExpenses: string,
  totalIncome: string,
  byCategory: string
) {
  const text = [
    `📊 <b>Resumen semanal</b>`,
    ``,
    `💸 Gastos totales: ${totalExpenses}`,
    `💰 Ingresos totales: ${totalIncome}`,
    ``,
    `📂 <b>Por categoría:</b>`,
    byCategory,
  ].join("\n")
  return sendTelegramMessage(chatId, text)
}
