"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, Trash2, ArrowRightLeft } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function TransactionsPage() {
  const { data: transactions, refetch } = api.transaction.list.useQuery()
  const { data: accounts } = api.creditAccount.list.useQuery()
  const createTx = api.transaction.create.useMutation({ onSuccess: () => refetch() })
  const createTransfer = api.transaction.createTransfer.useMutation({ onSuccess: () => refetch() })
  const deleteTx = api.transaction.delete.useMutation({ onSuccess: () => refetch() })
  const [showForm, setShowForm] = useState<"transaction" | "transfer" | null>(null)
  const [form, setForm] = useState({
    description: "", amount: 0, type: "EXPENSE" as const, currency: "DOP",
    date: new Date().toISOString().split("T")[0],
    category: "", notes: "", creditAccountId: "",
  })
  const [transferForm, setTransferForm] = useState({
    description: "", amount: 0, fromAccountId: "", toAccountId: "",
    date: new Date().toISOString().split("T")[0], currency: "DOP", notes: "",
  })

  const debitAccounts = accounts?.filter((a) => a.type === "DEBIT") ?? []
  const creditAccounts = accounts?.filter((a) => a.type === "CREDIT" || a.type === "DEBIT") ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
          <p className="text-muted-foreground">Registro de ingresos, gastos y transferencias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowForm(showForm === "transfer" ? null : "transfer")}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transferencia
          </Button>
          <Button onClick={() => setShowForm(showForm === "transaction" ? null : "transaction")}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva transacción
          </Button>
        </div>
      </div>

      {showForm === "transaction" && (
        <Card>
          <CardHeader><CardTitle>Nueva transacción</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await createTx.mutateAsync({
                  ...form,
                  currency: form.currency || undefined,
                  date: new Date(form.date).toISOString(),
                  creditAccountId: form.creditAccountId || undefined,
                })
                setForm({ description: "", amount: 0, type: "EXPENSE", currency: "DOP", date: new Date().toISOString().split("T")[0], category: "", notes: "", creditAccountId: "" })
                setShowForm(null)
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" step="0.01" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                  <option value="EXPENSE">Gasto</option>
                  <option value="INCOME">Ingreso</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="DOP">DOP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <DatePicker value={form.date} onChange={(val) => setForm({ ...form, date: val })} required />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej: Comida, Transporte" />
              </div>
              <div className="space-y-2">
                <Label>Cuenta (opcional)</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.creditAccountId} onChange={(e) => setForm({ ...form, creditAccountId: e.target.value })}>
                  <option value="">Sin cuenta</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type === "CREDIT" ? "Crédito" : a.type === "DEBIT" ? "Débito" : "Préstamo"})</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={createTx.isPending}>Guardar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(null)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showForm === "transfer" && (
        <Card>
          <CardHeader><CardTitle>Nueva transferencia</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await createTransfer.mutateAsync({
                  ...transferForm,
                  date: new Date(transferForm.date).toISOString(),
                })
                setTransferForm({ description: "", amount: 0, fromAccountId: "", toAccountId: "", date: new Date().toISOString().split("T")[0], currency: "DOP", notes: "" })
                setShowForm(null)
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={transferForm.description} onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })} placeholder="Ej: Pago tarjeta de crédito" required />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" step="0.01" value={transferForm.amount || ""} onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <Label>Cuenta origen</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={transferForm.fromAccountId} onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })} required>
                  <option value="">Seleccionar</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type === "CREDIT" ? "Crédito" : a.type === "DEBIT" ? "Débito" : "Préstamo"})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Cuenta destino</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={transferForm.toAccountId} onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })} required>
                  <option value="">Seleccionar</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type === "CREDIT" ? "Crédito" : a.type === "DEBIT" ? "Débito" : "Préstamo"})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={transferForm.currency} onChange={(e) => setTransferForm({ ...transferForm, currency: e.target.value })}>
                  <option value="DOP">DOP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <DatePicker value={transferForm.date} onChange={(val) => setTransferForm({ ...transferForm, date: val })} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notas</Label>
                <Input value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={createTransfer.isPending}>Transferir</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(null)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!transactions || transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay transacciones registradas</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {tx.type === "TRANSFER" && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">Transf.</span>
                      )}
                      <p className="text-sm font-medium">{tx.description}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("es-DO")}
                      {tx.category && ` · ${tx.category}`}
                      {tx.currency !== "DOP" && ` · ${tx.currency}`}
                      {tx.creditAccount && ` · ${tx.creditAccount.name}`}
                      {tx.destinationAccount && ` → ${tx.destinationAccount.name}`}
                      {tx.subscription && ` · ${tx.subscription.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-semibold ${tx.type === "TRANSFER" ? "text-blue-600" : tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "TRANSFER" ? "⇄" : tx.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                    </p>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTx.mutate(tx.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
