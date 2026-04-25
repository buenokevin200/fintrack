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

const periodLabels: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  YEARLY: "Anual",
}

export default function BudgetsPage() {
  const { data: budgets, refetch } = api.budget.list.useQuery()
  const createBudget = api.budget.create.useMutation({ onSuccess: () => refetch() })
  const deleteBudget = api.budget.delete.useMutation({ onSuccess: () => refetch() })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    category: "", amount: 0, period: "MONTHLY" as const,
    startDate: new Date().toISOString().split("T")[0], notes: "",
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-muted-foreground">Define tus límites de gasto por categoría</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo presupuesto
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo presupuesto</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await createBudget.mutateAsync({
                  ...form,
                  startDate: new Date(form.startDate).toISOString(),
                })
                setForm({ category: "", amount: 0, period: "MONTHLY", startDate: new Date().toISOString().split("T")[0], notes: "" })
                setShowForm(false)
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej: Alimentación, Transporte" required />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" step="0.01" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value as any })}
                >
                  <option value="WEEKLY">Semanal</option>
                  <option value="BIWEEKLY">Quincenal</option>
                  <option value="MONTHLY">Mensual</option>
                  <option value="QUARTERLY">Trimestral</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de inicio</Label>
                <DatePicker value={form.startDate} onChange={(val) => setForm({ ...form, startDate: val })} required />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={createBudget.isPending}>Guardar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!budgets || budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tienes presupuestos definidos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{b.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {periodLabels[b.period]} · Desde {new Date(b.startDate).toLocaleDateString("es-DO")}
                    {b.notes && ` · ${b.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{formatCurrency(Number(b.amount))}</p>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteBudget.mutate(b.id)}>
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
