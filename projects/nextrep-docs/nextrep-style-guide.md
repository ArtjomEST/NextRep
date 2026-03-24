# NextRep — Style Guide

Правила и ограничения при разработке NextRep.

---

## 1. Цветовая палитра

### МОЖНО использовать

| Цвет | Hex | Использование |
|------|-----|---------------|
| Dark Background | `#0E1114` | Основной фон |
| Surface | `#161B20` | Скелетоны, поднятые области |
| Card | `#1C2228` | Фон карточек |
| Border | `#262E36` | Границы, разделители |
| Primary | `#1F8A5B` | Кнопки, акценты |
| Primary Hover | `#25A46B` | Hover-состояния |
| Primary Pressed | `#176B47` | Pressed-состояния |
| Success | `#22C55E` | Успех, рост, подтверждение |
| Warning | `#F59E0B` | Предупреждения |
| Error | `#EF4444` | Ошибки, удаление |
| Info | `#3B82F6` | Информация |
| Text Primary | `#F3F4F6` | Основной текст |
| Text Secondary | `#9CA3AF` | Вторичный текст |
| Text Muted | `#6B7280` | Приглушённый текст |

### Transparency-цвета

```
rgba(255,255,255,0.06)  — Subtle borders
rgba(255,255,255,0.08)  — Hover backgrounds
rgba(255,255,255,0.42)  — Muted text
rgba(255,255,255,0.5)   — Labels
rgba(0,0,0,0.25)        — Card shadows
rgba(0,0,0,0.6)         — Modal overlay
rgba(34,197,94,0.12)    — Success background
rgba(34,197,94,0.25)    — Accent soft
rgba(34,197,94,0.4)     — Accent glow
rgba(34,197,94,0.5)     — Focus ring
rgba(34,197,94,0.95)    — Accent near-opaque
```

### НЕЛЬЗЯ использовать

- **Чистый чёрный** `#000000` — используйте `#0E1114`
- **Чистый белый** `#FFFFFF` — используйте `#F3F4F6` для текста
- **Фиолетовые/розовые оттенки** — не часть палитры
- **Оранжевые градиенты** — только `#F59E0B` для warnings
- **Любые цвета вне палитры** без согласования

### Градиенты

```css
/* Card background */
linear-gradient(180deg, #1a2026 0%, #151b21 100%)

/* Hero emerald section */
linear-gradient(145deg, #0f2e1f 0%, #143d28 40%, #165834 100%)

/* Success bar */
linear-gradient(90deg, rgba(34,197,94,0.85), rgba(21,128,61,0.95))
```

---

## 2. Типографика

### Шрифт

**Единственный шрифт:** системный стек

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

Кастомные шрифты **не используются**.

### Размеры текста

| Название | Размер | Weight | Использование |
|----------|--------|--------|---------------|
| Caption | 10px | 500-600 | Маленькие бейджи, uppercase |
| Label | 12px | 500-600 | Метки, формы, secondary info |
| Small Body | 13px | 400-500 | Инпуты, сноски, ошибки |
| Body | 14px | 400 | Основной текст, комментарии |
| Body Large | 15px | 400-700 | Кнопки, выделенный текст |
| Subtitle | 16px | 600-700 | Подзаголовки, заголовки модалок |
| Section Title | 18px | 600-700 | Заголовки секций |
| Stat Value | 20px | 700-800 | Числовые значения |
| Page Heading | 28px | 700 | Заголовки страниц |
| Display | 32-40px | 700 | Крупные responsive заголовки |

### Правила типографики

**DO:**
```tsx
// Заголовок страницы
<h1 style={{ fontSize: 28, fontWeight: 700, color: '#F3F4F6', letterSpacing: '-0.02em' }}>
  История
</h1>

// Label (uppercase)
<span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
  Общий объём
</span>

// Body text
<p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.5 }}>
  Описание тренировки
</p>
```

**DON'T:**
```tsx
// Не использовать px в строке для fontSize — используйте число
<p style={{ fontSize: '14px' }}>  // BAD
<p style={{ fontSize: 14 }}>     // GOOD

// Не хардкодить цвета — используйте theme
<p style={{ color: 'gray' }}>           // BAD
<p style={{ color: theme.colors.textSecondary }}>  // GOOD
```

---

## 3. Spacing (отступы)

### Базовая шкала

| Токен | Значение | Использование |
|-------|----------|---------------|
| `xs` | 4px | Минимальные отступы, gap в inline элементах |
| `sm` | 8px | Стандартный мелкий отступ, gap в списках |
| `md` | 16px | Отступы в карточках, основной gap |
| `lg` | 24px | Отступы страниц, большие секции |
| `xl` | 32px | Большие отступы (auth, онбординг) |

### Правила

- **Padding карточки:** 16px (theme.spacing.md)
- **Padding страницы:** 24px по бокам
- **Gap между карточками:** 8-12px
- **Gap между секциями:** 14-22px
- **Safe area:** `max(12px, env(safe-area-inset-bottom, 12px))`

---

## 4. Компоненты — Правила создания

### Обязательные правила

1. **`'use client'`** — Добавлять в начало файла для всех интерактивных компонентов
2. **Inline styles** — Все стили через `React.CSSProperties`, никакого CSS/Tailwind
3. **Theme tokens** — Цвета из `lib/theme.ts`, не хардкодить
4. **TypeScript** — Типизировать все props через interface/type
5. **Default export** — Один компонент = один файл

### Структура файла компонента

```tsx
'use client';

import { useState } from 'react';
import { theme } from '@/lib/theme';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  const [active, setActive] = useState(false);

  return (
    <div style={{
      background: theme.colors.card,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
    }}>
      <h3 style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: 600 }}>
        {title}
      </h3>
    </div>
  );
}
```

### DO's

```tsx
// Используйте theme tokens
background: theme.colors.card
borderRadius: theme.radius.md
padding: theme.spacing.md

// Используйте transitions
transition: 'background 0.2s ease, border-color 0.15s ease'

// Используйте CSS-in-JS анимации через <style> теги
<style>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`}</style>
```

### DON'Ts

```tsx
// НЕ используйте className (кроме Next.js generated)
<div className="card-wrapper">  // BAD

// НЕ используйте Tailwind
<div className="bg-gray-900 p-4 rounded-lg">  // BAD

// НЕ хардкодите цвета
background: '#1C2228'  // BAD (если не в theme)
background: theme.colors.card  // GOOD

// НЕ создавайте CSS файлы для компонентов
// (только globals.css для глобальных стилей)

// НЕ используйте styled-components или emotion
```

---

## 5. Naming Conventions

### Файлы и папки

| Элемент | Конвенция | Пример |
|---------|-----------|--------|
| Компоненты | PascalCase | `Button.tsx`, `ExercisePicker.tsx` |
| Страницы | lowercase | `page.tsx`, `layout.tsx` |
| API routes | lowercase | `route.ts` |
| Библиотеки | kebab-case | `ui-styles.ts`, `feed-queries.ts` |
| Схемы БД | lowercase | `users.ts`, `workouts.ts` |
| Папки | kebab-case | `workout-log/`, `ai/` |

### Переменные и функции

| Элемент | Конвенция | Пример |
|---------|-----------|--------|
| Компоненты | PascalCase | `function ExerciseCard()` |
| Функции | camelCase | `fetchWorkoutsApi()`, `handleClick()` |
| Переменные | camelCase | `totalVolume`, `isLoading` |
| Константы | camelCase / UPPER_SNAKE | `theme`, `MAX_SETS` |
| Props interfaces | PascalCase + Props | `ButtonProps`, `CardProps` |
| API функции | camelCase + Api | `fetchMeApi()`, `saveWorkoutApi()` |
| DB колонки | camelCase | `userId`, `createdAt`, `totalVolume` |
| Enums (DB) | snake_case | `'weight_reps'`, `'muscle_growth'` |

### Импорты

```tsx
// Используйте path alias
import Button from '@/components/Button';      // GOOD
import { theme } from '@/lib/theme';           // GOOD
import { fetchMeApi } from '@/lib/api/client'; // GOOD

// НЕ используйте относительные пути для глубоких импортов
import Button from '../../components/Button';  // BAD
```

---

## 6. Code Standards

### TypeScript

- **Strict mode** включен
- Все props типизированы
- Не используйте `any` — используйте конкретные типы или `unknown`
- Path alias `@/*` для всех импортов

### React

- **Functional components** только (нет class components)
- **Hooks** для состояния и эффектов
- **`'use client'`** для клиентских компонентов
- **Default export** для компонентов

### Форматирование

- Файлы в UTF-8
- Consistent indentation (2 spaces)
- Semicolons опциональны (проект использует оба варианта)
- Single quotes для строк в JSX

---

## 7. DO's and DON'Ts

### DO ✓

```tsx
// Используйте theme для всех стилей
style={{ background: theme.colors.card }}

// Используйте inline styles
style={{ padding: 16, borderRadius: 12 }}

// Используйте числа для fontSize, padding и т.д.
style={{ fontSize: 14, padding: 16 }}

// Используйте transitions для hover/active
style={{ transition: 'opacity 0.2s ease' }}

// Добавляйте cursor: 'pointer' для кликабельных элементов
style={{ cursor: 'pointer' }}

// Используйте flexbox для layouts
style={{ display: 'flex', alignItems: 'center', gap: 8 }}

// Используйте safe-area для нижних элементов
paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))'

// Скрывайте overflow для скроллируемых контейнеров
style={{ overflow: 'auto', WebkitOverflowScrolling: 'touch' }}
```

### DON'T ✗

```tsx
// Не используйте Tailwind CSS классы
className="bg-gray-900 p-4"  // ✗

// Не используйте CSS modules (кроме page.module.css)
import styles from './Component.module.css'  // ✗

// Не используйте styled-components / emotion
const StyledDiv = styled.div`...`  // ✗

// Не хардкодите цвета
style={{ color: 'gray' }}  // ✗
style={{ background: '#1a1a1a' }}  // ✗

// Не используйте px-строки в inline styles
style={{ fontSize: '14px' }}  // ✗ (используйте число)
style={{ fontSize: 14 }}  // ✓

// Не создавайте светлую тему
// Приложение — ТОЛЬКО dark mode

// Не добавляйте кастомные шрифты
// Только системный стек шрифтов

// Не используйте position: fixed без z-index
style={{ position: 'fixed' }}  // ✗ (нужен z-index)

// Не забывайте 'use client' для компонентов с useState/useEffect
```

---

## 8. Accessibility

### Минимальные требования

- **Keyboard navigation:** Кликабельные элементы доступны через Tab
- **ARIA labels:** Для иконок-кнопок без текста
- **Color contrast:** Text Primary (#F3F4F6) на фоне (#0E1114) = ~15.6:1 (отлично)
- **Focus indicators:** Зелёная обводка для фокусируемых элементов
- **prefers-reduced-motion:** Отключение анимаций для пользователей с motion sensitivity

### Примеры

```tsx
// Кнопка-иконка с aria-label
<button
  aria-label="Удалить подход"
  onClick={handleRemove}
  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
>
  <TrashIcon />
</button>

// Keyboard accessible карточка
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  onClick={handleClick}
>
  Content
</div>

// Reduced motion
<style>{`
  @media (prefers-reduced-motion: reduce) {
    .animated { animation: none !important; }
  }
`}</style>
```

---

## 9. Performance

### Рекомендации

1. **Dynamic imports** — Тяжёлые компоненты загружать через `next/dynamic`

```tsx
import dynamic from 'next/dynamic';
const MuscleMap = dynamic(() => import('@/components/MuscleMap'), { ssr: false });
```

2. **Мемоизация** — `useMemo` / `useCallback` для дорогих вычислений

3. **Кеширование** — Кешировать API-ответы в state, не рефетчить без необходимости

4. **Изображения** — Компрессия фото перед загрузкой (уже реализовано в CreatePostSheet)

5. **Pagination** — Все списки с `limit`/`offset`, не загружать всё сразу

6. **SSR: false** — Для компонентов, зависящих от browser API (Telegram SDK, Web Speech)

### Чего избегать

- Не рендерить длинные списки без виртуализации (или пагинации)
- Не загружать все упражнения разом (используйте поиск/фильтрацию)
- Не хранить тяжёлые данные в Context (используйте локальный state)
- Не делать API-запросы в render-функции (только в useEffect)
- Не забывать cleanup для таймеров и subscriptions

---

## 10. Тёмная тема — Обязательно

NextRep — **исключительно тёмное** приложение. Светлая тема не поддерживается и не планируется.

### Иерархия фонов (от тёмного к светлому):

```
#0E1114  — Page background (самый тёмный)
#161B20  — Surface (скелетоны, elevated areas)
#1C2228  — Cards (карточки, модалы)
#262E36  — Borders (границы, разделители)
```

### Текст (от яркого к тусклому):

```
#F3F4F6  — Primary text (основной)
#9CA3AF  — Secondary text (вторичный)
#6B7280  — Muted text (приглушённый)
rgba(255,255,255,0.42) — Very muted
rgba(255,255,255,0.5)  — Labels
```

Эта иерархия создаёт глубину и визуальное разделение без использования ярких фонов.
