"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const typeLabels: Record<string, string> = { CREDIT: "Crédito", DEBIT: "Débito", LOAN: "Préstamo" }

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>()
  const { data: account, refetch } = api.creditAccount.getById.useQuery(params.id)
  const deleteCard = api.creditCard.delete.useMutation({ onSuccess: () => refetch() })
  const createCard = api.creditCard.create.useMutation({ onSuccess: () => refetch() })
  const { data: loans, refetch: refetchLoans } = api.loan.listByAccount.useQuery(params.id)
  const deleteLoan = api.loan.delete.useMutation({ onSuccess: () => refetchLoans() })
  const createLoanMutation = api.loan.create.useMutation({ onSuccess: () => refetchLoans() })
  const updateLoanPaid = api.loan.update.useMutation({ onSuccess: () => refetchLoans() })

  const [showCardForm, setShowCardForm] = useState(false)
  const [cardForm, setCardForm] = useState({ lastFourDigits: "", cardholderName: "", isPrimary: false })
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [loanForm, setLoanForm] = useState({
    name: "", totalAmount: 0, installments: 12, interestRate: 0,
    startDate: new Date().toISOString().split("T")[0], monthlyPayment: 0, notes: "",
  })

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Cargando cuenta...</p>
      </div>
    )
  }

  const dueDay = ((account.closingDay + account.paymentDays - 1) % 31) + 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
        <p className="text-muted-foreground">{account.issuer} · {typeLabels[account.type] ?? account.type}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {account.type === "CREDIT" && (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Límite DOP</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatCurrency(Number(account.limitDOP), "DOP")}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Límite USD</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatCurrency(Number(account.limitUSD), "USD")}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Días de pago</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{account.paymentDays}</p>
                <p className="text-xs text-muted-foreground">Cierre día {account.closingDay} · Vence día {dueDay}</p>
              </CardContent>
            </Card>
          </>
        )}
        {account.type === "DEBIT" && (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Balance</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{formatCurrency(Number(account.initialBalance), "DOP")}</p></CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cuenta débito</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Cuenta para gastos diarios y transferencias</p></CardContent>
            </Card>
          </>
        )}
        {account.type === "LOAN" && (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Monto total</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{loans?.[0] ? formatCurrency(Number(loans[0].totalAmount)) : "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cuota mensual</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{loans?.[0] ? formatCurrency(Number(loans[0].monthlyPayment)) : "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Progreso</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{loans?.[0] ? `${loans[0].paidInstallments}/${loans[0].installments}` : "—"}</p>
                <p className="text-xs text-muted-foreground">cuotas pagadas</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {(account.type === "CREDIT" || account.type === "DEBIT") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Tarjetas</CardTitle>
            <Button size="sm" onClick={() => setShowCardForm(!showCardForm)}>
              <Plus className="h-3 w-3 mr-1" /> Agregar
            </Button>
          </CardHeader>
          <CardContent>
            {showCardForm && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  await createCard.mutateAsync({ accountId: params.id, ...cardForm })
                  setCardForm({ lastFourDigits: "", cardholderName: "", isPrimary: false })
                  setShowCardForm(false)
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <Label>Últimos 4 dígitos</Label>
                  <Input maxLength={4} value={cardForm.lastFourDigits} onChange={(e) => setCardForm({ ...cardForm, lastFourDigits: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Titular</Label>
                  <Input value={cardForm.cardholderName} onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })} required />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={cardForm.isPrimary} onChange={(e) => setCardForm({ ...cardForm, isPrimary: e.target.checked })} />
                    Principal
                  </label>
                  <Button type="submit" size="sm" disabled={createCard.isPending}>Guardar</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowCardForm(false)}>Cancelar</Button>
                </div>
              </form>
            )}
            {account.cards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay tarjetas registradas</p>
            ) : (
              <div className="space-y-2">
                {account.cards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">****{card.lastFourDigits}</p>
                      <p className="text-xs text-muted-foreground">{card.cardholderName}{card.isPrimary ? " · Principal" : ""}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCard.mutate(card.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Préstamos</CardTitle>
          <Button size="sm" onClick={() => setShowLoanForm(!showLoanForm)}>
            <Plus className="h-3 w-3 mr-1" /> Nuevo préstamo
          </Button>
        </CardHeader>
        <CardContent>
          {showLoanForm && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await createLoanMutation.mutateAsync({
                  accountId: params.id,
                  ...loanForm,
                  startDate: new Date(loanForm.startDate).toISOString(),
                })
                setLoanForm({ name: "", totalAmount: 0, installments: 12, interestRate: 0, startDate: new Date().toISOString().split("T")[0], monthlyPayment: 0, notes: "" })
                setShowLoanForm(false)
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-3 border rounded-lg"
            >
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={loanForm.name} onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Monto total</Label>
                <Input type="number" step="0.01" value={loanForm.totalAmount || ""} onChange={(e) => setLoanForm({ ...loanForm, totalAmount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-1">
                <Label>Cuotas</Label>
                <Input type="number" value={loanForm.installments} onChange={(e) => setLoanForm({ ...loanForm, installments: parseInt(e.target.value) || 1 })} required />
              </div>
              <div className="space-y-1">
                <Label>Interés (%)</Label>
                <Input type="number" step="0.01" value={loanForm.interestRate || ""} onChange={(e) => setLoanForm({ ...loanForm, interestRate: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label>Fecha inicio</Label>
                <DatePicker value={loanForm.startDate} onChange={(val) => setLoanForm({ ...loanForm, startDate: val })} />
              </div>
              <div className="space-y-1">
                <Label>Pago mensual</Label>
                <Input type="number" step="0.01" value={loanForm.monthlyPayment || ""} onChange={(e) => setLoanForm({ ...loanForm, monthlyPayment: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-1 md:col-span-3">
                <Label>Notas</Label>
                <Input value={loanForm.notes} onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })} />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" size="sm" disabled={createLoanMutation.isPending}>Guardar</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowLoanForm(false)}>Cancelar</Button>
              </div>
            </form>
          )}
          {!loans || loans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay préstamos registrados</p>
          ) : (
            <div className="space-y-2">
              {loans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{loan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(loan.monthlyPayment))}/mes · {loan.paidInstallments}/{loan.installments} cuotas pagadas
                      {Number(loan.interestRate) > 0 && ` · ${Number(loan.interestRate)}% interés`}
                    </p>
                    <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${(loan.paidInstallments / loan.installments) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loan.paidInstallments >= loan.installments}
                      onClick={() => updateLoanPaid.mutate({ id: loan.id, paidInstallments: loan.paidInstallments + 1 })}
                    >
                      Pagar cuota
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteLoan.mutate(loan.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {account.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay transacciones en esta cuenta</p>
          ) : (
            <div className="divide-y">
              {account.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="flex items-center gap-1">
                      {tx.type === "TRANSFER" && <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1 rounded">Transf.</span>}
                      <p className="text-sm font-medium">{tx.description}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("es-DO")}
                      {tx.creditAccount && ` · ${tx.creditAccount.name}`}
                      {tx.destinationAccount && ` → ${tx.destinationAccount.name}`}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${tx.type === "TRANSFER" ? "text-blue-600" : tx.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "TRANSFER" ? "⇄" : tx.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
