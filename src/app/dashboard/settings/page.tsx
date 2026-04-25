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

  const [name, setName] = useState(user?.name ?? "")
  const [chatId, setChatId] = useState("")

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
    </div>
  )
}
