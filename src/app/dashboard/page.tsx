"use client"

import { api } from "@/lib/trpc-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Repeat, ArrowLeftRight, Wallet } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export default function DashboardPage() {
  const { data: accounts } = api.creditAccount.list.useQuery()
  const { data: subscriptions } = api.subscription.list.useQuery()
  const { data: summary } = api.transaction.getSummary.useQuery({ months: 1 })

  const totalCreditLimit = accounts?.reduce((sum, a) => sum + Number(a.creditLimit), 0) ?? 0
  const activeSubs = subscriptions?.filter((s) => s.status === "ACTIVE") ?? []
  const monthlySubCost = activeSubs
    .filter((s) => s.billingCycle === "MONTHLY")
    .reduce((sum, s) => sum + Number(s.amount), 0)
  const upcomingPayments = activeSubs.filter(
    (s) => new Date(s.nextBillingDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tus finanzas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Límite total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCreditLimit)}</div>
            <p className="text-xs text-muted-foreground">
              {accounts?.length ?? 0} cuenta{(accounts?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones activas</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(monthlySubCost)}/mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próximos pagos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingPayments.length}</div>
            <p className="text-xs text-muted-foreground">en los próximos 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos del mes</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalExpenses ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos: {formatCurrency(summary?.totalIncome ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximos vencimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay pagos próximos</p>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sub.nextBillingDate).toLocaleDateString("es-DO")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(Number(sub.amount), sub.currency)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tus cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            {!accounts || accounts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">Aún no tienes cuentas registradas</p>
                <Link
                  href="/dashboard/accounts"
                  className="text-sm text-primary hover:underline"
                >
                  Agregar una cuenta
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <Link
                    key={acc.id}
                    href={`/dashboard/accounts/${acc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: acc.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{acc.name}</p>
                        <p className="text-xs text-muted-foreground">{acc.issuer}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(Number(acc.creditLimit))}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
