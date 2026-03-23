# NextRep — Claude Code Guide

## Project Overview

**NextRep** — фитнес-приложение для трекинга тренировок. Работает как Telegram Web App.

**Stack:**
- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL + Drizzle ORM (Neon serverless)
- Vercel deployment + Vercel Blob (фото)
- OpenAI API (AI-коуч)
- Telegram Web App SDK (аутентификация)

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
components/           # React-компоненты (~33 файла)
lib/
  ai/                 # OpenAI интеграция, коуч, скоринг тренировок
  auth/               # Telegram auth, контекст, утилиты
  api/                # API-клиент, типы, валидация
  db/schema/          # Drizzle-схемы (users, workouts, exercises, etc.)
  workout/            # Стейт тренировки (useReducer)
  community/          # Лента, комментарии
  legends/            # Данные легендарных тренировок
  users/              # Операции с профилем
  profile/            # ProfileContext
  home/               # Утилиты главной страницы
  telegram/           # Telegram webhook
  utils/              # Общие утилиты
types/                # TypeScript типы
scripts/              # Скрипты сидирования и импорта
drizzle/              # Файлы миграций
```

### Key API Endpoints

| Endpoint | Description |
|---|---|
| `GET/POST /api/workouts` | Тренировки |
| `GET /api/workouts/[id]/comments` | Комментарии |
| `POST /api/workouts/[id]/like` | Лайки |
| `GET /api/exercises` | Упражнения |
| `GET/POST /api/presets` | Шаблоны тренировок |
| `GET /api/feed` | Лента (global/following) |
| `POST /api/users/[id]/follow` | Подписки |
| `GET /api/me` | Текущий пользователь |
| `POST /api/ai/chat` | AI-коуч чат |
| `GET /api/ai/workout-report` | AI-анализ тренировки |
| `POST /api/upload/workout-photo` | Загрузка фото |
| `GET /api/health` | Healthcheck |

### Data Models

- **Users** — профили, настройки, единицы (kg/lbs), уровень опыта
- **Exercises** — мышечные группы, оборудование, инструкции (WGER)
- **Workouts** — сессии с упражнениями и подходами
- **Presets** — сохранённые шаблоны тренировок
- **Community** — посты, комментарии, лайки, подписки
- **AI** — история чата, контекст коуча

### State Management

Провайдеры вложены в `app/providers.tsx`:
```
AuthProvider → AuthGate → ProfileProvider → OnboardingGate → WorkoutProvider
```

- **WorkoutProvider** — активная тренировка через `useReducer`
- **AuthProvider** — Telegram Web App auth
- **ProfileProvider** — данные профиля текущего пользователя

---

## Coding Conventions

- **Стилизация:** inline styles (без Tailwind), тёмная тема (`#0E1114` фон, `#F3F4F6` текст)
- **Компоненты:** кастомная библиотека (Button, Card, Modal и т.д.)
- **TypeScript:** строгий режим, path alias `@/*` → корень проекта
- **БД:** Drizzle ORM, каскадные удаления, индексы
- **Drag & Drop:** `@dnd-kit`
- **Фото:** `@vercel/blob`

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL строка подключения (Neon) |
| `OPENAI_API_KEY` | OpenAI API ключ |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob токен |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API токен |

---

## Notes

- Приложение работает внутри Telegram Web App — аутентификация через Telegram
- Mobile-first дизайн, скроллбары скрыты
- Deployment на Vercel (`build` команда сначала запускает миграции БД)
