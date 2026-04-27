const DEEPSEEK_BASE = "https://api.deepseek.com/v1"

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export function streamDeepSeek(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  return fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((err) => {
        throw new Error(err.error?.message || `DeepSeek API error: ${res.status}`)
      })
    }
    return res.body!
  })
}

export async function callDeepSeek(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `DeepSeek API error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

export function buildFinancialContext(data: {
  accounts: unknown[]
  subscriptions: unknown[]
  budgets: unknown[]
  loans: unknown[]
  summary: unknown
  dailyExpenses: unknown[]
}): string {
  return JSON.stringify(
    {
      cuentas: data.accounts,
      suscripciones: data.subscriptions,
      presupuestos: data.budgets,
      prestamos: data.loans,
      resumen_financiero: data.summary,
      gastos_diarios: data.dailyExpenses,
    },
    null,
    2
  )
}
