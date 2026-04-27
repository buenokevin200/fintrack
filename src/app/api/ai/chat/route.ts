import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/server/db/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { deepseekApiKey: true, deepseekModel: true },
  })

  if (!user?.deepseekApiKey) {
    return new Response("DeepSeek API key no configurada. Agrega tu API key en Configuración.", { status: 400 })
  }

  const { messages } = await req.json()
  if (!messages || !Array.isArray(messages)) {
    return new Response("Messages required", { status: 400 })
  }

  const model = user.deepseekModel || "deepseek-chat"

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return new Response(err.error?.message || `DeepSeek error: ${res.status}`, { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith("data: ")) continue
              const data = trimmed.slice(6)
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                return
              }
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Error interno",
      { status: 500 }
    )
  }
}
