"use client"

import { useState, useRef, useEffect } from "react"
import { api } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Brain, Send, Loader2, Sparkles } from "lucide-react"

export default function AdvisorPage() {
  const { data: user } = api.user.me.useQuery()
  const { data: recommendations, refetch: refetchRecs, isLoading: recsLoading } = api.advisor.getRecommendations.useQuery(undefined, { enabled: false })

  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const hasApiKey = !!user?.deepseekApiKey

  async function handleAnalyze() {
    await refetchRecs()
  }

  async function handleSend() {
    if (!input.trim() || streaming) return

    const userMsg = input.trim()
    setInput("")
    setStreaming(true)
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])

    const history = [
      { role: "system", content: "Eres un asesor financiero experto. Ayudas a usuarios a entender sus finanzas basándote en datos reales. Responde siempre en español, de forma clara y práctica. Sé conciso." },
      ...messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMsg },
    ]

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) {
        const text = await res.text()
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${text}` }])
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue
          const data = trimmed.slice(6)
          if (data === "[DONE]") continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              assistantContent += parsed.content
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: "assistant", content: assistantContent }
                return updated
              })
            }
          } catch {
            // skip
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error de conexión: ${error instanceof Error ? error.message : "error desconocido"}` }])
    }

    setStreaming(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" />
          Asesor Financiero
        </h1>
        <p className="text-muted-foreground">Análisis y recomendaciones basadas en tus finanzas con IA</p>
      </div>

      {!hasApiKey && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              No has configurado tu API key de DeepSeek. Ve a{' '}
              <a href="/dashboard/settings" className="underline font-semibold">Configuración</a>{' '}
              y agrega tu clave para usar el asesor financiero.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recomendaciones personalizadas
          </CardTitle>
          <CardDescription>
            El asesor analiza tus cuentas, presupuestos, suscripciones y gastos para darte consejos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleAnalyze} disabled={recsLoading || !hasApiKey}>
            {recsLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analizando...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Analizar mis finanzas</>
            )}
          </Button>

          {recommendations?.text && (
            <div className="p-4 border rounded-lg bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed">
              {recommendations.text}
            </div>
          )}
          {recommendations?.error && (
            <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950 text-sm text-red-700 dark:text-red-300">
              {recommendations.error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col min-h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">Chat con el asesor</CardTitle>
          <CardDescription>Haz preguntas sobre tus finanzas y recibe respuestas personalizadas.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 max-h-[400px] overflow-y-auto space-y-3 mb-4 p-3 border rounded-lg bg-muted/20">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>Pregúntale al asesor sobre:</p>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {["¿En qué gasto más?", "¿Cómo puedo ahorrar?", "¿Debería pagar mis deudas primero?", "Analiza mis suscripciones"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-accent transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content || (msg.role === "assistant" && streaming && <Loader2 className="h-4 w-4 animate-spin inline" />)}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={hasApiKey ? "Escribe tu pregunta..." : "Configura tu API key en Ajustes primero"}
              disabled={!hasApiKey || streaming}
            />
            <Button type="submit" size="icon" disabled={!hasApiKey || streaming || !input.trim()}>
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
