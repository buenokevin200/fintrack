import { router } from "@/server/trpc"
import { creditAccountRouter } from "./credit-accounts"
import { creditCardRouter } from "./credit-cards"
import { subscriptionRouter } from "./subscriptions"
import { transactionRouter } from "./transactions"
import { userRouter } from "./users"
import { loanRouter } from "./loans"
import { budgetRouter } from "./budgets"

export const appRouter = router({
  user: userRouter,
  creditAccount: creditAccountRouter,
  creditCard: creditCardRouter,
  subscription: subscriptionRouter,
  transaction: transactionRouter,
  loan: loanRouter,
  budget: budgetRouter,
})

export type AppRouter = typeof appRouter
