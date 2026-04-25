# FinTrack - Control Financiero

Aplicación web de finanzas personales para gestionar cuentas de crédito, préstamos, suscripciones, presupuestos y transacciones.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript
- **Base de datos:** PostgreSQL + Prisma ORM
- **API:** tRPC
- **Autenticación:** NextAuth v5 (Credentials)
- **Estilos:** Tailwind CSS v4
- **Gráficos:** Recharts
- **Despliegue:** Docker + Coolify

## Funcionalidades

- Dashboard con resumen financiero y gráfico de presupuestos
- Cuentas de crédito con límites en DOP y USD
- Tarjetas de crédito asociadas a cuentas
- Préstamos con cuotas, fechas de pago e intereses
- Suscripciones con recordatorios
- Presupuestos por categoría y período
- Transacciones de ingreso/gasto
- Configuración de perfil
- Notificaciones vía Telegram (recordatorios de pago, alertas de presupuesto, resúmenes)
- Modo oscuro

## Variables de entorno

Copia `.env.example` a `.env` y configura:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `AUTH_SECRET` | Secreto para NextAuth (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | `true` para entornos con proxy (Coolify) |
| `NEXTAUTH_URL` | URL pública de la aplicación |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram para notificaciones |

## Desarrollo local

```bash
npm install
npm run db:push
npm run dev
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run db:push` | Sincronizar schema con la BD |
| `npm run db:migrate` | Crear/ejecutar migraciones |
| `npm run db:generate` | Generar cliente de Prisma |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run lint` | Ejecutar ESLint |

## Despliegue en Coolify

La app está dockerizada con build multi-stage. Para desplegar en Coolify:

1. Crear un "Application" apuntando al repositorio
2. Build method: **Dockerfile**
3. Puerto: `3000`
4. Health check: `GET /api/health`
5. Configurar variables de entorno (ver arriba)
6. Asegurar que la app y PostgreSQL estén en la misma red Docker

### Notificaciones Telegram

Para habilitar notificaciones:
1. Crear un bot con [@BotFather](https://t.me/BotFather)
2. Agregar `TELEGRAM_BOT_TOKEN` en las variables de entorno
3. Enviar un mensaje al bot y obtener el chat ID vía `https://api.telegram.org/bot[TOKEN]/getUpdates`
4. Vincular el chat ID en `/dashboard/settings`

Las notificaciones se envían automáticamente al llamar `GET /api/cron` (configurar un cron job externo).

### Notas de migración

El schema tiene un cambio respecto a versiones anteriores:
- `creditLimit` → `limitDOP` + `limitUSD`
- `dueDay` → `paymentDays` (días para pagar desde el cierre)
- Lo que era "Tarjetas" ahora es "Cuentas"

Si actualizas desde una versión anterior, usa `prisma db push` para sincronizar el schema.
