"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

export default function AccountsPage() {
  const { data: accounts, refetch } = api.creditAccount.list.useQuery()
  const createAccount = api.creditAccount.create.useMutation({ onSuccess: () => refetch() })
  const deleteAccount = api.creditAccount.delete.useMutation({ onSuccess: () => refetch() })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "", issuer: "", limitDOP: 0, limitUSD: 0, closingDay: 1, paymentDays: 20, color: "#3B82F6", notes: "",
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createAccount.mutateAsync(form)
    setForm({ name: "", issuer: "", limitDOP: 0, limitUSD: 0, closingDay: 1, paymentDays: 20, color: "#3B82F6", notes: "" })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cuentas</h1>
          <p className="text-muted-foreground">Administra tus cuentas de crédito y préstamos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva cuenta
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nueva cuenta</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Visa Platino" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Banco/Emisor</Label>
                <Input id="issuer" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="Ej: Banco Popular" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limitDOP">Límite (DOP)</Label>
                <Input id="limitDOP" type="number" step="0.01" value={form.limitDOP || ""} onChange={(e) => setForm({ ...form, limitDOP: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limitUSD">Límite (USD)</Label>
                <Input id="limitUSD" type="number" step="0.01" value={form.limitUSD || ""} onChange={(e) => setForm({ ...form, limitUSD: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing">Día de cierre</Label>
                <Input id="closing" type="number" min={1} max={31} value={form.closingDay} onChange={(e) => setForm({ ...form, closingDay: parseInt(e.target.value) || 1 })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDays">Días para pagar</Label>
                <Input id="paymentDays" type="number" min={1} max={90} value={form.paymentDays} onChange={(e) => setForm({ ...form, paymentDays: parseInt(e.target.value) || 20 })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={createAccount.isPending}>Guardar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!accounts || accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tienes cuentas registradas. ¡Crea una!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <Card key={acc.id} className="relative">
              <Link href={`/dashboard/accounts/${acc.id}`} className="block">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                    <CardTitle className="text-lg">{acc.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{acc.issuer}</p>
                  <p className="text-2xl font-bold mb-2">
                    {Number(acc.limitDOP) > 0 && `${formatCurrency(Number(acc.limitDOP), "DOP")} `}
                    {Number(acc.limitUSD) > 0 && `${formatCurrency(Number(acc.limitUSD), "USD")}`}
                    {Number(acc.limitDOP) === 0 && Number(acc.limitUSD) === 0 && "Sin límite"}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Cierre: {acc.closingDay}</span>
                    <span>{acc.paymentDays} días para pagar</span>
                    <span>{acc._count.transactions} transacciones</span>
                  </div>
                  {acc.cards.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {acc.cards.map((card) => (
                        <span key={card.id} className="text-xs bg-muted px-2 py-0.5 rounded">
                          *{card.lastFourDigits} {card.isPrimary ? "(principal)" : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-destructive"
                onClick={() => deleteAccount.mutate(acc.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
