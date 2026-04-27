"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Repeat, PiggyBank, ArrowLeftRight } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"]

export default function DashboardPage() {
  const { data: accounts } = api.creditAccount.list.useQuery()
  const { data: subscriptions } = api.subscription.list.useQuery()
  const { data: summary } = api.transaction.getSummary.useQuery({ months: 1 })
  const { data: budgetSummary } = api.budget.getSummary.useQuery({ months: 1 })
  const { data: dailyExpenses } = api.transaction.getDailyExpenses.useQuery({ days: 7 })
  const { data: monthlyExpenses } = api.transaction.getMonthlyExpenses.useQuery({ months: 6 })
  const [chartMode, setChartMode] = useState<"daily" | "monthly">("daily")

  const totalDOP = accounts?.reduce((sum, a) => sum + Number(a.limitDOP), 0) ?? 0
  const totalUSD = accounts?.reduce((sum, a) => sum + Number(a.limitUSD), 0) ?? 0
  const activeSubs = subscriptions?.filter((s) => s.status === "ACTIVE") ?? []
  const monthlySubCost = activeSubs
    .filter((s) => s.billingCycle === "MONTHLY")
    .reduce((sum, s) => sum + Number(s.amount), 0)
  const upcomingPayments = activeSubs.filter(
    (s) => new Date(s.nextBillingDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  )

  const pieData = budgetSummary?.byCategory
    ? Object.entries(budgetSummary.byCategory)
        .map(([name, data]) => ({
          name,
          value: data.budget,
          spent: data.spent,
        }))
        .sort((a, b) => b.value - a.value)
    : []

  const totalBudget = budgetSummary?.totalBudget ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tus finanzas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Límite total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDOP)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalUSD, "USD")} · {accounts?.length ?? 0} cuenta{(accounts?.length ?? 0) !== 1 ? "s" : ""}
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
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingPayments.length}</div>
            <p className="text-xs text-muted-foreground">en los próximos 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos del mes</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalExpenses ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos: {formatCurrency(summary?.totalIncome ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              {budgetSummary?.budgets?.length ?? 0} presupuesto{(budgetSummary?.budgets?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
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
            <CardTitle className="text-lg">Presupuesto por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">No hay presupuestos definidos</p>
                <Link href="/dashboard/budgets" className="text-sm text-primary hover:underline">
                  Crear presupuesto
                </Link>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value)) as unknown as React.ReactNode} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Consumo diario</CardTitle>
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setChartMode("daily")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${chartMode === "daily" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                Por día
              </button>
              <button
                onClick={() => setChartMode("monthly")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${chartMode === "monthly" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                Por mes
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartMode === "daily" && (
            dailyExpenses && dailyExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyExpenses.map((d) => ({ ...d, label: new Date(d.date + "T00:00:00").toLocaleDateString("es-DO", { weekday: "short", day: "numeric" }) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value)) as unknown as React.ReactNode} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No hay gastos registrados en los últimos días</p>
              </div>
            )
          )}
          {chartMode === "monthly" && (
            monthlyExpenses && monthlyExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyExpenses.map((d) => ({ ...d, label: d.month }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value)) as unknown as React.ReactNode} />
                  <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No hay gastos registrados en los últimos meses</p>
              </div>
            )
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
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(Number(acc.limitDOP))}</p>
                    {Number(acc.limitUSD) > 0 && (
                      <p className="text-xs text-muted-foreground">{formatCurrency(Number(acc.limitUSD), "USD")}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
