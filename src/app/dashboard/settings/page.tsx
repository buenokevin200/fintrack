"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function SettingsPage() {
  const { data: user, refetch } = api.user.me.useQuery()
  const updateProfile = api.user.updateProfile.useMutation({ onSuccess: () => refetch() })
  const updateTelegram = api.user.updateTelegramChatId.useMutation({ onSuccess: () => refetch() })
  const removeTelegram = api.user.removeTelegram.useMutation({ onSuccess: () => refetch() })
  const sendTelegramTest = api.user.sendTelegramTest.useMutation()

  const { data: currencies, refetch: refetchCurrencies } = api.currency.list.useQuery()
  const setRate = api.currency.setExchangeRate.useMutation({ onSuccess: () => refetchCurrencies() })
  const deleteRate = api.currency.deleteExchangeRate.useMutation({ onSuccess: () => refetchCurrencies() })
  const seedCurrencies = api.currency.seedDefaults.useMutation({ onSuccess: () => refetchCurrencies() })
  const updateDeepSeek = api.user.updateDeepSeekConfig.useMutation({ onSuccess: () => refetch() })
  const removeDeepSeek = api.user.removeDeepSeekConfig.useMutation({ onSuccess: () => refetch() })

  const [name, setName] = useState(user?.name ?? "")
  const [chatId, setChatId] = useState("")
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle")
  const [rateForm, setRateForm] = useState({ fromCurrency: "USD", toCurrency: "DOP", rate: 60 })
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [modelInput, setModelInput] = useState("deepseek-chat")

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu perfil y preferencias</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Perfil</CardTitle>
          <CardDescription>Actualiza tu información personal</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              await updateProfile.mutateAsync({ name })
            }}
            className="space-y-4 max-w-md"
          >
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>Guardar perfil</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notificaciones por Telegram</CardTitle>
          <CardDescription>
            Conecta un bot de Telegram para recibir recordatorios de pago, alertas de presupuesto y resúmenes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.telegramChatId ? (
            <div className="space-y-4">
              <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Bot de Telegram conectado
                </p>
                <p className="text-xs text-muted-foreground">
                  Chat ID: {user.telegramChatId}
                </p>
              </div>
              <Button variant="destructive" onClick={() => removeTelegram.mutate()}>
                Desvincular bot
              </Button>
              <Button
                variant="outline"
                disabled={sendTelegramTest.isPending}
                onClick={async () => {
                  setTestStatus("idle")
                  try {
                    await sendTelegramTest.mutateAsync()
                    setTestStatus("success")
                  } catch {
                    setTestStatus("error")
                  }
                }}
              >
                {sendTelegramTest.isPending ? "Enviando..." : "Enviar mensaje de prueba"}
              </Button>
              {testStatus === "success" && (
                <p className="text-sm text-green-600">Mensaje enviado correctamente</p>
              )}
              {testStatus === "error" && (
                <p className="text-sm text-red-600">Error al enviar. Verifica el token del bot.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Instrucciones:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Crea un bot con <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a> en Telegram</li>
                  <li>Copia el token y agrégalo como variable <code className="bg-muted px-1 rounded">TELEGRAM_BOT_TOKEN</code> en tu servidor</li>
                  <li>Envía un mensaje a tu bot y visita: <code className="bg-muted px-1 rounded">https://api.telegram.org/bot{"[TU_TOKEN]"}/getUpdates</code></li>
                  <li>Copia tu <code className="bg-muted px-1 rounded">chat.id</code> y pégalo abajo</li>
                </ol>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  await updateTelegram.mutateAsync({ telegramChatId: chatId })
                  setChatId("")
                }}
                className="space-y-4 max-w-md"
              >
                <div className="space-y-2">
                  <Label>Chat ID de Telegram</Label>
                  <Input value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="Ej: 123456789" required />
                </div>
                <Button type="submit" disabled={updateTelegram.isPending}>Vincular bot</Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Divisas y tasas de cambio</CardTitle>
          <CardDescription>
            Gestiona las divisas disponibles y sus equivalencias. Ej: 1 USD = 60 DOP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(!currencies || currencies.length === 0) ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">No hay divisas configuradas</p>
              <Button onClick={() => seedCurrencies.mutate()} disabled={seedCurrencies.isPending}>
                Crear divisas por defecto (DOP, USD, EUR)
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {currencies.map((c) => (
                  <div key={c.code} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{c.code} - {c.name}</p>
                        <p className="text-xs text-muted-foreground">Símbolo: {c.symbol}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {c.ratesFrom.map((r) => (
                          <p key={r.id}>
                            1 {r.fromCurrency} = {Number(r.rate)} {r.toCurrency}
                            <button
                              className="ml-2 text-destructive hover:underline"
                              onClick={() => deleteRate.mutate(r.id)}
                            >
                              Eliminar
                            </button>
                          </p>
                        ))}
                        {c.ratesFrom.length === 0 && (
                          <p className="text-muted-foreground">Sin tasas</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Nueva tasa de cambio</p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    await setRate.mutateAsync(rateForm)
                    setRateForm({ fromCurrency: "USD", toCurrency: "DOP", rate: 60 })
                  }}
                  className="flex items-end gap-3 flex-wrap"
                >
                  <div className="space-y-1">
                    <Label>De</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={rateForm.fromCurrency}
                      onChange={(e) => setRateForm({ ...rateForm, fromCurrency: e.target.value })}
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>A</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={rateForm.toCurrency}
                      onChange={(e) => setRateForm({ ...rateForm, toCurrency: e.target.value })}
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Tasa</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      className="w-28"
                      value={rateForm.rate || ""}
                      onChange={(e) => setRateForm({ ...rateForm, rate: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={setRate.isPending}>Guardar</Button>
                </form>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inteligencia Artificial</CardTitle>
          <CardDescription>
            Configura tu API key de DeepSeek para usar el Asesor Financiero con IA.
            Obtén tu key en{' '}
            <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              platform.deepseek.com
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.deepseekApiKey ? (
            <div className="space-y-4">
              <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  DeepSeek configurado
                </p>
                <p className="text-xs text-muted-foreground">
                  Modelo: {user.deepseekModel || "deepseek-chat"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  API Key: {user.deepseekApiKey.substring(0, 8)}...
                </p>
              </div>
              <Button variant="destructive" onClick={() => removeDeepSeek.mutate()}>
                Eliminar configuración
              </Button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await updateDeepSeek.mutateAsync({ deepseekApiKey: apiKeyInput, deepseekModel: modelInput })
                setApiKeyInput("")
              }}
              className="space-y-4 max-w-md"
            >
              <div className="space-y-2">
                <Label>API Key de DeepSeek</Label>
                <Input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Tu API key se guarda encriptada. Nunca la compartiremos.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                >
                  <option value="deepseek-chat">DeepSeek Chat (rápido, ideal para chat)</option>
                  <option value="deepseek-reasoner">DeepSeek Reasoner (razonamiento profundo)</option>
                </select>
              </div>
              <Button type="submit" disabled={updateDeepSeek.isPending}>Guardar configuración</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
