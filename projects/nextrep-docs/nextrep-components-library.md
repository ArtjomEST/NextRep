# NextRep — Components Library

Полная документация всех React-компонентов проекта NextRep.

> **Стилизация:** Все компоненты используют **inline styles** (React.CSSProperties). Tailwind CSS **не используется**.
> **Тема:** Дизайн-токены находятся в `lib/theme.ts` и `lib/ui-styles.ts`.

---

## Содержание

1. [Базовые UI компоненты](#1-базовые-ui-компоненты)
2. [Компоненты навигации](#2-компоненты-навигации)
3. [Графики и визуализация](#3-графики-и-визуализация)
4. [Формы и ввод](#4-формы-и-ввод)
5. [Упражнения](#5-упражнения)
6. [Тренировки](#6-тренировки)
7. [Сообщество](#7-сообщество)
8. [AI компоненты](#8-ai-компоненты)
9. [Гейты и провайдеры](#9-гейты-и-провайдеры)
10. [Прочие компоненты](#10-прочие-компоненты)

---

## 1. Базовые UI компоненты

### Button

**Файл:** `components/Button.tsx`

Основная кнопка приложения с тремя вариантами и тремя размерами.

**Props:**

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | Визуальный вариант |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер кнопки |
| `fullWidth` | `boolean` | `false` | Растянуть на всю ширину |
| `disabled` | `boolean` | `false` | Неактивное состояние |
| `children` | `React.ReactNode` | — | Содержимое кнопки |
| `...rest` | `HTMLButtonElement` | — | Все стандартные HTML атрибуты |

**Варианты:**

- **primary** — Заполненная зелёная кнопка (`#1F8A5B`), белый текст
- **secondary** — Прозрачная с пунктирной границей (`1px dashed #262E36`)
- **ghost** — Прозрачная без границ, серый текст (`#9CA3AF`)

**Размеры:**

| Размер | Padding | Font Size |
|--------|---------|-----------|
| `sm` | `8px 14px` | `13px` |
| `md` | `13px 20px` | `15px` |
| `lg` | `15px 20px` | `16px` |

**Примеры:**

```tsx
import Button from '@/components/Button';

// Primary кнопка
<Button variant="primary" size="lg" fullWidth>
  Начать тренировку
</Button>

// Secondary кнопка
<Button variant="secondary" onClick={handleCancel}>
  Отменить
</Button>

// Ghost кнопка
<Button variant="ghost" size="sm">
  Подробнее
</Button>
```

**Когда использовать:** Основные действия (primary), вторичные действия (secondary), текстовые ссылки-кнопки (ghost).
**Когда НЕ использовать:** Навигационные ссылки — используйте `<a>` или `next/link`.

---

### Card

**Файл:** `components/Card.tsx`

Контейнер-карточка с опциональным onClick.

**Props:**

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `children` | `React.ReactNode` | — | Содержимое |
| `style` | `React.CSSProperties` | — | Дополнительные стили |
| `onClick` | `() => void` | — | Клик-обработчик |

**Стили:**
- Фон: `#1C2228`
- Граница: `1px solid #262E36`
- Радиус: `12px`
- Отступ: `16px`
- При hover (если кликабельная): подсветка границы

**Примеры:**

```tsx
import Card from '@/components/Card';

// Статичная карточка
<Card>
  <h3>Заголовок</h3>
  <p>Контент карточки</p>
</Card>

// Кликабельная карточка
<Card onClick={() => router.push('/workout/123')} style={{ cursor: 'pointer' }}>
  <span>Тренировка #1</span>
</Card>
```

**Когда использовать:** Контейнеры для контента, статистика, списки.
**Когда НЕ использовать:** Для модальных окон — используйте `Modal`.

---

### Modal

**Файл:** `components/Modal.tsx`

Центрированное модальное окно с backdrop-оверлеем.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `open` | `boolean` | Показать/скрыть модал |
| `onClose` | `() => void` | Колбэк закрытия |
| `children` | `React.ReactNode` | Содержимое модала |

**Особенности:**
- Закрытие по Escape
- Закрытие по клику на overlay
- z-index: 300
- max-width: 360px
- Overlay: `rgba(0,0,0,0.6)`

**Примеры:**

```tsx
import Modal from '@/components/Modal';

const [showConfirm, setShowConfirm] = useState(false);

<Modal open={showConfirm} onClose={() => setShowConfirm(false)}>
  <h3 style={{ color: '#F3F4F6', fontSize: 16, marginBottom: 12 }}>
    Удалить тренировку?
  </h3>
  <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 16 }}>
    Это действие нельзя отменить.
  </p>
  <Button variant="primary" fullWidth onClick={handleDelete}>
    Удалить
  </Button>
</Modal>
```

**Когда использовать:** Подтверждения, простые формы, алерты.
**Когда НЕ использовать:** Длинный контент со скроллом — используйте Bottom Sheet паттерн (как в `ExerciseInfoSheet`).

---

### Skeleton

**Файл:** `components/Skeleton.tsx`

Плейсхолдер для загружающегося контента.

**Props:**

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `width` | `string \| number` | — | Ширина |
| `height` | `string \| number` | `16px` | Высота |
| `borderRadius` | `string \| number` | `8px` | Радиус скругления |
| `style` | `React.CSSProperties` | — | Доп. стили |

**Примеры:**

```tsx
import Skeleton from '@/components/Skeleton';

// Текстовая строка
<Skeleton width="60%" height={14} />

// Аватар
<Skeleton width={40} height={40} borderRadius="50%" />

// Карточка
<Skeleton width="100%" height={120} borderRadius={12} />
```

---

### StatCard

**Файл:** `components/StatCard.tsx`

Карточка с одним числовым значением и лейблом.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `label` | `string` | Название метрики (uppercase) |
| `value` | `string \| number` | Значение |
| `unit` | `string` (опц.) | Единица измерения |

**Примеры:**

```tsx
import StatCard from '@/components/StatCard';

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
  <StatCard label="Тренировок" value={42} />
  <StatCard label="Объём" value="12,450" unit="кг" />
  <StatCard label="Подходов" value={315} />
</div>
```

**Описание:** Label отображается вверху маленькими CAPS-буквами (#9CA3AF, 12px), значение крупным жирным текстом (#F3F4F6, 20px, weight 700), единица измерения мелким серым текстом.

---

## 2. Компоненты навигации

### TabBar

**Файл:** `components/TabBar.tsx`

Нижняя навигация приложения с 4 табами.

**Props:** Нет (использует `usePathname`, `useRouter` из Next.js).

**Табы:**

| Таб | Путь | Иконка |
|-----|------|--------|
| Home | `/` | SVG дом |
| History | `/history` | SVG часы |
| Community | `/community` | SVG люди |
| Account | `/account` | SVG профиль |

**Особенности:**
- Активный таб выделен зелёным с полоской-индикатором сверху
- Скрывается на страницах: `/workout`, `/start`, `/account/presets`
- Поддержка safe-area-inset-bottom для Telegram

**Примеры:**

```tsx
// Используется в layout.tsx
import TabBar from '@/components/TabBar';

<>
  <main>{children}</main>
  <TabBar />
</>
```

---

## 3. Графики и визуализация

### LineChart

**Файл:** `components/LineChart.tsx`

SVG-график с линией и градиентной заливкой.

**Props:**

| Prop | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `data` | `{ label: string; value: number }[]` | — | Точки данных |
| `height` | `number` | `200` | Высота графика |

**Примеры:**

```tsx
import LineChart from '@/components/LineChart';

<LineChart
  data={[
    { label: 'Пн', value: 800 },
    { label: 'Вт', value: 0 },
    { label: 'Ср', value: 1200 },
    { label: 'Чт', value: 950 },
    { label: 'Пт', value: 1500 },
  ]}
  height={180}
/>
```

**Описание:** Рендерит SVG с area-fill (зелёный градиент), линией, и анимированными точками. Подписи осей автоматические.

---

### WeeklyVolumeChart

**Файл:** `components/WeeklyVolumeChart.tsx`

Bar chart недельного объёма тренировок.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `initialData` | `WeeklyVolumeChartData` (опц.) | Начальные данные |
| `entranceAnimation` | `boolean` (опц.) | Анимация появления |

**Особенности:**
- Вертикальные бары с зелёным градиентом
- Тултип при нажатии на бар
- Staggered анимация появления
- Респект prefers-reduced-motion

---

### MuscleMap / MuscleMapLazy

**Файл:** `components/MuscleMap.tsx`, `components/MuscleMapLazy.tsx`

Визуализация мышечных групп на модели тела.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `primaryMuscles` | `string[]` | Основные мышцы (яркий зелёный) |
| `secondaryMuscles` | `string[]` | Вторичные мышцы (приглушённый зелёный) |
| `compact` | `boolean` (опц.) | Компактный размер |
| `plain` | `boolean` (опц.) | Без дополнительного оформления |

**Примеры:**

```tsx
import MuscleMapLazy from '@/components/MuscleMapLazy';

<MuscleMapLazy
  primaryMuscles={['chest', 'shoulders']}
  secondaryMuscles={['triceps']}
  compact
/>
```

**Когда использовать:** Детали упражнения, превью пресета.
**Важно:** Используйте `MuscleMapLazy` (dynamic import, SSR off) вместо `MuscleMap` напрямую для оптимизации bundle.

---

### HistoryProgressSection

**Файл:** `components/HistoryProgressSection.tsx`

Секция прогресса по упражнениям с SVG-графиком.

**Props:** Нет (самостоятельный, fetchит данные).

**Особенности:**
- Dropdown для выбора упражнения
- Переключатель метрик: weight / volume / estimated 1RM
- Кеширование данных
- SVG-график с тултипами

---

## 4. Формы и ввод

### SetRow

**Файл:** `components/SetRow.tsx`

Строка подхода в активной тренировке.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `index` | `number` | Номер подхода (0-based) |
| `set` | `WorkoutSet` | Данные подхода |
| `onWeightChange` | `(value: string) => void` | Изменение веса |
| `onRepsChange` | `(value: string) => void` | Изменение повторений |
| `onToggleComplete` | `() => void` | Переключение выполнения |
| `onRemove` | `() => void` | Удаление подхода |
| `readOnly` | `boolean` (опц.) | Только просмотр |

**Примеры:**

```tsx
import SetRow from '@/components/SetRow';

<SetRow
  index={0}
  set={{ weight: '80', reps: '10', completed: false }}
  onWeightChange={(v) => dispatch({ type: 'SET_WEIGHT', index: 0, value: v })}
  onRepsChange={(v) => dispatch({ type: 'SET_REPS', index: 0, value: v })}
  onToggleComplete={() => dispatch({ type: 'TOGGLE_SET', index: 0 })}
  onRemove={() => dispatch({ type: 'REMOVE_SET', index: 0 })}
/>
```

**Описание:** Рендерит: номер подхода | инпут веса | × | инпут повторений | чекбокс | кнопка удаления. Decimal нормализация (запятая → точка).

---

### ExercisePicker

**Файл:** `components/ExercisePicker.tsx`

Полноэкранный модал для выбора упражнений.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `open` | `boolean` | Показать/скрыть |
| `onClose` | `() => void` | Закрытие |
| `onAdd` | `(exercises: Exercise[]) => void` | Добавление выбранных |
| `alreadyAddedIds` | `string[]` | Уже добавленные (отключены) |

**Особенности:**
- Поиск по названию
- Фильтрация по мышечным группам (чипы)
- Multi-select с pending state
- Sticky кнопки добавления внизу

**Примеры:**

```tsx
import ExercisePicker from '@/components/ExercisePicker';

<ExercisePicker
  open={showPicker}
  onClose={() => setShowPicker(false)}
  onAdd={(exercises) => {
    exercises.forEach(e => dispatch({ type: 'ADD_EXERCISE', exercise: e }));
    setShowPicker(false);
  }}
  alreadyAddedIds={currentExerciseIds}
/>
```

---

## 5. Упражнения

### ExerciseCard

**Файл:** `components/ExerciseCard.tsx`

Карточка упражнения в списке.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `exercise` | `Exercise` | Данные упражнения |
| `onClick` | `() => void` (опц.) | Клик-обработчик |

**Описание:** Название, теги мышечных групп + оборудования, chevron иконка справа.

---

### ExerciseInfoSheet

**Файл:** `components/ExerciseInfoSheet.tsx`

Bottom sheet с детальной информацией об упражнении.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `exercise` | `ExerciseDetail \| null` | Данные упражнения |
| `open` | `boolean` | Показать/скрыть |
| `loading` | `boolean` (опц.) | Загрузка |
| `onClose` | `() => void` | Закрытие |

**Содержимое:** Drag handle, изображение, секции (Muscles, Equipment, Instructions, Type), Chip-компоненты с accent-вариантами.

---

### WorkoutExerciseCard / SortableExerciseCard

**Файлы:** `components/WorkoutExerciseCard.tsx`, `components/SortableExerciseCard.tsx`

Карточка упражнения для drag & drop списка при создании тренировки.

**WorkoutExerciseCard Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `entry` | `WorkoutExercise` | Данные упражнения |
| `onRemove` | `() => void` | Удаление |
| `isDragging` | `boolean` (опц.) | В процессе drag |
| `dragHandleProps` | `object` (опц.) | Props для drag handle |

**SortableExerciseCard** — обёртка с `@dnd-kit/sortable`, проксирует `WorkoutExerciseCard`.

---

### WorkoutLogExerciseRow

**Файл:** `components/WorkoutLogExerciseRow.tsx`

Строка упражнения для ленты/сообщества.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `exerciseImageUrl` | `string` (опц.) | URL thumbnail |
| `exerciseName` | `string` | Название |
| `completedSets` | `string` (опц.) | Текст подходов (напр. "3 × 10") |
| `thumbSize` | `number` | Размер thumbnail |
| `nameFontWeight` | `number` | Толщина шрифта названия |
| `setsLabel` | `string` (опц.) | Текст лейбла подходов |

---

## 6. Тренировки

### WorkoutCard

**Файл:** `components/WorkoutCard.tsx`

Карточка тренировки в истории и ленте.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `workout` | `Workout` | Данные тренировки |
| `compact` | `boolean` (опц.) | Компактный вид |

**Описание:** Название, дата, количество упражнений, общий объём, % улучшения (зелёный/красный).

---

### RestTimer

**Файл:** `components/RestTimer.tsx`

Таймер отдыха между подходами с тремя режимами отображения.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `visible` | `boolean` | Показать/скрыть |
| `isMinimized` | `boolean` (опц.) | Свёрнутый режим |
| `embedded` | `boolean` (опц.) | Встроенный режим |
| `durationSeconds` | `number` | Длительность |
| `suppressAutoDismiss` | `boolean` | Не скрывать автоматически |
| `workoutName` | `string` | Название тренировки |
| `exerciseName` | `string` | Название упражнения |
| `setIndex` | `number` | Номер подхода |
| `onDismiss` | `() => void` | Закрытие |
| `onMinimize` | `() => void` | Сворачивание |
| `onMaximize` | `() => void` | Разворачивание |

**Режимы:**
1. **Full** — Полноэкранный с круговым SVG таймером
2. **Minimized** — Компактная полоска внизу
3. **Embedded** — Встроенный в карточку

**Элементы управления:** −30 сек / пауза-play / +30 сек.

---

## 7. Сообщество

### CommunityCommentsSheet

**Файл:** `components/CommunityCommentsSheet.tsx`

Bottom sheet с комментариями.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `target` | `CommentsTarget` | `{ type: 'workout' \| 'post', id: string }` |
| `open` | `boolean` | Показать/скрыть |
| `onClose` | `() => void` | Закрытие |
| `onCommentPosted` | `() => void` | Колбэк после отправки |

**Содержит:** Список комментариев с аватарами, textarea для ввода, кнопка отправки.

---

### CreatePostSheet

**Файл:** `components/CreatePostSheet.tsx`

Bottom sheet для создания/редактирования поста.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `open` | `boolean` | Показать/скрыть |
| `onClose` | `() => void` | Закрытие |
| `onPosted` | `() => void` (опц.) | Колбэк после публикации |
| `editInitial` | `EditPostData` (опц.) | Данные для редактирования |
| `onSavedEdit` | `() => void` (опц.) | Колбэк после сохранения правки |

**Возможности:** Текст, загрузка фото (с компрессией), выбор пресета, превью.

---

### CommunityPresetPreview

**Файл:** `components/CommunityPresetPreview.tsx`

Превью пресета в посте сообщества.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `preset` | `FeedPostPresetSummary` | Данные пресета |
| `authorName` | `string` | Имя автора |
| `showSavePreset` | `boolean` | Показать кнопку сохранения |
| `savedByMe` | `boolean` | Уже сохранён |
| `onSavePreset` | `() => void` | Колбэк сохранения |

**Описание:** Компактная карточка → раскрывается в детальный sheet с MuscleMap, списком упражнений и кнопкой сохранения.

---

## 8. AI компоненты

### AIChatWidget

**Файл:** `components/AIChatWidget.tsx`

Виджет AI-коуча, доступный на всех страницах.

**Props:** Нет (использует контексты).

**Возможности:**
- FAB кнопка (floating action button)
- Чат с AI-тренером
- Загрузка истории сообщений
- Голосовой ввод (Web Speech API)
- Превью и сохранение AI-пресетов
- Бейдж непрочитанных сообщений

---

### AIWorkoutReportCard

**Файл:** `components/AIWorkoutReportCard.tsx`

Карточка AI-анализа тренировки.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `loading` | `boolean` | Загрузка |
| `error` | `string \| null` | Ошибка |
| `report` | `string \| null` | Текст отчёта |
| `scores` | `AiWorkoutReportScores` | Оценки |

**AiWorkoutReportScores:**

```typescript
{
  total: number;      // 0-100, общая оценка
  volume: number;     // 0-100
  intensity: number;  // 0-100
  consistency: number;// 0-100
  duration: number;   // 0-100
  prBonus: number;    // 0-50
}
```

**Описание:** Анимированный круговой индикатор общей оценки + breakdown по параметрам.

---

### AiPresetCards

**Файл:** `components/ai/AiPresetCards.tsx`

Набор компонентов для AI-пресетов.

**Подкомпоненты:**
- `AiPresetResultCard` — Карточка готового пресета
- `PresetLoadingCard` — Анимация загрузки пресета
- `OnboardingAlexLoadingCard` — Загрузка в онбординге
- `AiPresetPreviewSheet` — Детальный просмотр пресета

---

## 9. Гейты и провайдеры

### AuthGate

**Файл:** `components/AuthGate.tsx`

Гейт аутентификации через Telegram.

**Props:** `{ children: React.ReactNode }`

**Состояния:**
1. **Loading** — Спиннер с логотипом
2. **Unauthenticated** — Экран авторизации с Telegram MainButton
3. **Needs Linking** — Привязка аккаунта
4. **Authenticated** — Рендерит `children`

**Dev mode:** Обход авторизации в разработке.

---

### OnboardingGate

**Файл:** `components/OnboardingGate.tsx`

Гейт онбординга.

**Props:** `{ children: React.ReactNode }`

Показывает `OnboardingWizard` если `onboardingCompleted === false`.

---

### OnboardingWizard

**Файл:** `components/OnboardingWizard.tsx`

Многошаговый визард онбординга (~500+ строк).

**Шаги:**
1. Выбор цели (muscle growth / strength / endurance / weight loss / general fitness)
2. Уровень опыта (beginner / intermediate / advanced)
3. Предпочтительный сплит
4. Дни в неделю
5. Параметры тела (рост, вес, возраст)
6. Лучшие результаты (bench, squat, deadlift)
7. Травмы

**Подкомпоненты:** `ProgressBar`, `PrimaryBtn`, `NumberInput`, `OptionCard`, `StepAnim`.

**Особенности:** Сохранение прогресса в localStorage, анимации переходов.

---

## 10. Прочие компоненты

### Header

**Файл:** `components/Header.tsx`

Заголовок с приветствием и стриком.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `greeting` | `string` | Текст приветствия |
| `streak` | `number` | Количество дней стрика |

---

### UserGreeting

**Файл:** `components/UserGreeting.tsx`

Приветствие пользователя по имени.

**Props:** Нет (использует `useAuth()`).

**Описание:** Показывает "Hey, {firstName}!" или "Hey, there!" если имя неизвестно. Skeleton при загрузке.

---

### ProgressCard

**Файл:** `components/ProgressCard.tsx`

Карточка с графиком прогресса и выбором упражнения через чипы.

**Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `title` | `string` (опц.) | Заголовок секции |

---

### LegendsWorkoutSlider / LegendsWorkoutCard

**Файлы:** `components/LegendsWorkoutSlider.tsx`, `components/LegendsWorkoutCard.tsx`

Горизонтальный слайдер "легендарных тренировок" (предустановленные известные программы).

**LegendsWorkoutCard Props:**

| Prop | Тип | Описание |
|------|-----|----------|
| `legend` | `LegendWorkout` | Данные легенды |
| `onUsePreset` | `() => void` | Использовать как пресет |
| `applying` | `boolean` (опц.) | Загрузка применения |

**Описание:** Карточка с фоновым изображением, gradient overlay, иконками traits и кнопкой "Use Preset". Keyboard accessible (Enter/Space).
