"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function SubscriptionsPage() {
  const { data: subscriptions, refetch } = api.subscription.list.useQuery()
  const createSub = api.subscription.create.useMutation({ onSuccess: () => refetch() })
  const deleteSub = api.subscription.delete.useMutation({ onSuccess: () => refetch() })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "", category: "", amount: 0, currency: "DOP",
    billingCycle: "MONTHLY" as const,
    nextBillingDate: "", reminderDaysBefore: 3, notes: "",
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createSub.mutateAsync({
      ...form,
      nextBillingDate: new Date(form.nextBillingDate).toISOString(),
    })
    setForm({ name: "", category: "", amount: 0, currency: "DOP", billingCycle: "MONTHLY", nextBillingDate: "", reminderDaysBefore: 3, notes: "" })
    setShowForm(false)
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-700",
      PAUSED: "bg-yellow-100 text-yellow-700",
      CANCELLED: "bg-red-100 text-red-700",
    }
    const labels: Record<string, string> = {
      ACTIVE: "Activa",
      PAUSED: "Pausada",
      CANCELLED: "Cancelada",
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || ""}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suscripciones</h1>
          <p className="text-muted-foreground">Controla tus pagos recurrentes</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva suscripción
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nueva suscripción</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Netflix" required />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej: Entretenimiento" />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" step="0.01" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="DOP">DOP</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ciclo de facturación</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.billingCycle}
                  onChange={(e) => setForm({ ...form, billingCycle: e.target.value as any })}
                >
                  <option value="WEEKLY">Semanal</option>
                  <option value="BIWEEKLY">Quincenal</option>
                  <option value="MONTHLY">Mensual</option>
                  <option value="QUARTERLY">Trimestral</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Próxima facturación</Label>
                <DatePicker value={form.nextBillingDate} onChange={(val) => setForm({ ...form, nextBillingDate: val })} required />
              </div>
              <div className="space-y-2">
                <Label>Recordar días antes</Label>
                <Input type="number" min={0} value={form.reminderDaysBefore} onChange={(e) => setForm({ ...form, reminderDaysBefore: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={createSub.isPending}>Guardar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!subscriptions || subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tienes suscripciones registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <Card key={sub.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{sub.name}</p>
                    {getStatusBadge(sub.status)}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {sub.category && <span>{sub.category}</span>}
                    <span>Ciclo: {sub.billingCycle.toLowerCase()}</span>
                    <span>Próximo: {new Date(sub.nextBillingDate).toLocaleDateString("es-DO")}</span>
                    {sub.reminderDaysBefore > 0 && <span>Recordar {sub.reminderDaysBefore} días antes</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{formatCurrency(Number(sub.amount), sub.currency)}</p>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSub.mutate(sub.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
