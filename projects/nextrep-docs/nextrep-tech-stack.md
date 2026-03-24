# NextRep — Technical Documentation

---

## 1. Frontend

### Framework

| Технология | Версия | Описание |
|-----------|--------|----------|
| **Next.js** | 16.1.6 | React-фреймворк с App Router |
| **React** | 19.2.3 | UI-библиотека |
| **React DOM** | 19.2.3 | DOM-рендеринг |
| **TypeScript** | 5.x | Strict mode, bundler module resolution |

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "noEmit": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

Path alias `@/*` указывает на корень проекта.

---

## 2. Стилизация

### Подход: Inline Styles

NextRep **не использует Tailwind CSS**. Все стили — inline через `React.CSSProperties` объекты.

### Дизайн-токены

**Файл:** `lib/theme.ts`

```typescript
export const theme = {
  colors: {
    bgPrimary: '#0E1114',
    surface: '#161B20',
    card: '#1C2228',
    border: '#262E36',
    primary: '#1F8A5B',
    primaryHover: '#25A46B',
    primaryPressed: '#176B47',
    textPrimary: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 16 },
};
```

**Файл:** `lib/ui-styles.ts` — расширенные стили (градиенты, тени, hero-секция).

### Шрифт

Системный стек: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

### Глобальный CSS (`app/globals.css`)

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
html {
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
::-webkit-scrollbar { display: none; }
* { scrollbar-width: none; }
```

---

## 3. Database

### PostgreSQL на Neon Serverless

| Компонент | Описание |
|-----------|----------|
| **Provider** | Neon (serverless PostgreSQL) |
| **Client** | `@neondatabase/serverless` v1.0.2 |
| **ORM** | Drizzle ORM v0.45.1 |
| **Migrations** | Drizzle Kit v0.31.9 |

### Схема таблиц

#### users

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | Auto-generated |
| `telegramUserId` | VARCHAR(64) | Unique, Telegram ID |
| `username` | VARCHAR(128) | Telegram username |
| `firstName` | VARCHAR(128) | Имя |
| `lastName` | VARCHAR(128) | Фамилия |
| `avatarUrl` | TEXT | URL аватара (nullable) |
| `isLinked` | BOOLEAN | Привязан ли аккаунт |
| `createdAt` | TIMESTAMPTZ | Дата создания |
| `updatedAt` | TIMESTAMPTZ | Дата обновления |

#### user_profiles (1:1 с users)

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK→users) | Unique |
| `heightCm` | INTEGER | Рост в см |
| `weightKg` | NUMERIC(5,1) | Вес в кг |
| `age` | INTEGER | Возраст |
| `units` | ENUM('kg','lb') | Единицы измерения |
| `experienceLevel` | ENUM | beginner/intermediate/advanced |
| `goal` | ENUM | muscle_growth/strength/endurance/weight_loss/general_fitness |
| `splitPreference` | VARCHAR(32) | Предпочитаемый сплит |
| `trainingDaysPerWeek` | INTEGER | Дней тренировок в неделю |
| `bestLifts` | JSONB | `{ benchPress?, squat?, deadlift? }` |
| `injuries` | JSONB | `string[]` |
| `onboardingCompleted` | BOOLEAN | Пройден ли онбординг |
| `isPro` | BOOLEAN | Pro-подписка |

#### exercises

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `source` | ENUM('wger','custom') | Источник |
| `sourceId` | INTEGER | ID в WGER |
| `name` | VARCHAR(256) | Название |
| `description` | TEXT | Описание |
| `howTo` | TEXT | Инструкция |
| `primaryMuscles` | JSONB | `string[]` — основные мышцы |
| `secondaryMuscles` | JSONB | `string[]` — вторичные мышцы |
| `equipment` | JSONB | `string[]` — оборудование |
| `category` | VARCHAR(64) | Категория |
| `measurementType` | ENUM | weight_reps/reps_only/time |
| `imageUrl` | TEXT | URL изображения |
| `images` | JSONB | `string[]` — доп. изображения |

**Unique Index:** `(source, sourceId)`

#### workouts

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK→users, CASCADE) | Владелец |
| `name` | VARCHAR(256) | Название |
| `startedAt` | TIMESTAMPTZ | Начало |
| `endedAt` | TIMESTAMPTZ | Конец |
| `durationSec` | INTEGER | Длительность (сек) |
| `totalVolume` | NUMERIC(10,1) | Общий объём (weight × reps) |
| `totalSets` | INTEGER | Кол-во подходов |
| `notes` | TEXT | Заметки |
| `isPublic` | BOOLEAN | Видна в ленте |
| `photoUrl` | TEXT | URL фото |

#### workout_exercises

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `workoutId` | UUID (FK→workouts, CASCADE) | |
| `exerciseId` | UUID (FK→exercises, RESTRICT) | |
| `order` | INTEGER | Порядок |
| `status` | ENUM('pending','completed') | Статус |

**Unique Index:** `(workoutId, order)`

#### workout_sets

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `workoutExerciseId` | UUID (FK→workout_exercises, CASCADE) | |
| `setIndex` | INTEGER | Порядковый номер |
| `weight` | NUMERIC(7,2) | Вес |
| `reps` | INTEGER | Повторения |
| `seconds` | INTEGER | Время (для time-based) |
| `completed` | BOOLEAN | Выполнен |

#### follows

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `followerId` | UUID (FK→users, CASCADE) | Кто подписан |
| `followingId` | UUID (FK→users, CASCADE) | На кого |

**Unique Index:** `(followerId, followingId)`

#### workout_likes / post_likes

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK→users, CASCADE) | |
| `workoutId`/`postId` | UUID (FK, CASCADE) | |

**Unique Index:** `(userId, workoutId/postId)`

#### workout_comments / post_comments

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK→users, CASCADE) | |
| `workoutId`/`postId` | UUID (FK, CASCADE) | |
| `text` | VARCHAR(280) | Текст (макс. 280 символов) |

#### community_posts

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK→users, CASCADE) | |
| `text` | TEXT | Текст поста |
| `photoUrl` | TEXT | URL фото |
| `presetId` | UUID (FK→workout_presets, SET NULL) | Прикреплённый пресет |

#### workout_presets

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK→users, CASCADE) | Владелец |
| `name` | VARCHAR(256) | Название |
| `exerciseIds` | JSONB | `string[]` — ID упражнений |
| `savedFromPresetId` | UUID (FK→self, SET NULL) | Скопирован из |

#### ai_messages

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK→users, CASCADE) | |
| `role` | VARCHAR(16) | 'user' / 'assistant' |
| `content` | TEXT | Текст сообщения |

#### ai_workout_reports

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID (PK) | |
| `userId` | UUID (FK→users, CASCADE) | |
| `workoutId` | UUID (FK→workouts, CASCADE) | |
| `report` | TEXT | Markdown отчёт |
| `score` | INTEGER | Общая оценка 0-100 |
| `volumeScore` | INTEGER | Оценка объёма |
| `intensityScore` | INTEGER | Оценка интенсивности |
| `consistencyScore` | INTEGER | Оценка последовательности |
| `durationScore` | INTEGER | Оценка длительности |
| `prBonus` | INTEGER | Бонус за рекорд |

**Unique Index:** `(userId, workoutId)`

---

## 4. Authentication

### Telegram Web App

Аутентификация полностью через Telegram Mini App:

1. Telegram Web App SDK передаёт `initData`
2. Клиент отправляет `initData` в заголовке `x-telegram-init-data`
3. Сервер валидирует подпись через `TELEGRAM_BOT_TOKEN`
4. Создаёт/находит пользователя по `telegramUserId`

**Dev mode:** Автоматический bypass аутентификации при `NODE_ENV=development`.

Нет паролей, email, OAuth — только Telegram.

---

## 5. API Endpoints

### Аутентификация

Все endpoints (кроме `/api/health`) требуют заголовок:

```
x-telegram-init-data: <telegram_web_app_init_data>
```

### Формат ответов

**Успех:**
```json
{
  "data": { ... },
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

**Ошибка:**
```json
{
  "error": "Not found",
  "message": "Workout not found"
}
```

### Полный список endpoints

#### Exercises

```
GET  /api/exercises
     ?q=bench&category=chest&limit=50&offset=0&names=name1,name2&myExercises=true
     → { data: Exercise[], total, limit, offset }

GET  /api/exercises/:id
     → { data: ExerciseDetail }
```

#### Workouts

```
GET    /api/workouts?limit=20&offset=0
       → { data: WorkoutListItem[], total, limit, offset }

POST   /api/workouts
       Body: SaveWorkoutRequest
       → { data: SaveWorkoutResponse } (201)

GET    /api/workouts/:id
       → { data: WorkoutDetail }

DELETE /api/workouts/:id
       → 200 OK

PATCH  /api/workouts/:id
       Body: { isPublic?: boolean, photoUrl?: string }
       → { data: { photoUrl, isPublic } }

GET    /api/workouts/stats
       → { data: { total, totalVolume, totalSets } }

GET    /api/workouts/last-sets?exerciseIds=id1,id2
       → { data: Record<string, { sets: SetData[], lastWorkoutDate: string }> }

GET    /api/workouts/weekly-volume
       → Volume chart data

GET    /api/workouts/:id/comments?limit=20&offset=0
       → { data: WorkoutCommentRow[], total }

POST   /api/workouts/:id/comments
       Body: { text: string }
       → { data: WorkoutCommentRow }

POST   /api/workouts/:id/like
       → { liked: boolean, likeCount: number }
```

#### User

```
GET    /api/me
       → { data: { id, username, firstName, lastName, avatarUrl, isLinked, telegramUserId } }

POST   /api/me/link
       → 200 OK

GET    /api/me/settings
       → { data: UserSettings }

PATCH  /api/me/settings
       Body: Partial<UserSettings>
       → { data: UserSettings }
```

#### Profile

```
GET    /api/profile
       → { data: UserProfile | null }

POST   /api/profile
       Body: OnboardingData
       → { data: UserProfile }

PUT    /api/profile
       Body: Partial<ProfileUpdate>
       → { data: UserProfile }
```

#### Social

```
GET    /api/users/search?q=john
       → { data: UserSearchHit[] }

GET    /api/users/:id/profile
       → { data: PublicProfileData }

POST   /api/users/:id/follow
       → 200 OK

DELETE /api/users/:id/follow
       → 200 OK
```

#### Presets

```
GET    /api/presets
       → { data: Preset[] }

POST   /api/presets
       Body: { name: string, exerciseIds: string[] }
       → { data: Preset }

GET    /api/presets/:id
       → { data: Preset }

PUT    /api/presets/:id
       Body: { name: string, exerciseIds: string[] }
       → { data: Preset }

PATCH  /api/presets/:id
       Body: { addExerciseNames: string[] }
       → { data: Preset }

DELETE /api/presets/:id
       → 200 OK

POST   /api/presets/:id/save
       → { data: { id: string } }
```

#### Community

```
POST   /api/community/posts
       Body: { text?: string, photoUrl?: string, presetId?: string }
       → { data: { id, createdAt } }

GET    /api/community/posts/:id
       → Post details

PATCH  /api/community/posts/:id
       Body: { text?, photoUrl?, presetId? }
       → Updated post

DELETE /api/community/posts/:id
       → 200 OK

GET    /api/community/posts/:id/comments?limit=20&offset=0
       → { data: WorkoutCommentRow[], total }

POST   /api/community/posts/:id/comments
       Body: { text: string }
       → { data: WorkoutCommentRow }

POST   /api/community/posts/:id/like
       → { liked: boolean, likeCount: number }

GET    /api/community/presets/:presetId
       → { data: { exercises: FeedPresetExercisePreview[] } }
```

#### Feed

```
GET    /api/feed?limit=20&offset=0&filter=all&type=all
       filter: 'all' | 'following'
       type: 'all' | 'workout' | 'post'
       → { data: FeedItem[], total, limit, offset }
```

#### AI

```
POST   /api/ai/chat
       Body: { message: string }
       → { reply: string, preset?: AiGeneratedPreset, suggestedExercises?: string[] }

GET    /api/ai/chat/history
       → { messages: AiChatMessageRow[] }

GET    /api/ai/workout-report?workoutId=xxx
       → { data: { report, scores } | null }

POST   /api/ai/workout-report
       Body: { workoutId: string }
       → { report: string, scores: AiWorkoutReportScores }
```

#### Upload

```
POST   /api/upload/workout-photo
       Content-Type: multipart/form-data (field: "file")
       → { url: string }
```

#### Progress

```
GET    /api/progress/exercises
       → { data: ProgressExercise[] }

GET    /api/progress/exercises/:id?days=30
       → { data: ProgressExerciseDetail }
```

#### System

```
GET    /api/health
       → { status: 'ok' }

POST   /api/telegram/webhook
       (Telegram Bot updates, verified by signature)
```

---

## 6. Deployment

### Платформа: Vercel

- **Auto-deploy:** Каждый push в `main`
- **Build command:** `npm run build` (= `drizzle-kit migrate && next build`)
- **Framework:** Next.js (auto-detected)
- **Runtime:** Node.js (Serverless Functions)

### Environment Variables (Vercel Dashboard)

| Variable | Описание |
|----------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API ключ |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |

### Next.js Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};
```

Turbopack включен для dev. Минимальная конфигурация — нет rewrites/redirects.

---

## 7. Все npm пакеты

### Production Dependencies

| Пакет | Версия | Описание |
|-------|--------|----------|
| `@dnd-kit/core` | 6.3.1 | Ядро drag & drop |
| `@dnd-kit/sortable` | 10.0.0 | Sortable пресет для списков |
| `@dnd-kit/utilities` | 3.2.2 | Утилиты DnD |
| `@neondatabase/serverless` | 1.0.2 | Neon serverless PostgreSQL клиент |
| `@vercel/blob` | 0.27.3 | Загрузка файлов в Vercel Blob |
| `drizzle-orm` | 0.45.1 | ORM для PostgreSQL |
| `next` | 16.1.6 | React фреймворк с App Router |
| `react` | 19.2.3 | UI библиотека |
| `react-body-highlighter` | 2.0.5 | Визуализация мышечных групп на теле |
| `react-dom` | 19.2.3 | React DOM рендеринг |

### Dev Dependencies

| Пакет | Версия | Описание |
|-------|--------|----------|
| `@types/node` | 20.x | TypeScript типы для Node.js |
| `@types/react` | 19.x | TypeScript типы для React |
| `@types/react-dom` | 19.x | TypeScript типы для React DOM |
| `cross-env` | 7.0.3 | Кроссплатформенные env переменные |
| `dotenv` | 17.3.1 | Загрузка .env файлов |
| `drizzle-kit` | 0.31.9 | CLI для Drizzle ORM (миграции, studio) |
| `tsx` | 4.21.0 | TypeScript runner для скриптов |
| `typescript` | 5.x | TypeScript компилятор |

---

## 8. Архитектурные паттерны

### State Management

```
AuthProvider (Telegram auth)
  └─ AuthGate (блокирует UI до авторизации)
      └─ ProfileProvider (данные профиля)
          └─ OnboardingGate (блокирует до онбординга)
              └─ WorkoutProvider (useReducer)
                  └─ {children}
```

- **AuthProvider** — Telegram Web App аутентификация
- **ProfileProvider** — Данные и настройки профиля
- **WorkoutProvider** — Активная тренировка через `useReducer` (добавление/удаление упражнений, подходов, обновление весов)
- **Gates** — Условный рендеринг, блокируют доступ пока не выполнено условие

### API Client (`lib/api/client.ts`)

Централизованный файл (~1000+ строк) со всеми fetch-функциями:

```typescript
// Паттерн каждой функции:
export async function fetchSomethingApi(params): Promise<ReturnType> {
  const res = await fetch('/api/endpoint', {
    headers: getAuthHeaders(),
    // ...
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}
```

- Все запросы добавляют `x-telegram-init-data` заголовок
- Ошибки бросаются как exceptions
- FormData для загрузки файлов

### Database Patterns

- **UUID** — Primary keys везде
- **JSONB** — Гибкие поля (мышцы, оборудование, травмы, лифты)
- **Cascade Delete** — При удалении пользователя удаляются все его данные
- **Restrict Delete** — Упражнения нельзя удалить, если используются в тренировках
- **Unique Indexes** — Предотвращение дубликатов (лайки, подписки)
- **Composite Indexes** — Оптимизация частых запросов

### Component Patterns

- **Client Components** — `'use client'` для интерактивных компонентов
- **Inline Styles** — Все стили через `React.CSSProperties`
- **Theme Tokens** — Цвета, spacing, радиусы из `lib/theme.ts`
- **Bottom Sheet** — Паттерн для длинного контента (drag handle, overlay)
- **Lazy Loading** — Dynamic import для тяжёлых компонентов (`MuscleMapLazy`)
- **Error Boundaries** — Оборачивание нестабильных компонентов
