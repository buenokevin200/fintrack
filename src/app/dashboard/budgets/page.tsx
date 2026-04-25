"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, Trash2, Car, Home, ShoppingCart, UtensilsCrossed, Plane, HeartPulse, GraduationCap, Wifi, Zap, Shirt, Gamepad2, PawPrint, Film, PhoneCall, Dumbbell, Gift, Coffee, Bus, BookOpen } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

const iconOptions: { name: string; icon: LucideIcon; label: string }[] = [
  { name: "UtensilsCrossed", icon: UtensilsCrossed, label: "Comida" },
  { name: "Home", icon: Home, label: "Hogar" },
  { name: "Car", icon: Car, label: "Auto" },
  { name: "ShoppingCart", icon: ShoppingCart, label: "Compras" },
  { name: "Wifi", icon: Wifi, label: "Internet" },
  { name: "Zap", icon: Zap, label: "Luz" },
  { name: "PhoneCall", icon: PhoneCall, label: "Teléfono" },
  { name: "HeartPulse", icon: HeartPulse, label: "Salud" },
  { name: "GraduationCap", icon: GraduationCap, label: "Estudios" },
  { name: "Plane", icon: Plane, label: "Viajes" },
  { name: "Shirt", icon: Shirt, label: "Ropa" },
  { name: "Gamepad2", icon: Gamepad2, label: "Juegos" },
  { name: "PawPrint", icon: PawPrint, label: "Mascotas" },
  { name: "Film", icon: Film, label: "Cine" },
  { name: "Dumbbell", icon: Dumbbell, label: "Gym" },
  { name: "Gift", icon: Gift, label: "Regalos" },
  { name: "Coffee", icon: Coffee, label: "Café" },
  { name: "Bus", icon: Bus, label: "Transporte" },
  { name: "BookOpen", icon: BookOpen, label: "Libros" },
]

const periodLabels: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  YEARLY: "Anual",
}

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed, Home, Car, ShoppingCart, Wifi, Zap, PhoneCall,
  HeartPulse, GraduationCap, Plane, Shirt, Gamepad2, PawPrint,
  Film, Dumbbell, Gift, Coffee, Bus, BookOpen,
}

export default function BudgetsPage() {
  const { data: budgets, refetch } = api.budget.list.useQuery()
  const createBudget = api.budget.create.useMutation({ onSuccess: () => refetch() })
  const deleteBudget = api.budget.delete.useMutation({ onSuccess: () => refetch() })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    category: "", icon: "", amount: 0, period: "MONTHLY" as const,
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
                  icon: form.icon || undefined,
                  startDate: new Date(form.startDate).toISOString(),
                })
                setForm({ category: "", icon: "", amount: 0, period: "MONTHLY", startDate: new Date().toISOString().split("T")[0], notes: "" })
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
              <div className="space-y-2 md:col-span-2">
                <Label>Ícono</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setForm({ ...form, icon: form.icon === opt.name ? "" : opt.name })}
                      className={cn(
                        "p-2 rounded-lg border transition-colors",
                        form.icon === opt.name
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-accent"
                      )}
                      title={opt.label}
                    >
                      <opt.icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
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
          {budgets.map((b) => {
            const IconComponent = b.icon ? iconMap[b.icon] : null
            return (
              <Card key={b.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {IconComponent && (
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{b.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {periodLabels[b.period]} · Desde {new Date(b.startDate).toLocaleDateString("es-DO")}
                        {b.notes && ` · ${b.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{formatCurrency(Number(b.amount))}</p>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteBudget.mutate(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
