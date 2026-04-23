import { router } from "@/server/trpc"
import { creditAccountRouter } from "./credit-accounts"
import { creditCardRouter } from "./credit-cards"
import { subscriptionRouter } from "./subscriptions"
import { transactionRouter } from "./transactions"
import { userRouter } from "./users"

export const appRouter = router({
  user: userRouter,
  creditAccount: creditAccountRouter,
  creditCard: creditCardRouter,
  subscription: subscriptionRouter,
  transaction: transactionRouter,
})

export type AppRouter = typeof appRouter
