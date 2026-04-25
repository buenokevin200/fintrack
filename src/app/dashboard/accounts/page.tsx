"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, CreditCard, Landmark, PiggyBank } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

const accountTypeLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  CREDIT: { label: "Tarjeta de crédito", icon: CreditCard },
  DEBIT: { label: "Cuenta débito", icon: Landmark },
  LOAN: { label: "Préstamo", icon: PiggyBank },
}

export default function AccountsPage() {
  const { data: accounts, refetch } = api.creditAccount.list.useQuery()
  const createAccount = api.creditAccount.create.useMutation({ onSuccess: () => refetch() })
  const createLoanMutation = api.loan.create.useMutation({ onSuccess: () => refetch() })
  const deleteAccount = api.creditAccount.delete.useMutation({ onSuccess: () => refetch() })
  const [showForm, setShowForm] = useState(false)
  const [accountType, setAccountType] = useState<"CREDIT" | "DEBIT" | "LOAN">("CREDIT")
  const [form, setForm] = useState({
    name: "", issuer: "", limitDOP: 0, limitUSD: 0, initialBalance: 0, closingDay: 1, paymentDays: 20, color: "#3B82F6", notes: "",
  })
  const [loanForm, setLoanForm] = useState({
    totalAmount: 0, installments: 12, interestRate: 0, monthlyPayment: 0,
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const created = await createAccount.mutateAsync({
      ...form,
      type: accountType,
    })
    if (accountType === "LOAN") {
      await createLoanMutation.mutateAsync({
        accountId: created.id,
        name: form.name,
        totalAmount: loanForm.totalAmount || form.limitDOP,
        installments: loanForm.installments,
        interestRate: loanForm.interestRate,
        startDate: new Date().toISOString(),
        monthlyPayment: loanForm.monthlyPayment || (loanForm.totalAmount / loanForm.installments),
      })
    }
    setForm({ name: "", issuer: "", limitDOP: 0, limitUSD: 0, initialBalance: 0, closingDay: 1, paymentDays: 20, color: "#3B82F6", notes: "" })
    setLoanForm({ totalAmount: 0, installments: 12, interestRate: 0, monthlyPayment: 0 })
    setAccountType("CREDIT")
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cuentas</h1>
          <p className="text-muted-foreground">Administra tus cuentas de crédito, débito y préstamos</p>
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
            <div className="flex gap-2 mb-4">
              {(["CREDIT", "DEBIT", "LOAN"] as const).map((type) => {
                const info = accountTypeLabels[type]
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                      accountType === type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <info.icon className={`h-5 w-5 mx-auto mb-1 ${accountType === type ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-xs font-medium">{info.label}</p>
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={accountType === "CREDIT" ? "Ej: Visa Platino" : accountType === "DEBIT" ? "Ej: Cuenta corriente" : "Ej: Préstamo hipotecario"} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Banco/Emisor</Label>
                <Input id="issuer" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="Ej: Banco Popular" required />
              </div>

              {accountType === "CREDIT" && (
                <>
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
                </>
              )}

              {accountType === "DEBIT" && (
                <div className="space-y-2">
                  <Label htmlFor="initialBalance">Balance inicial</Label>
                  <Input id="initialBalance" type="number" step="0.01" value={form.initialBalance || ""} onChange={(e) => setForm({ ...form, initialBalance: parseFloat(e.target.value) || 0 })} />
                </div>
              )}

              {accountType === "LOAN" && (
                <>
                  <div className="space-y-2">
                    <Label>Monto total</Label>
                    <Input type="number" step="0.01" value={loanForm.totalAmount || ""} onChange={(e) => setLoanForm({ ...loanForm, totalAmount: parseFloat(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Cuotas</Label>
                    <Input type="number" value={loanForm.installments} onChange={(e) => setLoanForm({ ...loanForm, installments: parseInt(e.target.value) || 1 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Interés (%)</Label>
                    <Input type="number" step="0.01" value={loanForm.interestRate || ""} onChange={(e) => setLoanForm({ ...loanForm, interestRate: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pago mensual</Label>
                    <Input type="number" step="0.01" value={loanForm.monthlyPayment || ""} onChange={(e) => setLoanForm({ ...loanForm, monthlyPayment: parseFloat(e.target.value) || 0 })} />
                  </div>
                </>
              )}

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
          {accounts.map((acc) => {
            const info = accountTypeLabels[acc.type] ?? accountTypeLabels.CREDIT
            return (
              <Card key={acc.id} className="relative">
                <Link href={`/dashboard/accounts/${acc.id}`} className="block">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                      <CardTitle className="text-lg">{acc.name}</CardTitle>
                      <span className="text-xs text-muted-foreground ml-auto">{info.label}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{acc.issuer}</p>
                    {acc.type === "CREDIT" && (
                      <>
                        <p className="text-2xl font-bold mb-2">
                          {Number(acc.limitDOP) > 0 && `${formatCurrency(Number(acc.limitDOP), "DOP")} `}
                          {Number(acc.limitUSD) > 0 && `${formatCurrency(Number(acc.limitUSD), "USD")}`}
                          {Number(acc.limitDOP) === 0 && Number(acc.limitUSD) === 0 && "Sin límite"}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Cierre: {acc.closingDay}</span>
                          <span>{acc.paymentDays} días para pagar</span>
                        </div>
                      </>
                    )}
                    {acc.type === "DEBIT" && (
                      <p className="text-2xl font-bold mb-2">{formatCurrency(Number(acc.initialBalance), "DOP")}</p>
                    )}
                    {acc.type === "LOAN" && (
                      <div>
                        <p className="text-2xl font-bold mb-2">
                          {acc.loans.length > 0 ? formatCurrency(Number(acc.loans[0].totalAmount)) : "Sin préstamo"}
                        </p>
                        {acc.loans.length > 0 && (
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${(acc.loans[0].paidInstallments / acc.loans[0].installments) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{acc._count.transactions} transacciones</p>
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
            )
          })}
        </div>
      )}
    </div>
  )
}
