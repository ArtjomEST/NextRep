# NextRep — Project Overview

## О проекте

**NextRep** — фитнес-приложение для трекинга тренировок, работающее как Telegram Web App. Приложение позволяет пользователям записывать тренировки, отслеживать прогресс, общаться в сообществе и получать рекомендации от AI-коуча.

---

## Стек технологий

| Категория | Технология | Версия |
|-----------|-----------|--------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **UI** | React | 19.2.3 |
| **Язык** | TypeScript | 5.x (strict mode) |
| **ORM** | Drizzle ORM | 0.45.1 |
| **БД** | PostgreSQL (Neon Serverless) | — |
| **Файлы** | Vercel Blob | 0.27.3 |
| **AI** | OpenAI API | — |
| **Auth** | Telegram Web App SDK | — |
| **Drag & Drop** | @dnd-kit | core 6.3.1, sortable 10.0.0 |
| **Визуализация** | react-body-highlighter | 2.0.5 |
| **Деплой** | Vercel | — |

---

## Основные фичи

### Тренировки
- Создание и запуск тренировок с произвольным набором упражнений
- Логирование подходов (вес, повторения, время)
- Таймер отдыха между подходами
- Drag & drop для изменения порядка упражнений
- Фото тренировки (загрузка в Vercel Blob)
- AI-отчёт с оценкой тренировки (0–100 баллов)

### Упражнения
- Библиотека упражнений (импорт из WGER API)
- Фильтрация по мышечным группам, оборудованию
- Поиск по названию
- Детальная информация: инструкции, мышцы, оборудование
- Визуализация мышц на модели тела (MuscleMap)

### Пресеты (шаблоны тренировок)
- Сохранение тренировки как шаблона
- AI-генерация пресетов через чат с коучем
- Копирование пресетов из сообщества
- CRUD операции с пресетами

### Сообщество
- Лента (feed) с тренировками и постами
- Фильтрация: все / подписки
- Лайки и комментарии
- Публикация постов с текстом, фото и пресетами
- Подписки на других пользователей
- Публичные профили

### AI-коуч
- Чат с AI-тренером (OpenAI)
- Контекст: профиль, история тренировок, цели
- Генерация персонализированных пресетов
- AI-анализ тренировки (scoring по 5 параметрам)
- Голосовой ввод (Web Speech API)

### Прогресс и аналитика
- График недельного объёма (bar chart)
- Прогресс по упражнениям (вес, объём, расчётный 1RM)
- Статистика: общий объём, количество тренировок, подходов
- Стрик-счётчик

### Онбординг
- Многошаговый визард: цели, опыт, сплит, параметры тела
- Сохранение прогресса в localStorage
- Анимированные переходы между шагами

---

## Структура проекта

```
NextRep/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Корневой layout (шрифты, meta)
│   ├── providers.tsx             # Вложенные провайдеры
│   ├── globals.css               # Глобальные CSS стили
│   ├── page.tsx                  # Главная страница
│   ├── api/                      # REST API маршруты
│   │   ├── ai/                   # AI-коуч (chat, workout-report)
│   │   ├── community/            # Посты, пресеты сообщества
│   │   ├── exercises/            # Упражнения (CRUD, поиск)
│   │   ├── feed/                 # Лента сообщества
│   │   ├── health/               # Healthcheck
│   │   ├── me/                   # Текущий пользователь
│   │   ├── presets/              # Шаблоны тренировок
│   │   ├── profile/              # Профиль (онбординг)
│   │   ├── progress/             # Прогресс по упражнениям
│   │   ├── telegram/             # Telegram webhook
│   │   ├── upload/               # Загрузка фото
│   │   ├── users/                # Пользователи, подписки
│   │   └── workouts/             # Тренировки (CRUD, лайки, комменты)
│   ├── workout/                  # Страницы тренировок
│   │   ├── new/                  # Создание тренировки
│   │   ├── active/               # Активная тренировка
│   │   └── summary/              # Итоги тренировки
│   ├── history/                  # История тренировок
│   ├── exercises/                # Браузер упражнений
│   ├── community/                # Лента сообщества
│   ├── profile/[id]/             # Публичные профили
│   ├── account/                  # Настройки аккаунта
│   │   └── presets/              # Управление пресетами
│   └── start/                    # Онбординг
│
├── components/                   # React-компоненты (~34 файла)
│   ├── ai/                       # AI-специфичные компоненты
│   │   └── AiPresetCards.tsx
│   ├── Button.tsx                # Кнопка (primary/secondary/ghost)
│   ├── Card.tsx                  # Карточка-контейнер
│   ├── Modal.tsx                 # Модальное окно
│   ├── Skeleton.tsx              # Скелетон загрузки
│   ├── TabBar.tsx                # Нижняя навигация
│   ├── ...                       # И ещё ~28 компонентов
│
├── lib/                          # Библиотеки и утилиты
│   ├── ai/                       # OpenAI интеграция
│   ├── auth/                     # Telegram auth
│   ├── api/                      # API-клиент + типы
│   │   ├── client.ts             # Все fetch-функции (~50+)
│   │   └── types.ts              # TypeScript типы API
│   ├── db/                       # База данных
│   │   └── schema/               # Drizzle-схемы
│   │       ├── users.ts          # Пользователи + профили
│   │       ├── exercises.ts      # Упражнения
│   │       ├── workouts.ts       # Тренировки, подходы
│   │       ├── social.ts         # Подписки, лайки, комменты
│   │       ├── community.ts      # Посты сообщества
│   │       ├── presets.ts        # Шаблоны тренировок
│   │       ├── ai.ts             # AI сообщения, отчёты
│   │       └── index.ts          # Экспорт всех схем
│   ├── theme.ts                  # Дизайн-токены (цвета, spacing)
│   ├── ui-styles.ts              # Расширенные UI стили
│   ├── workout/                  # useReducer для тренировки
│   ├── community/                # Запросы ленты
│   ├── legends/                  # Легендарные тренировки
│   ├── users/                    # Операции с профилем
│   ├── profile/                  # ProfileContext
│   ├── home/                     # Утилиты главной
│   ├── telegram/                 # Telegram webhook
│   └── utils/                    # Общие утилиты
│
├── types/                        # Глобальные TypeScript типы
├── scripts/                      # Скрипты (seed, import)
├── drizzle/                      # SQL миграции
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
└── CLAUDE.md                     # Гайд для Claude Code
```

---

## Как запустить локально

### Предварительные требования
- Node.js 18+
- npm (не pnpm/yarn)
- PostgreSQL (Neon аккаунт) или локальный PostgreSQL

### 1. Клонировать репозиторий

```bash
git clone <repo-url>
cd NextRep
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Настроить переменные окружения

Создать файл `.env.local` в корне проекта:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
OPENAI_API_KEY=sk-...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
```

### 4. Применить миграции БД

```bash
npm run db:migrate
```

### 5. Сидировать упражнения (опционально)

```bash
npm run seed:wger
```

### 6. Создать dev-пользователя (опционально)

```bash
npm run seed:dev-user
```

### 7. Запустить dev-сервер

```bash
npm run dev
```

Приложение доступно по адресу `http://localhost:3000`.

> **Совет для Windows:** если `npm run dev` завис — удалите папку `.next` и перезапустите.

> **Альтернатива:** если Turbopack вызывает проблемы, используйте `npm run dev:stable` (webpack).

---

## Деплой

### Vercel (рекомендуемый)

1. Подключите репозиторий к Vercel
2. Настройте переменные окружения в Vercel Dashboard:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `BLOB_READ_WRITE_TOKEN`
   - `TELEGRAM_BOT_TOKEN`
3. Build-команда (`npm run build`) автоматически:
   - Применяет миграции БД (`drizzle-kit migrate`)
   - Собирает Next.js приложение
4. Каждый push в `main` запускает автодеплой

### Telegram Bot настройка

1. Создать бота через @BotFather
2. Настроить Web App URL на URL Vercel деплоя
3. Настроить webhook: `POST /api/telegram/webhook`

---

## Полезные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер с Turbopack |
| `npm run dev:stable` | Dev-сервер с webpack |
| `npm run build` | Миграции БД + сборка |
| `npm run start` | Продакшн-сервер |
| `npm run db:generate` | Сгенерировать миграцию |
| `npm run db:migrate` | Применить миграции |
| `npm run db:studio` | Открыть Drizzle Studio |
| `npm run seed:wger` | Импорт упражнений |
| `npm run seed:dev-user` | Создать dev-пользователя |
