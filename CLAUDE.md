# NextRep — Claude Code Guide

## Project Overview

**NextRep** — фитнес-приложение для трекинга тренировок. Работает как Telegram Web App.

**Stack:**
- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL + Drizzle ORM (Neon serverless)
- Vercel deployment + Vercel Blob (фото)
- OpenAI API (AI-коуч)
- Telegram Web App SDK (аутентификация + Telegram Stars billing)

---

## Commands

```bash
npm run dev           # Dev с Turbopack
npm run dev:stable    # Dev с webpack (если Turbopack глючит)
npm run build         # Миграции БД + сборка
npm run db:generate   # Сгенерировать миграцию
npm run db:migrate    # Применить миграции
npm run db:studio     # Открыть Drizzle Studio
npm run seed:wger     # Сидировать упражнения из WGER API
npm run seed:dev-user # Создать dev-пользователя
```

> **Windows:** если `npm run dev` завис — удали `.next` папку и перезапусти.
> Только `npm` — не использовать `pnpm` или `yarn` (засоряют lockfile).

---

## Architecture

### Directory Structure

```
app/                  # Next.js App Router
  api/                # API маршруты (REST)
  workout/            # Страницы тренировок (new, active, summary)
  history/            # История тренировок
  exercises/          # Браузер упражнений
  community/          # Лента сообщества
  profile/[id]/       # Публичные профили
  account/            # Настройки аккаунта
  start/              # Онбординг
  layout.tsx          # Root layout (Script, TabBar, AIChatWidget, ProGateTooltip, ProBannerModal)
  layout-shell.tsx    # LayoutShell — maxWidth 480px, padding 0 16px 24px (workout) / 0 16px 80px (other)
  providers.tsx       # Провайдеры (AuthProvider → AuthGate → ProfileProvider → GlobalSheets → OnboardingGate → WorkoutProvider)
components/           # React-компоненты (47 файлов)
lib/
  ai/                 # OpenAI интеграция, коуч, скоринг тренировок
  auth/               # Telegram auth, контекст, утилиты
  api/                # API-клиент (client.ts), типы, валидация
  db/schema/          # Drizzle-схемы (users, workouts, exercises, presets, community, social, ai, billing)
  workout/            # Стейт тренировки (useReducer)
  community/          # Лента, комментарии
  legends/            # Данные легендарных тренировок
  users/              # Операции с профилем
  profile/            # ProfileContext (useProfile hook)
  home/               # Утилиты главной страницы
  telegram/           # Telegram webhook
  utils/              # Общие утилиты (compressImage, muscleAggregator, etc.)
  theme.ts            # Дизайн-токены (colors, spacing, radius)
types/                # TypeScript типы
scripts/              # Скрипты сидирования и импорта
drizzle/              # Файлы миграций
```

### Key API Endpoints

| Endpoint | Description |
|---|---|
| `GET/POST /api/workouts` | Тренировки |
| `GET/DELETE /api/workouts/[id]` | Детали / удаление тренировки |
| `GET /api/workouts/[id]/comments` | Комментарии к тренировке |
| `POST /api/workouts/[id]/like` | Лайки тренировки |
| `GET /api/workouts/[id]/export` | Экспорт тренировки |
| `POST /api/workouts/[id]/send-pdf` | Отправка PDF тренировки |
| `GET/POST /api/workouts/[id]/exercises` | Упражнения тренировки |
| `PATCH /api/workouts/[id]/exercises/[weId]` | Обновление упражнения |
| `GET /api/workouts/last-sets` | Последние подходы по упражнениям |
| `GET /api/workouts/weekly-volume` | Недельный объём |
| `GET /api/workouts/stats` | Статистика тренировок |
| `GET /api/exercises` | Упражнения |
| `GET/POST /api/presets` | Шаблоны тренировок |
| `POST /api/presets/[id]/save` | Сохранить копию шаблона |
| `GET /api/feed` | Лента (global/following) |
| `POST /api/users/[id]/follow` | Подписки |
| `GET /api/me` | Текущий пользователь |
| `POST /api/me/link` | Привязка аккаунта |
| `GET/PATCH /api/me/settings` | Настройки пользователя |
| `GET/PATCH /api/profile` | Профиль |
| `GET /api/progress/exercises` | Прогресс по упражнениям |
| `GET /api/progress/exercises/[id]` | Детали прогресса упражнения |
| `GET/POST /api/community/posts` | Посты сообщества |
| `GET/PATCH/DELETE /api/community/posts/[id]` | Управление постом |
| `POST /api/community/posts/[id]/comments` | Комментарии к посту |
| `POST /api/community/posts/[id]/like` | Лайк поста |
| `GET /api/community/presets/[presetId]` | Пресет из сообщества |
| `POST /api/ai/chat` | AI-коуч чат |
| `GET/POST /api/ai/workout-report` | AI-анализ тренировки |
| `POST /api/billing/stars` | Telegram Stars оплата |
| `POST /api/promo/redeem` | Промокод |
| `POST /api/trial/activate` | Активация пробного периода |
| `POST /api/telegram/webhook` | Telegram webhook |
| `POST /api/upload/workout-photo` | Загрузка фото |
| `GET /api/health` | Healthcheck |

### Data Models

- **Users** — профили (username, avatar, isLinked), настройки (units kg/lbs, experienceLevel, goal, splitPreference)
- **UserProfiles** — фитнес-данные + PRO-статус: `isPro`, `proExpiresAt`, `proSource`, `trialEndsAt`, `trialUsed`
- **Exercises** — мышечные группы, оборудование, инструкции (WGER), `measurementType` (strength/cardio)
- **Workouts** — сессии с упражнениями и подходами; `cardioData` JSON в `workoutSets`
- **Presets** — сохранённые шаблоны тренировок, `savedFromPresetId` для копий
- **Community** — посты (`communityPosts`), лайки (`postLikes`), комментарии (`postComments`)
- **Social** — подписки (`follows`), лайки тренировок (`workoutLikes`), комментарии (`workoutComments`)
- **AI** — история чата (`aiMessages`), отчёты о тренировках (`aiWorkoutReports` со scores: volume/intensity/consistency/duration/prBonus)
- **Billing** — промокоды (`promoRedemptions`), Telegram Stars платежи (`starPayments`)

### State Management

Провайдеры вложены в `app/providers.tsx`:
```
AuthProvider → AuthGate → ProfileProvider → GlobalSheets → OnboardingGate → WorkoutProvider
```

- **WorkoutProvider** — активная тренировка через `useReducer`; включая `cardioTimers` per exercise
- **AuthProvider** — Telegram Web App auth
- **ProfileProvider** — данные профиля; экспортирует `useProfile()` хук
- **GlobalSheets** — рендерит `<ProTrialOnboardingSheet>` при `showTrialOnboarding`

### ProfileContext (`useProfile()`)

| Field | Type | Description |
|---|---|---|
| `profile` | `UserProfile \| null` | Полный профиль |
| `isPro` | `boolean` | Активна ли PRO-подписка |
| `proExpiresAt` | `string \| null` | Дата окончания PRO |
| `trialEndsAt` | `string \| null` | Дата окончания триала |
| `trialUsed` | `boolean` | Использован ли бесплатный триал |
| `hasCompletedOnboarding` | `boolean` | Завершён ли онбординг |
| `refreshProfile()` | `() => Promise<void>` | Обновить профиль |
| `updateProfile(data)` | `(ProfileUpdatePayload) => Promise<void>` | Обновить данные профиля |
| `triggerTrialOnboarding(endsAt)` | `(string) => void` | Показать модал триала |
| `dismissTrialOnboarding()` | `() => void` | Закрыть модал триала |

---

## PRO Subscription System

Платная подписка через Telegram Stars. Ключевые компоненты:

| Component | Description |
|---|---|
| `ProSubscriptionCard` | Основная карточка управления PRO (статус, редемпшн, биллинг) |
| `ProBannerModal` | Промо-баннер (показывается раз в 15 запусков) |
| `ProTrialOnboardingSheet` | Модал при активации 7-дневного триала |
| `ProLockBadge` | Бейдж на заблокированных PRO-фичах |
| `ProGateTooltip` | Тултип для PRO-locked элементов |
| `AIReportWithGate` | Оборачивает `AIWorkoutReportCard` — блюрит и показывает оверлей для non-PRO |
| `MuscleMapWithGate` | Оборачивает `MuscleMap` — PRO gate для мышечной карты |

**PRO gate pattern:** компоненты-`*WithGate` принимают те же пропсы, что и оборачиваемый компонент. Для non-PRO рендерят блюр + оверлей с кнопкой триала/апгрейда.

**AI Workout Report flow:**
1. После сохранения тренировки (`savedWorkoutId` установлен)
2. Только для `isPro === true`
3. `fetchAiWorkoutReportApi(workoutId)` → если нет, `postAiWorkoutReportApi(workoutId)`
4. Результат рендерится в `AIReportWithGate` на post-save экране

---

## Coding Conventions

- **Стилизация:** inline styles (без Tailwind), тёмная тема — все токены из `lib/theme.ts`
- **Горизонтальный padding:** 16px предоставляется `LayoutShell` — не дублировать в компонентах
- **Компоненты:** кастомная библиотека (Button, Card, Modal, StatCard, Skeleton и т.д.)
- **TypeScript:** строгий режим, path alias `@/*` → корень проекта
- **БД:** Drizzle ORM, каскадные удаления, индексы
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Фото:** `@vercel/blob` + `compressImage` утилита перед загрузкой
- **PDF:** `pdfkit` для экспорта тренировок
- **Мышечная карта:** `react-body-highlighter`

### Theme Tokens (`lib/theme.ts`)

**Colors:**
```
bgPrimary: '#0E1114'    surface: '#161B20'     card: '#1C2228'
border: '#262E36'       primary: '#1F8A5B'     primaryHover: '#25A46B'
textPrimary: '#F3F4F6'  textSecondary: '#9CA3AF'  textMuted: '#6B7280'
success: '#22C55E'      warning: '#F59E0B'     error: '#EF4444'  info: '#3B82F6'
```

**Spacing:** `xs:4px  sm:8px  md:16px  lg:24px  xl:32px`

**Radius:** `sm:8px  md:12px  lg:16px`

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL строка подключения (Neon) |
| `OPENAI_API_KEY` | OpenAI API ключ |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob токен |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API токен |
| `CRON_SECRET` | Secret for cron endpoints (`/api/cron/*`); verified via `x-cron-secret` header |
| `DEV_SECRET` | Secret for dev test endpoints (`/api/dev/*`); verified via `x-dev-secret` header; optional, only needed if testing dev endpoints |

---

## Notes

- Приложение работает внутри Telegram Web App — аутентификация через Telegram
- Mobile-first дизайн, скроллбары скрыты, max-width 480px
- `LayoutShell` даёт `padding: 0 16px` горизонтально и `80px` снизу (для tab bar) на всех страницах кроме `/workout/*` (там `24px` снизу)
- Deployment на Vercel (`build` команда сначала запускает миграции БД)
- Cardio упражнения используют отдельный `cardioTimers` стейт в WorkoutProvider, сохраняются как один set с `cardioData` JSON

---

## PROJECT_MAP.md

`PROJECT_MAP.md` в корне проекта — единственный источник правды о структуре проекта.

**After every code change that adds, removes, or renames a file OR adds/removes an API endpoint OR changes a DB schema — update `PROJECT_MAP.md` to reflect the change.**
