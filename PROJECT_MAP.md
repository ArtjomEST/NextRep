# NextRep — Project Map

> **Single source of truth for project structure.**
> Update this file after every change that adds/removes/renames a file, adds/removes an API endpoint, or changes a DB schema.

---

## 1. Full File Tree

```
./app/AppErrorBoundary.tsx
./app/account/page.tsx
./app/account/presets/new/page.tsx
./app/api/ai/chat/history/route.ts
./app/api/ai/chat/route.ts
./app/api/ai/workout-report/route.ts
./app/api/billing/stars/route.ts
./app/api/community/posts/[id]/comments/route.ts
./app/api/community/posts/[id]/like/route.ts
./app/api/community/posts/[id]/route.ts
./app/api/community/posts/route.ts
./app/api/community/presets/[presetId]/route.ts
./app/api/deload/dismiss/route.ts
./app/api/deload/plan/route.ts
./app/api/deload/restore/route.ts
./app/api/deload/status/route.ts
./app/api/exercises/[id]/route.ts
./app/api/exercises/route.ts
./app/api/feed/route.ts
./app/api/health/route.ts
./app/api/me/link/route.ts
./app/api/me/route.ts
./app/api/me/settings/route.ts
./app/api/presets/[id]/route.ts
./app/api/presets/[id]/save/route.ts
./app/api/presets/route.ts
./app/api/profile/route.ts
./app/api/progress/exercises/[id]/route.ts
./app/api/progress/exercises/route.ts
./app/api/promo/redeem/route.ts
./app/api/telegram/webhook/route.ts
./app/api/timer/arm/route.ts
./app/api/timer/cleanup/route.ts
./app/api/timer/cron/route.ts
./app/api/cron/weekly-report/route.ts
./app/api/timer/fire/route.ts
./app/api/timer/pause/route.ts
./app/api/timer/resume/route.ts
./app/api/timer/update/route.ts
./app/api/trial/activate/route.ts
./app/api/upload/workout-photo/route.ts
./app/api/users/[id]/follow/route.ts
./app/api/users/[id]/profile/route.ts
./app/api/users/search/route.ts
./app/api/workouts/[id]/comments/route.ts
./app/api/workouts/[id]/exercises/[weId]/route.ts
./app/api/workouts/[id]/exercises/route.ts
./app/api/workouts/[id]/export/route.ts
./app/api/workouts/[id]/like/route.ts
./app/api/workouts/[id]/route.ts
./app/api/workouts/[id]/send-pdf/route.ts
./app/api/workouts/last-sets/route.ts
./app/api/workouts/route.ts
./app/api/workouts/stats/route.ts
./app/api/workouts/weekly-volume/route.ts
./app/community/page.tsx
./app/community/search/page.tsx
./app/exercises/[id]/page.tsx
./app/exercises/page.tsx
./app/history/[id]/page.tsx
./app/history/all/page.tsx
./app/history/page.tsx
./app/layout-shell.tsx
./app/layout.tsx
./app/page.tsx
./app/profile/[id]/page.tsx
./app/providers.tsx
./app/start/page.tsx
./app/workout/active/page.tsx
./app/workout/new/page.tsx
./app/workout/summary/page.tsx
./components/AIChatWidget.tsx
./components/AIReportWithGate.tsx
./components/AIWorkoutReportCard.tsx
./components/AuthGate.tsx
./components/Button.tsx
./components/Card.tsx
./components/CardioExerciseCard.tsx
./components/CommunityCommentsSheet.tsx
./components/CommunityPresetPreview.tsx
./components/CreatePostSheet.tsx
./components/DeloadPlanSheet.tsx
./components/DownloadWorkoutButton.tsx
./components/EmptyStatsOverlay.tsx
./components/ExerciseCard.tsx
./components/ExerciseInfoSheet.tsx
./components/ExercisePicker.tsx
./components/Header.tsx
./components/HistoryProgressSection.tsx
./components/LegendsWorkoutCard.tsx
./components/LegendsWorkoutSlider.tsx
./components/LineChart.tsx
./components/Modal.tsx
./components/MuscleMap.tsx
./components/MuscleMapLazy.tsx
./components/MuscleMapWithGate.tsx
./components/OnboardingGate.tsx
./components/OnboardingWizard.tsx
./components/ProBannerModal.tsx
./components/ProGateTooltip.tsx
./components/ProLockBadge.tsx
./components/ProSubscriptionCard.tsx
./components/ProTrialOnboardingSheet.tsx
./components/ProgressCard.tsx
./components/RecoveryStatusCard.tsx
./components/RestTimer.tsx
./components/SetRow.tsx
./components/Skeleton.tsx
./components/SortableExerciseCard.tsx
./components/StatCard.tsx
./components/TabBar.tsx
./components/UserGreeting.tsx
./components/WeeklyVolumeChart.tsx
./components/WorkoutCard.tsx
./components/WorkoutExerciseCard.tsx
./components/WorkoutLogExerciseRow.tsx
./components/ai/AiPresetCards.tsx
./drizzle.config.ts
./lib/ai/coachContext.ts
./lib/ai/exerciseSuggestions.ts
./lib/ai/openai.ts
./lib/ai/presetGeneration.ts
./lib/ai/presetIntent.ts
./lib/ai/weeklyReportText.ts
./lib/ai/workoutScore.ts
./lib/ai/workoutScoreContext.ts
./lib/api/client.ts
./lib/api/exportWorkout.ts
./lib/api/types.ts
./lib/api/validate.ts
./lib/apiClient.ts
./lib/auth/client.ts
./lib/auth/context.tsx
./lib/auth/helpers.ts
./lib/auth/telegram.ts
./lib/cardio-params.ts
./lib/community/feed-queries.ts
./lib/community/preset-exercise-preview.ts
./lib/community/time.ts
./lib/community/workoutPr.ts
./lib/db/index.ts
./lib/db/schema/ai.ts
./lib/db/schema/billing.ts
./lib/db/schema/community.ts
./lib/db/schema/deload.ts
./lib/db/schema/exercises.ts
./lib/db/schema/index.ts
./lib/db/schema/presets.ts
./lib/db/schema/social.ts
./lib/db/schema/timer-sessions.ts
./lib/db/schema/users.ts
./lib/db/schema/weekly-reports.ts
./lib/db/schema/workouts.ts
./lib/deload/analysis.ts
./lib/home/utils.ts
./lib/legends/data.ts
./lib/legends/resolve.ts
./lib/mockData.ts
./lib/pdf/workoutPdf.ts
./lib/pro/helpers.ts
./lib/profile/context.tsx
./lib/telegram/haptic.ts
./lib/telegram/notify.ts
./lib/theme.ts
./lib/types.ts
./lib/ui-styles.ts
./lib/users/display.ts
./lib/utils/compressImage.ts
./lib/utils/muscleAggregator.ts
./lib/utils/muscleMapSvg.ts
./lib/utils/weeklyMuscleAnalysis.ts
./lib/workout/metrics.ts
./lib/workout/state.ts
./scripts/broadcast-v1.1.ts
./scripts/import-wger.ts
./scripts/seed-dev-user.ts
./scripts/update-exercise-images.ts
./scripts/verify-exercise-images.ts
./types/cache-life.d.ts
./types/routes.d.ts
./types/validator.ts
```

---

## 2. File-by-File Reference

### App Pages

#### `app/page.tsx`
- **Purpose:** Home dashboard — workout summary, stats, and CTAs
- **Key sections:** UserGreeting, RecoveryStatusCard (deload prompt), resume-draft card, 3-column stats grid (volume/workouts/sets), Best Lift card, WeeklyVolumeChart, LegendsWorkoutSlider, Last Workout card, DeloadPlanSheet modal
- **Calls:** `GET /api/workouts/stats`, `GET /api/workouts/weekly-volume`, `GET /api/workouts` (last), `GET /api/deload/status`

#### `app/layout.tsx`
- **Purpose:** Root HTML shell — metadata, Telegram SDK script, global providers, persistent UI
- **Renders:** `<Providers>` → `<LayoutShell>` → page, plus `<TabBar>`, `<AIChatWidget>`, `<ProGateTooltip>`, `<ProBannerModal>`
- **Exports:** default `RootLayout`

#### `app/layout-shell.tsx`
- **Purpose:** Max-width (480px) content container with responsive padding
- **Props:** `children: React.ReactNode`
- **Key behavior:** `/workout/*` routes get `paddingBottom: 24px`; all other routes get `paddingBottom: 80px` (for TabBar)

#### `app/providers.tsx`
- **Purpose:** Assembles the full provider tree
- **Provider order:** `AuthProvider → AuthGate → ProfileProvider → GlobalSheets (ProTrialOnboardingSheet) → OnboardingGate → WorkoutProvider`
- **Exports:** default `Providers`

#### `app/AppErrorBoundary.tsx`
- **Purpose:** Error boundary components
- **Exports:** `AppErrorBoundary` (full-page with retry), `SectionErrorBoundary` (inline fallback)

#### `app/account/page.tsx`
- **Purpose:** User settings — profile data, unit preferences, best lifts, injuries, presets, PRO card
- **Key sections:** Stats display, settings form (units/experience/goal/split/training days), best lifts, injuries, onboarding replay, `ProSubscriptionCard`, preset list with delete
- **Calls:** `GET /api/me/settings`, `PATCH /api/me/settings`, `GET /api/presets`, `DELETE /api/presets/[id]`, `GET /api/deload/status`, `POST /api/deload/restore`

#### `app/account/presets/new/page.tsx`
- **Purpose:** Create or edit a workout preset
- **Key features:** Preset name input, exercise picker modal, sortable exercise list (dnd-kit), save/update
- **Calls:** `GET /api/presets/[id]` (edit mode), `POST /api/presets`, `PATCH /api/presets/[id]`

#### `app/community/page.tsx`
- **Purpose:** Social feed — posts and public workouts
- **Key features:** Filter tabs (all/following/workouts/posts), like/comment on posts and workouts, preset preview cards, 5-minute client-side cache
- **Calls:** `GET /api/feed`, `POST /api/workouts/[id]/like`, `POST /api/community/posts/[id]/like`, `DELETE /api/community/posts/[id]`

#### `app/community/search/page.tsx`
- **Purpose:** Find and follow other users
- **Key features:** Debounced search (300ms), follow/unfollow toggle, "You" badge for self
- **Calls:** `GET /api/users/search?q=`, `POST /api/users/[id]/follow`

#### `app/exercises/page.tsx`
- **Purpose:** Browse and search exercise library
- **Key features:** Full-text search with debounce, muscle group filter chips, pagination ("Load more"), click to detail
- **Calls:** `GET /api/exercises?q=&category=&limit=&offset=`

#### `app/exercises/[id]/page.tsx`
- **Purpose:** Exercise detail — muscles, equipment, instructions, image
- **Calls:** `GET /api/exercises/[id]`

#### `app/history/page.tsx`
- **Purpose:** Recent workout history (last 3) + all-time stats
- **Calls:** `GET /api/workouts?limit=3`, `GET /api/workouts/stats`

#### `app/history/all/page.tsx`
- **Purpose:** Full paginated workout history (page size = 20)
- **Calls:** `GET /api/workouts?limit=20&offset=`

#### `app/history/[id]/page.tsx`
- **Purpose:** Full workout detail — exercises/sets, muscle map, AI report, PDF download, delete
- **Calls:** `GET /api/workouts/[id]`, `GET /api/ai/workout-report?workoutId=`, `DELETE /api/workouts/[id]`

#### `app/profile/[id]/page.tsx`
- **Purpose:** Public user profile — avatar, follower counts, workouts, follow button
- **Calls:** `GET /api/users/[id]/profile`, `POST /api/users/[id]/follow`

#### `app/start/page.tsx`
- **Purpose:** Workout start screen — empty workout or load from preset
- **Calls:** `GET /api/presets`

#### `app/workout/new/page.tsx`
- **Purpose:** Build workout plan before starting — name, add/reorder/remove exercises
- **Key state:** Uses `WorkoutContext` dispatch (`ADD_EXERCISE`, `REMOVE_EXERCISE`, `REORDER_EXERCISES`, `SET_NAME`, `START_SESSION`)

#### `app/workout/active/page.tsx`
- **Purpose:** Live workout tracking session
- **Key features:** Elapsed timer, active exercise display, set logging (weight/reps), rest timer, add exercise mid-workout, finish workout modal
- **Key state:** Uses `WorkoutContext` (`UPDATE_SET`, `TOGGLE_SET_COMPLETE`, `ADD_SET`, `REMOVE_SET`, `FINISH_EXERCISE`, `RESTORE_EXERCISE`, `CARDIO_*`)

#### `app/workout/summary/page.tsx`
- **Purpose:** Post-workout save screen — stats, photo upload, muscle map, AI report generation
- **Key state:** `savedWorkoutId`, `isPublic`, `photoUrl`, `aiReport`
- **Key functions:** `handleSave()`, `handlePhotoUpload()`, `generateAiReport()`
- **Calls:** `POST /api/workouts`, `PATCH /api/workouts/[id]`, `POST /api/upload/workout-photo`, `POST /api/ai/workout-report`

---

### API Routes

#### `app/api/health/route.ts`
- **GET** `/api/health` — Auth: none
- **Response:** `{ status: 'ok'|'degraded'|'error', timestamp: string, tables: { users: boolean, exercises: boolean, workouts: boolean } }`

#### `app/api/me/route.ts`
- **GET** `/api/me` — Auth: required
- **Response:** `{ data: MeResponse }` — `{ id, username, firstName, lastName, avatarUrl, isLinked, telegramUserId, isPro, proExpiresAt, trialEndsAt, trialUsed }`

#### `app/api/me/link/route.ts`
- **POST** `/api/me/link` — Auth: Telegram initData
- Verifies Telegram signature, creates/finds user, returns session token
- **Response:** `{ token: string, user: MeResponse }`

#### `app/api/me/settings/route.ts`
- **GET** `/api/me/settings` — Auth: required → returns `UserProfile`
- **PATCH** `/api/me/settings` — Auth: required → updates allowed fields (heightCm, weightKg, age, units, experienceLevel, goal, splitPreference, trainingDaysPerWeek, bestLifts, injuries) → returns updated `UserProfile`

#### `app/api/profile/route.ts`
- **GET** `/api/profile` — Auth: required → returns `UserProfile` (onboarding data)
- **PATCH** `/api/profile` — Auth: required → saves/updates profile → returns `UserProfile`

#### `app/api/exercises/route.ts`
- **GET** `/api/exercises` — Auth: optional
- **Query:** `q` (search), `category`, `limit` (default 50), `offset` (default 0), `names` (CSV), `myExercises` (boolean)
- **Response:** `{ data: DbExercise[], total: number, limit: number, offset: number }`

#### `app/api/exercises/[id]/route.ts`
- **GET** `/api/exercises/[id]` — Auth: none
- **Response:** `{ data: ExerciseDetail }`

#### `app/api/workouts/route.ts`
- **GET** `/api/workouts` — Auth: required → `{ data: WorkoutListItem[], total, limit, offset }`
- **POST** `/api/workouts` — Auth: required → Body: `SaveWorkoutRequest` → `{ data: SaveWorkoutResponse }`

#### `app/api/workouts/[id]/route.ts`
- **GET** `/api/workouts/[id]` — Auth: required → `{ data: WorkoutDetail }`
- **PATCH** `/api/workouts/[id]` — Auth: required (owner only) → Body: `{ isPublic?: boolean, photoUrl?: string|null }` → updated fields
- **DELETE** `/api/workouts/[id]` — Auth: required (owner only) → `{ success: true }`

#### `app/api/workouts/[id]/like/route.ts`
- **POST** `/api/workouts/[id]/like` — Auth: required → toggles like → `{ liked: boolean }`

#### `app/api/workouts/[id]/comments/route.ts`
- **GET** `/api/workouts/[id]/comments` → `WorkoutCommentRow[]`
- **POST** `/api/workouts/[id]/comments` — Auth: required → Body: `{ text: string }` → created comment

#### `app/api/workouts/[id]/exercises/route.ts`
- **GET** `/api/workouts/[id]/exercises` → exercise array for workout detail

#### `app/api/workouts/[id]/exercises/[weId]/route.ts`
- **PATCH** `/api/workouts/[id]/exercises/[weId]` — Auth: required → updates workout exercise (status, order)

#### `app/api/workouts/[id]/export/route.ts`
- **GET** `/api/workouts/[id]/export` — Auth: required → streams PDF file

#### `app/api/workouts/[id]/send-pdf/route.ts`
- **POST** `/api/workouts/[id]/send-pdf` — Auth: required → generates PDF and sends via Telegram bot message

#### `app/api/workouts/last-sets/route.ts`
- **GET** `/api/workouts/last-sets` — Auth: required → Query: `exerciseIds` (CSV) → `{ [exerciseId]: LastSet[] }`

#### `app/api/workouts/stats/route.ts`
- **GET** `/api/workouts/stats` — Auth: required → `{ total: number, totalVolume: number, totalSets: number }`

#### `app/api/workouts/weekly-volume/route.ts`
- **GET** `/api/workouts/weekly-volume` — Auth: required → `{ data: { day: string, value: number }[] }`

#### `app/api/presets/route.ts`
- **GET** `/api/presets` — Auth: required → `Preset[]`
- **POST** `/api/presets` — Auth: required → free limit: 3, Pro: unlimited → Body: `{ name: string, exerciseIds: string[] }` → `Preset`

#### `app/api/presets/[id]/route.ts`
- **GET** `/api/presets/[id]` → `Preset`
- **PATCH** `/api/presets/[id]` — Auth: required (owner) → Body: `{ name?, exerciseIds? }` → updated `Preset`
- **DELETE** `/api/presets/[id]` — Auth: required (owner)

#### `app/api/presets/[id]/save/route.ts`
- **POST** `/api/presets/[id]/save` — Auth: required → saves a copy of another user's preset for current user

#### `app/api/feed/route.ts`
- **GET** `/api/feed` — Auth: required
- **Query:** `limit` (20), `offset` (0), `filter` (all|following), `type` (all|post|workout)
- **Response:** `{ data: FeedItem[], total, limit, offset }`

#### `app/api/community/posts/route.ts`
- **POST** `/api/community/posts` — Auth: required → Body: `{ text?: string, photoUrl?: string, presetId?: string }` → `{ id, createdAt }`

#### `app/api/community/posts/[id]/route.ts`
- **GET** `/api/community/posts/[id]` → post detail
- **PATCH** `/api/community/posts/[id]` — Auth: required (owner)
- **DELETE** `/api/community/posts/[id]` — Auth: required (owner)

#### `app/api/community/posts/[id]/like/route.ts`
- **POST** `/api/community/posts/[id]/like` — Auth: required → toggles like → `{ liked: boolean }`

#### `app/api/community/posts/[id]/comments/route.ts`
- **GET** → comment array
- **POST** — Auth: required → Body: `{ text: string }` → created comment

#### `app/api/community/presets/[presetId]/route.ts`
- **GET** `/api/community/presets/[presetId]` → preset detail for community preview

#### `app/api/users/search/route.ts`
- **GET** `/api/users/search?q=` → `UserSearchHit[]`

#### `app/api/users/[id]/profile/route.ts`
- **GET** `/api/users/[id]/profile` → `PublicProfileData`

#### `app/api/users/[id]/follow/route.ts`
- **POST** `/api/users/[id]/follow` — Auth: required → toggles follow → `{ following: boolean }`

#### `app/api/progress/exercises/route.ts`
- **GET** `/api/progress/exercises` — Auth: required → list of exercises with progress data

#### `app/api/progress/exercises/[id]/route.ts`
- **GET** `/api/progress/exercises/[id]` — Auth: required → detailed progress history for one exercise

#### `app/api/ai/chat/route.ts`
- **POST** `/api/ai/chat` — Auth: required + Pro → Body: `{ message: string }` → `{ reply: string, preset?: EnrichedPresetPayload }`
- Saves message history to `aiMessages`; can trigger preset generation via intent detection

#### `app/api/ai/chat/history/route.ts`
- **GET** `/api/ai/chat/history` — Auth: required → returns `aiMessages` for user

#### `app/api/ai/workout-report/route.ts`
- **GET** `/api/ai/workout-report?workoutId=` — Auth: required + Pro → returns cached report from `aiWorkoutReports`
- **POST** `/api/ai/workout-report` — Auth: required + Pro → Body: `{ workoutId: string }` → generates + stores report → `{ report: string, scores: AiWorkoutReportScores }`

#### `app/api/billing/stars/route.ts`
- **POST** `/api/billing/stars` — Telegram Stars payment handler → updates `isPro` / `proExpiresAt`

#### `app/api/trial/activate/route.ts`
- **POST** `/api/trial/activate` — Auth: required → activates 7-day free trial, sets `trialEndsAt`, `trialUsed = true`

#### `app/api/promo/redeem/route.ts`
- **POST** `/api/promo/redeem` — Auth: required → Body: `{ code: string }` → validates + records in `promoRedemptions`, grants Pro

#### `app/api/deload/status/route.ts`
- **GET** `/api/deload/status` — Auth: required → returns recovery recommendation (cached or freshly generated)

#### `app/api/deload/plan/route.ts`
- **POST** `/api/deload/plan` — Auth: required + Pro → generates AI deload plan, stores in `deloadRecommendations`

#### `app/api/deload/dismiss/route.ts`
- **POST** `/api/deload/dismiss` — Auth: required → increments `deloadDismissCount`, sets `deloadHidden`

#### `app/api/deload/restore/route.ts`
- **POST** `/api/deload/restore` — Auth: required → clears `deloadHidden`

#### `app/api/timer/arm/route.ts`
- **POST** `/api/timer/arm` — Auth: required → Body: `{ workoutId, durationMs }` → creates `timerSessions` row → `{ sessionId }`

#### `app/api/timer/pause/route.ts`
- **POST** `/api/timer/pause` — Auth: required → Body: `{ sessionId }` → sets `paused=true`, stores `remainingMs`

#### `app/api/timer/resume/route.ts`
- **POST** `/api/timer/resume` — Auth: required → Body: `{ sessionId }` → recalculates `endsAt`, clears `paused`

#### `app/api/timer/update/route.ts`
- **POST** `/api/timer/update` — Auth: required → Body: `{ sessionId, endsAt }` → updates timer end time

#### `app/api/timer/fire/route.ts`
- **POST** `/api/timer/fire` — Auth: required → fires timer notification via Telegram bot, sets `notified=true`

#### `app/api/timer/cleanup/route.ts`
- **POST** `/api/timer/cleanup` — Auth: required → Body: `{ sessionId }` → deletes timer session

#### `app/api/timer/cron/route.ts`
- **POST** `/api/timer/cron` — No auth (Vercel cron) → fires all expired non-notified timer sessions

#### `app/api/cron/weekly-report/route.ts`
- **GET** `/api/cron/weekly-report` — Auth: `x-cron-secret` header → sends weekly fitness report to all eligible users via Telegram; free users get text+PRO upsell button, PRO users get muscle map PNG + AI analysis caption

#### `app/api/upload/workout-photo/route.ts`
- **POST** `/api/upload/workout-photo` — Auth: required → multipart form with `file` → uploads to Vercel Blob → `{ photoUrl: string }`

#### `app/api/telegram/webhook/route.ts`
- **POST** `/api/telegram/webhook` — Telegram Bot API webhook → handles incoming messages/callbacks

---

### Components

#### `components/AIChatWidget.tsx`
- **Purpose:** Floating AI coach chat button + chat drawer
- **Key behavior:** Only visible to Pro users; toggles open/close; sends messages via `POST /api/ai/chat`; displays assistant reply + optional preset cards

#### `components/AIReportWithGate.tsx`
- **Purpose:** PRO gate wrapper for `AIWorkoutReportCard`
- **Props:** same as `AIWorkoutReportCard` + `isPro: boolean`
- **Key behavior:** Non-Pro users see blurred content + upgrade/trial CTA overlay

#### `components/AIWorkoutReportCard.tsx`
- **Purpose:** Displays AI workout analysis with score breakdown
- **Props:** `report: string, scores: AiWorkoutReportScores, workoutId: string`
- **Key behavior:** Shows score bars (volume/intensity/consistency/duration/PR bonus), expandable text report

#### `components/AuthGate.tsx`
- **Purpose:** Blocks render until auth resolves; shows loading or error state
- **Key behavior:** Renders children when `status === 'authenticated'`; shows spinner on `loading`; shows error UI on `unauthenticated`

#### `components/Button.tsx`
- **Purpose:** Primary reusable button
- **Props:** `variant: 'primary'|'secondary'|'ghost'|'danger'`, `size: 'xs'|'sm'|'md'|'lg'`, `fullWidth?: boolean`, `loading?: boolean`, `disabled?: boolean`, `onClick`, `children`

#### `components/Card.tsx`
- **Purpose:** Styled surface card container
- **Props:** `children`, `onClick?`, `style?`, `className?`

#### `components/CardioExerciseCard.tsx`
- **Purpose:** Active exercise card for cardio type — timer start/stop, param inputs (speed, incline, RPM, resistance, split pace)
- **Props:** `workoutExercise: WorkoutExercise`, `timerState: CardioTimerState`, `dispatch`

#### `components/CommunityCommentsSheet.tsx`
- **Purpose:** Bottom sheet showing comment thread for a post or workout; allows adding a new comment
- **Props:** `type: 'post'|'workout'`, `id: string`, `isOpen: boolean`, `onClose: () => void`
- **Calls:** `GET /api/workouts/[id]/comments` or `GET /api/community/posts/[id]/comments`, `POST` on same

#### `components/CommunityPresetPreview.tsx`
- **Purpose:** Preview card for a workout preset shared in a community post
- **Props:** `preset: FeedPostPresetSummary`, `onSave?: () => void`, `savedByMe: boolean`
- **Key behavior:** Shows exercise list + muscle summary; "Save" button calls `POST /api/presets/[id]/save`

#### `components/CreatePostSheet.tsx`
- **Purpose:** Bottom sheet for creating a new community post (text, photo, or preset share)
- **Props:** `isOpen: boolean`, `onClose: () => void`, `onCreated: () => void`
- **Calls:** `POST /api/community/posts`, `POST /api/upload/workout-photo`

#### `components/DeloadPlanSheet.tsx`
- **Purpose:** Bottom sheet showing deload recommendation with optional AI plan
- **Props:** `isOpen: boolean`, `onClose: () => void`, `status: DeloadStatus`
- **Calls:** `POST /api/deload/plan`, `POST /api/deload/dismiss`

#### `components/DownloadWorkoutButton.tsx`
- **Purpose:** Button that triggers workout PDF export or Telegram PDF send
- **Props:** `workoutId: string`
- **Calls:** `GET /api/workouts/[id]/export` or `POST /api/workouts/[id]/send-pdf`

#### `components/EmptyStatsOverlay.tsx`
- **Purpose:** Overlay shown when user has no workout data yet; prompts to start first workout
- **Props:** none significant

#### `components/ExerciseCard.tsx`
- **Purpose:** Exercise list item — name, muscle group badge, equipment tag, optional image
- **Props:** `exercise: Exercise`, `onClick?: () => void`, `selected?: boolean`

#### `components/ExerciseInfoSheet.tsx`
- **Purpose:** Bottom sheet with full exercise detail (muscles, instructions, image)
- **Props:** `exercise: Exercise | ExerciseDetail`, `isOpen: boolean`, `onClose: () => void`

#### `components/ExercisePicker.tsx`
- **Purpose:** Modal for selecting exercises — search, muscle group filter, scrollable list
- **Props:** `isOpen: boolean`, `onClose: () => void`, `onSelect: (exercise: Exercise) => void`, `excludeIds?: string[]`
- **Calls:** `GET /api/exercises`

#### `components/Header.tsx`
- **Purpose:** Top header with user greeting and optional streak badge
- **Props:** `user: MeResponse | null`

#### `components/HistoryProgressSection.tsx`
- **Purpose:** Progress chart section in workout history showing exercise PRs over time
- **Calls:** `GET /api/progress/exercises`

#### `components/LegendsWorkoutCard.tsx`
- **Purpose:** Hero card for a "legendary" featured workout (template from `lib/legends/`)
- **Props:** `legend: LegendWorkout`

#### `components/LegendsWorkoutSlider.tsx`
- **Purpose:** Horizontal scrolling carousel of `LegendsWorkoutCard` items

#### `components/LineChart.tsx`
- **Purpose:** SVG line chart for progress data
- **Props:** `data: { x: string, y: number }[]`, `width?: number`, `height?: number`, `color?: string`

#### `components/Modal.tsx`
- **Purpose:** Fixed overlay modal with backdrop dismiss and escape key close
- **Props:** `isOpen: boolean`, `onClose: () => void`, `title?: string`, `children`

#### `components/MuscleMap.tsx`
- **Purpose:** Body heatmap visualization using `react-body-highlighter`
- **Props:** `primaryMuscles: string[]`, `secondaryMuscles?: string[]`

#### `components/MuscleMapLazy.tsx`
- **Purpose:** Lazy-loaded wrapper for `MuscleMap` (avoids SSR issues with `react-body-highlighter`)

#### `components/MuscleMapWithGate.tsx`
- **Purpose:** PRO gate wrapper for `MuscleMap`
- **Props:** same as `MuscleMap` + `isPro: boolean`
- **Key behavior:** Non-Pro users see blurred map + upgrade overlay

#### `components/OnboardingGate.tsx`
- **Purpose:** Redirects unauthenticated or non-onboarded users to `/start` flow
- **Key behavior:** Checks `hasCompletedOnboarding` from `useProfile()`; renders `OnboardingWizard` if needed

#### `components/OnboardingWizard.tsx`
- **Purpose:** Multi-step first-time setup form (units, experience level, goal, split, training days)
- **Calls:** `PATCH /api/profile` on completion

#### `components/ProBannerModal.tsx`
- **Purpose:** Promotional modal shown every 15 app launches to non-Pro users
- **Key behavior:** Uses `localStorage` counter; shows PRO feature highlights + upgrade/trial CTAs

#### `components/ProGateTooltip.tsx`
- **Purpose:** Tooltip shown when free user taps a PRO-locked feature
- **Props:** `children`, `feature?: string`
- **Key behavior:** Shows upgrade button → `router.push('/account#pro')`

#### `components/ProLockBadge.tsx`
- **Purpose:** Small "PRO" badge rendered on locked features
- **Props:** `size?: 'sm'|'md'`

#### `components/ProSubscriptionCard.tsx`
- **Purpose:** PRO subscription management — status display, trial activation, promo code redemption, Telegram Stars billing
- **Calls:** `POST /api/trial/activate`, `POST /api/promo/redeem`, `POST /api/billing/stars`

#### `components/ProTrialOnboardingSheet.tsx`
- **Purpose:** Celebration bottom sheet shown immediately after trial activation
- **Props:** `isOpen: boolean`, `onClose: () => void`, `trialEndsAt: string`

#### `components/ProgressCard.tsx`
- **Purpose:** Card showing personal record progress for a single exercise with line chart
- **Props:** `exerciseId: string`, `exerciseName: string`

#### `components/RecoveryStatusCard.tsx`
- **Purpose:** Home page card showing training recovery status and deload recommendation
- **Props:** `status: DeloadStatus`, `onViewPlan: () => void`

#### `components/RestTimer.tsx`
- **Purpose:** Rest timer with countdown, pause/resume, custom duration, Telegram notification support
- **Props:** `defaultDuration?: number`
- **Calls:** `POST /api/timer/arm`, `POST /api/timer/pause`, `POST /api/timer/resume`, `POST /api/timer/fire`, `POST /api/timer/cleanup`

#### `components/SetRow.tsx`
- **Purpose:** Single set input row (weight input, reps input, complete toggle, remove button)
- **Props:** `set: WorkoutSet`, `setIndex: number`, `exerciseEntryId: string`, `measurementType`, `dispatch`

#### `components/Skeleton.tsx`
- **Purpose:** Loading placeholder with shimmer animation
- **Props:** `width?: string|number`, `height?: string|number`, `borderRadius?: string`

#### `components/SortableExerciseCard.tsx`
- **Purpose:** Drag-and-drop exercise card in preset/workout builder using `@dnd-kit/sortable`
- **Props:** `exercise: WorkoutExercise`, `onRemove: () => void`, `dragHandle?: boolean`

#### `components/StatCard.tsx`
- **Purpose:** Single stat display card (label + value)
- **Props:** `label: string`, `value: string|number`, `icon?: ReactNode`

#### `components/TabBar.tsx`
- **Purpose:** Bottom navigation bar — Home, History, Community, Account tabs
- **Key behavior:** Highlights active tab based on pathname; hidden on `/workout/*` routes

#### `components/UserGreeting.tsx`
- **Purpose:** Greeting header with user name and avatar
- **Props:** `user: MeResponse | null`

#### `components/WeeklyVolumeChart.tsx`
- **Purpose:** Bar/line chart of workout volume over past 7 days
- **Calls:** `GET /api/workouts/weekly-volume`

#### `components/WorkoutCard.tsx`
- **Purpose:** Workout list item card — name, date, duration, volume, sets count
- **Props:** `workout: WorkoutListItem`, `onClick?: () => void`

#### `components/WorkoutExerciseCard.tsx`
- **Purpose:** Exercise detail row in workout history/detail view
- **Props:** `exercise: WorkoutDetailExercise`

#### `components/WorkoutLogExerciseRow.tsx`
- **Purpose:** Compact exercise row in the community feed workout log
- **Props:** `line: FeedWorkoutLogLine`

#### `components/ai/AiPresetCards.tsx`
- **Purpose:** Renders generated preset options returned by AI chat; allows loading into workout
- **Props:** `preset: EnrichedPresetPayload`, `onLoad: () => void`

---

### Lib Files

#### `lib/types.ts`
- **Exports (client-side types):**
  - `User` — id, name, weight, height, age, goal, experienceLevel, units, streak
  - `Exercise` — id, name, muscleGroups, primaryMuscles?, secondaryMuscles?, equipment, description?, howTo?, imageUrl?, measurementType?
  - `MuscleGroup` — `'Chest'|'Back'|'Legs'|'Shoulders'|'Arms'|'Core'`
  - `WorkoutSet` — id, weight, reps, completed, createdAt
  - `ExerciseStatus` — `'pending'|'completed'`
  - `WorkoutExercise` — id, exerciseId, exerciseName, muscleGroups, primaryMuscles?, secondaryMuscles?, equipment, order, sets, status, measurementType?
  - `Workout` — id, name, date, startedAt, endedAt, exercises, totalVolume, duration, improvement
  - `WorkoutStatus` — `'planning'|'active'|'finished'`
  - `CardioTimerState` — startedAt (ms|null), elapsed (sec), params (Record<string, number>)
  - `WorkoutDraft` — id, name, status, startedAt, endedAt, exercises, activeExerciseId, cardioTimers
  - `WeeklyDataPoint` — day, value
  - `OverviewStats` — totalWorkouts, totalVolume, prCount
  - `TimePeriod`, `TabId`

#### `lib/api/types.ts`
- **Exports (API contract types):**
  - `CardioData` — durationSec, speed?, incline?, resistance?, rpm?, splitMin?, splitSec?
  - `SaveWorkoutSetPayload`, `SaveWorkoutExercisePayload`, `SaveWorkoutRequest`, `SaveWorkoutResponse`
  - `WorkoutListItem`, `WorkoutDetailSet`, `LastSet`, `WorkoutDetailExercise`, `WorkoutDetail`
  - `ExerciseDetail`
  - `Preset`
  - `FeedWorkoutLogLine`, `FeedCommentPreview`, `FeedWorkoutItem`, `FeedPresetExercisePreview`, `FeedPostPresetSummary`, `FeedPostItem`
  - `FeedItem` — union of `FeedWorkoutItem | FeedPostItem`
  - `UserSearchHit`, `PublicProfileWorkout`, `PublicProfileData`
  - `WorkoutCommentRow`

#### `lib/api/client.ts`
- **Exports (API client functions):**
  - Exercises: `searchExercisesApi()`, `searchExercisesRaw()`, `fetchExerciseDetailApi()`, `fetchExercisesByIds()`
  - Workouts: `saveWorkoutApi()`, `fetchWorkoutsApi()`, `fetchWorkoutDetailApi()`, `fetchWorkoutStatsApi()`, `fetchWeeklyVolumeApi()`, `deleteWorkoutApi()`, `updateWorkoutApi()`
  - Presets: `fetchPresetsApi()`, `createPresetApi()`, `updatePresetApi()`, `deletePresetApi()`, `savePresetCopyApi()`
  - Community: `fetchFeedApi()`, `toggleWorkoutLikeApi()`, `togglePostLikeApi()`, `deleteCommunityPostApi()`, `fetchWorkoutCommentsApi()`, `createWorkoutCommentApi()`, `fetchPostCommentsApi()`, `createPostCommentApi()`
  - Users: `searchUsersApi()`, `toggleFollowApi()`, `fetchPublicProfileApi()`
  - AI: `fetchAiWorkoutReportApi()`, `postAiWorkoutReportApi()`, `sendChatMessageApi()`, `fetchChatHistoryApi()`
  - Profile: `fetchMe()`, `linkAccount()`, `fetchMeProApi()`, `fetchProfileApi()`, `saveProfileApi()`, `updateProfileApi()`
  - Timer: `armTimerApi()`, `pauseTimerApi()`, `resumeTimerApi()`, `updateTimerApi()`, `fireTimerApi()`, `cleanupTimerApi()`
  - Upload: `uploadWorkoutPhotoApi()`

#### `lib/api/validate.ts`
- **Purpose:** Request body validation helpers used in API routes
- **Exports:** `validateBody()`, field validators

#### `lib/api/exportWorkout.ts`
- **Purpose:** Formats workout data for PDF export
- **Exports:** `formatWorkoutForExport()`

#### `lib/apiClient.ts`
- **Purpose:** Low-level fetch wrapper with auth headers injection
- **Exports:** `apiClient` (fetch wrapper), `getHeaders()`

#### `lib/auth/context.tsx`
- **Purpose:** Telegram auth context — polls SDK, fetches user, handles linking
- **Exports:** `AuthProvider`, `useAuth()`
- **Context shape:** `{ status: AuthStatus, user: MeResponse|null, isLinked: boolean, isTelegram: boolean, refetch(), link(), errorMessage }`
- **Auth statuses:** `'loading' | 'authenticated' | 'unauthenticated'`

#### `lib/auth/client.ts`
- **Purpose:** Telegram WebApp SDK wrappers
- **Exports:** `callTelegramReady()`, `getTelegramInitData()`, `getTelegramUser()`, `getAuthHeaders()`

#### `lib/auth/helpers.ts`
- **Purpose:** Server-side request authentication middleware
- **Exports:** `authenticateRequest(req)` → returns `{ userId }` or throws 401

#### `lib/auth/telegram.ts`
- **Purpose:** Validates Telegram `initData` HMAC signature
- **Exports:** `verifyTelegramInitData(initData, botToken)` → boolean

#### `lib/profile/context.tsx`
- **Purpose:** User profile + PRO status context
- **Exports:** `ProfileProvider`, `useProfile()`
- **Context shape:**
  ```ts
  {
    profile: UserProfile | null
    isLoading: boolean
    hasCompletedOnboarding: boolean
    isPro: boolean
    proExpiresAt: string | null
    trialEndsAt: string | null
    trialUsed: boolean
    refetch(): Promise<void>
    refreshProfile(): Promise<void>
    saveProfile(data: OnboardingData): Promise<void>
    updateProfile(data: ProfileUpdatePayload): Promise<void>
    showTrialOnboarding: boolean
    trialOnboardingEndsAt: string | null
    dismissTrialOnboarding(): void
    triggerTrialOnboarding(endsAt: string): void
  }
  ```

#### `lib/workout/state.ts`
- **Purpose:** Workout draft state management via `useReducer`
- **Exports:** `WorkoutProvider`, `useWorkout()`
- **Context shape:** `{ draft: WorkoutDraft, dispatch, savedWorkouts, saveWorkoutToHistory(), hasDraft }`
- **Actions:** `LOAD_DRAFT`, `RESET_DRAFT`, `SET_NAME`, `ADD_EXERCISE`, `REMOVE_EXERCISE`, `REORDER_EXERCISES`, `ADD_SET`, `UPDATE_SET`, `TOGGLE_SET_COMPLETE`, `REMOVE_SET`, `START_SESSION`, `FINISH_SESSION`, `SET_ACTIVE_EXERCISE`, `FINISH_EXERCISE`, `RESTORE_EXERCISE`, `CARDIO_INIT`, `CARDIO_START`, `CARDIO_STOP`, `CARDIO_SET_PARAM`
- **Persistence:** Draft auto-saved to `localStorage` key `nextrep_workout_draft`

#### `lib/workout/metrics.ts`
- **Exports:** `generateId()`, `defaultWorkoutName()`, `createEmptySet()`, `createPrefilledSet()`, `computeTotalVolume()`, `computeDuration()`, `computeImprovementMock()`, `getNextPendingExerciseId()`

#### `lib/ai/openai.ts`
- **Purpose:** OpenAI API client setup and low-level completion helpers
- **Exports:** `openai` (OpenAI client instance), `createChatCompletion()`

#### `lib/ai/coachContext.ts`
- **Purpose:** Builds system prompt for AI coach using user profile + workout history
- **Exports:** `buildCoachSystemPrompt(userId)`

#### `lib/ai/workoutScore.ts`
- **Purpose:** Calculates workout score (0-100) across 5 dimensions
- **Exports:** `scoreWorkout(workoutData)` → `{ total, volume, intensity, consistency, duration, prBonus }`

#### `lib/ai/workoutScoreContext.ts`
- **Purpose:** Builds context object from DB data for workout scoring
- **Exports:** `buildWorkoutScoreContext(workoutId, userId)`

#### `lib/ai/presetGeneration.ts`
- **Purpose:** Generates a workout preset from AI response
- **Exports:** `generatePresetFromDescription(description, userId)` → `EnrichedPresetPayload`

#### `lib/ai/presetIntent.ts`
- **Purpose:** Detects if a user message is requesting a preset
- **Exports:** `detectPresetIntent(message)` → boolean

#### `lib/ai/exerciseSuggestions.ts`
- **Purpose:** Matches AI-suggested exercise names to DB exercise IDs
- **Exports:** `resolveExerciseIds(names: string[])` → `string[]`

#### `lib/community/feed-queries.ts`
- **Purpose:** DB queries for building the community feed (workouts + posts merged, with likes/comments)
- **Exports:** `fetchFeedItems()`, `fetchFollowingFeedItems()`, `mergeFeedItems()`

#### `lib/community/time.ts`
- **Purpose:** Human-readable relative time formatting for feed
- **Exports:** `timeAgo(date: string|Date)` → `string`

#### `lib/community/workoutPr.ts`
- **Purpose:** Detects PRs (personal records) in a saved workout
- **Exports:** `detectWorkoutPrs(workoutId, userId)` → `boolean`

#### `lib/community/preset-exercise-preview.ts`
- **Purpose:** Fetches exercise details for preset preview in feed
- **Exports:** `buildPresetExercisePreview(exerciseIds)` → `FeedPresetExercisePreview[]`

#### `lib/deload/analysis.ts`
- **Purpose:** Analyzes recent training volume to generate deload recommendation
- **Exports:** `analyzeDeloadNeed(userId)` → `{ status, signals, weeklyVolumes }`

#### `lib/pro/helpers.ts`
- **Purpose:** Server-side PRO status check
- **Exports:** `checkIsPro(userId)` → `boolean`, `getProStatus(userId)` → `{ isPro, proExpiresAt, trialEndsAt, trialUsed }`

#### `lib/pdf/workoutPdf.ts`
- **Purpose:** Generates PDF from workout data using `pdfkit`
- **Exports:** `generateWorkoutPdf(workout)` → `Buffer`

#### `lib/db/index.ts`
- **Purpose:** Drizzle ORM database connection (Neon serverless)
- **Exports:** `db` (Drizzle client instance)

#### `lib/db/schema/index.ts`
- **Purpose:** Re-exports all schema tables
- **Exports:** all tables from users, workouts, exercises, presets, community, social, ai, billing, deload, timer-sessions

#### `lib/theme.ts`
- **Purpose:** Design token constants
- **Exports:** `colors`, `spacing`, `radius`, `font`
- **Key colors:** `bgPrimary: '#0E1114'`, `surface: '#161B20'`, `card: '#1C2228'`, `border: '#262E36'`, `primary: '#1F8A5B'`, `textPrimary: '#F3F4F6'`, `textSecondary: '#9CA3AF'`

#### `lib/ui-styles.ts`
- **Purpose:** Shared inline style objects for common UI patterns
- **Exports:** `cardStyle`, `inputStyle`, `labelStyle`, etc.

#### `lib/cardio-params.ts`
- **Purpose:** Configuration for cardio exercise parameter inputs (labels, units, ranges)
- **Exports:** `CARDIO_PARAMS` config object

#### `lib/users/display.ts`
- **Purpose:** User display name formatting
- **Exports:** `displayName(user)` → `string`

#### `lib/utils/compressImage.ts`
- **Purpose:** Client-side image compression before upload
- **Exports:** `compressImage(file: File, maxWidthPx?: number, quality?: number)` → `Promise<Blob>`

#### `lib/utils/muscleAggregator.ts`
- **Purpose:** Aggregates muscle group data from exercises for heatmap
- **Exports:** `aggregateMuscles(exercises)` → `{ primary: string[], secondary: string[] }`

#### `lib/home/utils.ts`
- **Purpose:** Home page data transformation helpers
- **Exports:** `formatVolume()`, `getGreeting()`, `getBestLift()`

#### `lib/legends/data.ts`
- **Purpose:** Static data for featured "legendary" workout templates
- **Exports:** `LEGEND_WORKOUTS: LegendWorkout[]`

#### `lib/legends/resolve.ts`
- **Purpose:** Resolves legend workout exercise names to DB IDs
- **Exports:** `resolveLegendExercises(legend)`

#### `lib/telegram/haptic.ts`
- **Purpose:** Telegram WebApp haptic feedback wrappers
- **Exports:** `hapticImpact()`, `hapticNotification()`, `hapticSelection()`

#### `lib/telegram/notify.ts`
- **Purpose:** Sends Telegram Bot API messages (used for timer notifications)
- **Exports:** `sendTelegramMessage(telegramUserId, text)` → `Promise<number>` (message ID)

#### `lib/mockData.ts`
- **Purpose:** Development mock data (not used in production)

---

## 3. DB Schema Summary

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `telegram_user_id` | VARCHAR(64) UNIQUE | |
| `username` | VARCHAR(128) | |
| `first_name` | VARCHAR(128) | |
| `last_name` | VARCHAR(128) | |
| `avatar_url` | TEXT | Telegram photo_url |
| `is_linked` | BOOLEAN | default false |
| `created_at` | TIMESTAMP TZ | |
| `updated_at` | TIMESTAMP TZ | auto-updated |

### `user_profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID UNIQUE FK → users | cascade delete |
| `height_cm` | INTEGER | |
| `weight_kg` | NUMERIC(5,1) | |
| `age` | INTEGER | |
| `units` | ENUM('kg','lb') | default 'kg' |
| `experience_level` | ENUM('beginner','intermediate','advanced') | |
| `goal` | ENUM('muscle_growth','strength','endurance','weight_loss','general_fitness') | |
| `split_preference` | VARCHAR(32) | |
| `training_days_per_week` | INTEGER | |
| `best_lifts` | JSONB | `{ benchPress?, squat?, deadlift? }` |
| `injuries` | JSONB | `string[]` |
| `onboarding_completed` | BOOLEAN | default false |
| `is_pro` | BOOLEAN | default false |
| `pro_expires_at` | TIMESTAMP TZ | |
| `pro_source` | VARCHAR(32) | |
| `trial_ends_at` | TIMESTAMP TZ | |
| `trial_used` | BOOLEAN | default false |
| `deload_dismiss_count` | INTEGER | default 0 |
| `deload_hidden` | BOOLEAN | default false |
| `created_at` | TIMESTAMP TZ | |
| `updated_at` | TIMESTAMP TZ | auto-updated |

### `exercises`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `source` | ENUM('wger','custom') | default 'wger' |
| `source_id` | INTEGER | WGER exercise ID |
| `name` | VARCHAR(256) | |
| `description` | TEXT | |
| `how_to` | TEXT | |
| `primary_muscles` | JSONB | `string[]` |
| `secondary_muscles` | JSONB | `string[]` |
| `equipment` | JSONB | `string[]` |
| `category` | VARCHAR(64) | |
| `measurement_type` | ENUM('weight_reps','reps_only','time','cardio') | default 'weight_reps' |
| `image_url` | TEXT | |
| `images` | JSONB | `string[]` |
| `created_at` | TIMESTAMP TZ | |
| `updated_at` | TIMESTAMP TZ | auto-updated |

### `workouts`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `name` | VARCHAR(256) | |
| `started_at` | TIMESTAMP TZ | |
| `ended_at` | TIMESTAMP TZ | |
| `duration_sec` | INTEGER | |
| `total_volume` | NUMERIC(10,1) | |
| `total_sets` | INTEGER | |
| `notes` | TEXT | |
| `is_public` | BOOLEAN | default true |
| `photo_url` | TEXT | |
| `created_at` | TIMESTAMP TZ | |

### `workout_exercises`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `workout_id` | UUID FK → workouts | cascade delete |
| `exercise_id` | UUID FK → exercises | restrict delete |
| `order` | INTEGER | |
| `status` | ENUM('pending','completed') | default 'pending' |
| `created_at` | TIMESTAMP TZ | |

### `workout_sets`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `workout_exercise_id` | UUID FK → workout_exercises | cascade delete |
| `set_index` | INTEGER | |
| `weight` | NUMERIC(7,2) | null for reps/cardio |
| `reps` | INTEGER | |
| `seconds` | INTEGER | for time-based |
| `completed` | BOOLEAN | default false |
| `cardio_data` | JSONB | `{ durationSec, speed?, incline?, resistance?, rpm?, splitMin?, splitSec? }` |
| `created_at` | TIMESTAMP TZ | |

### `workout_presets`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `name` | VARCHAR(256) | |
| `exercise_ids` | JSONB | `string[]` default [] |
| `saved_from_preset_id` | UUID FK → workout_presets | set null on delete |
| `created_at` | TIMESTAMP TZ | |
| `updated_at` | TIMESTAMP TZ | |

### `community_posts`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `text` | TEXT | nullable |
| `photo_url` | TEXT | nullable |
| `preset_id` | UUID FK → workout_presets | set null on delete |
| `created_at` | TIMESTAMP TZ | |

### `post_likes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `post_id` | UUID FK → community_posts | cascade delete |
| `created_at` | TIMESTAMP TZ | |
| UNIQUE | (user_id, post_id) | |

### `post_comments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `post_id` | UUID FK → community_posts | cascade delete |
| `text` | VARCHAR(280) | |
| `created_at` | TIMESTAMP TZ | |

### `follows`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `follower_id` | UUID FK → users | cascade delete |
| `following_id` | UUID FK → users | cascade delete |
| `created_at` | TIMESTAMP TZ | |
| UNIQUE | (follower_id, following_id) | |

### `workout_likes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `workout_id` | UUID FK → workouts | cascade delete |
| `created_at` | TIMESTAMP TZ | |
| UNIQUE | (user_id, workout_id) | |

### `workout_comments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `workout_id` | UUID FK → workouts | cascade delete |
| `text` | VARCHAR(280) | |
| `created_at` | TIMESTAMP TZ | |

### `ai_messages`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `role` | VARCHAR(16) | 'user' or 'assistant' |
| `content` | TEXT | |
| `created_at` | TIMESTAMP TZ | |

### `ai_workout_reports`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `workout_id` | UUID FK → workouts | cascade delete |
| `report` | TEXT | full markdown report |
| `score` | INTEGER | total 0-100 |
| `volume_score` | INTEGER | |
| `intensity_score` | INTEGER | |
| `consistency_score` | INTEGER | |
| `duration_score` | INTEGER | |
| `pr_bonus` | INTEGER | |
| `created_at` | TIMESTAMP TZ | |
| UNIQUE | (user_id, workout_id) | one report per workout |

### `promo_redemptions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `code_hash` | VARCHAR(128) | hashed promo code |
| `redeemed_at` | TIMESTAMP TZ | |
| UNIQUE | (user_id, code_hash) | prevents double redeem |

### `star_payments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `telegram_payment_id` | VARCHAR(128) UNIQUE | |
| `amount` | INTEGER | stars amount |
| `status` | VARCHAR(32) | 'pending', 'completed', etc. |
| `created_at` | TIMESTAMP TZ | |
| `completed_at` | TIMESTAMP TZ | nullable |

### `deload_recommendations`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `status` | VARCHAR(16) | 'good' \| 'warning' \| 'recommended' |
| `signals` | JSONB | `string[]` — human-readable signals |
| `weekly_volumes` | JSONB | `{ weekStart: string, volume: number }[]` |
| `ai_explanation` | TEXT | nullable |
| `ai_preset_data` | JSONB | `{ name, exercises: { name, sets, targetReps, targetWeight }[] } \| null` |
| `created_at` | TIMESTAMP TZ | |
| `expires_at` | TIMESTAMP TZ | |

### `timer_sessions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | cascade delete |
| `workout_id` | UUID | client-side draft UUID (not FK) |
| `ends_at` | TIMESTAMP TZ | |
| `paused` | BOOLEAN | default false |
| `remaining_ms` | INTEGER | set when paused |
| `notified` | BOOLEAN | default false |
| `telegram_msg_id` | INTEGER | filled after notification sent |
| `created_at` | TIMESTAMP TZ | |

---

## 4. API Routes Summary

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | none | System health check |
| GET | `/api/me` | required | Current user + PRO status |
| POST | `/api/me/link` | Telegram initData | Create/link account, return JWT |
| GET | `/api/me/settings` | required | User profile/settings |
| PATCH | `/api/me/settings` | required | Update user profile/settings |
| GET | `/api/profile` | required | Onboarding profile data |
| PATCH | `/api/profile` | required | Save onboarding profile |
| GET | `/api/exercises` | optional | Search/list exercises |
| GET | `/api/exercises/[id]` | none | Exercise detail |
| GET | `/api/workouts` | required | User's workout list |
| POST | `/api/workouts` | required | Save workout |
| GET | `/api/workouts/[id]` | required | Workout detail |
| PATCH | `/api/workouts/[id]` | required | Update workout (isPublic, photoUrl) |
| DELETE | `/api/workouts/[id]` | required | Delete workout |
| POST | `/api/workouts/[id]/like` | required | Toggle workout like |
| GET | `/api/workouts/[id]/comments` | none | Workout comments |
| POST | `/api/workouts/[id]/comments` | required | Add workout comment |
| GET | `/api/workouts/[id]/exercises` | required | Workout exercises |
| PATCH | `/api/workouts/[id]/exercises/[weId]` | required | Update workout exercise |
| GET | `/api/workouts/[id]/export` | required | Download workout PDF |
| POST | `/api/workouts/[id]/send-pdf` | required | Send workout PDF via Telegram |
| GET | `/api/workouts/last-sets` | required | Last sets per exercise |
| GET | `/api/workouts/stats` | required | All-time workout stats |
| GET | `/api/workouts/weekly-volume` | required | 7-day volume chart data |
| GET | `/api/presets` | required | User's presets |
| POST | `/api/presets` | required | Create preset (3 free, ∞ Pro) |
| GET | `/api/presets/[id]` | none | Preset detail |
| PATCH | `/api/presets/[id]` | required | Update preset |
| DELETE | `/api/presets/[id]` | required | Delete preset |
| POST | `/api/presets/[id]/save` | required | Copy another user's preset |
| GET | `/api/feed` | required | Community feed |
| POST | `/api/community/posts` | required | Create community post |
| GET | `/api/community/posts/[id]` | none | Post detail |
| PATCH | `/api/community/posts/[id]` | required | Update post |
| DELETE | `/api/community/posts/[id]` | required | Delete post |
| POST | `/api/community/posts/[id]/like` | required | Toggle post like |
| GET | `/api/community/posts/[id]/comments` | none | Post comments |
| POST | `/api/community/posts/[id]/comments` | required | Add post comment |
| GET | `/api/community/presets/[presetId]` | none | Community preset detail |
| GET | `/api/users/search` | none | Search users by name |
| GET | `/api/users/[id]/profile` | none | Public user profile |
| POST | `/api/users/[id]/follow` | required | Toggle follow user |
| GET | `/api/progress/exercises` | required | Exercises with PR history |
| GET | `/api/progress/exercises/[id]` | required | Exercise progress detail |
| POST | `/api/ai/chat` | required + Pro | AI coach chat message |
| GET | `/api/ai/chat/history` | required | Chat message history |
| GET | `/api/ai/workout-report` | required + Pro | Fetch cached AI workout report |
| POST | `/api/ai/workout-report` | required + Pro | Generate AI workout report |
| POST | `/api/billing/stars` | Telegram webhook | Process Telegram Stars payment |
| POST | `/api/trial/activate` | required | Activate 7-day free trial |
| POST | `/api/promo/redeem` | required | Redeem promo code |
| GET | `/api/deload/status` | required | Recovery/deload recommendation |
| POST | `/api/deload/plan` | required + Pro | Generate AI deload plan |
| POST | `/api/deload/dismiss` | required | Dismiss deload notification |
| POST | `/api/deload/restore` | required | Restore dismissed deload |
| POST | `/api/timer/arm` | required | Start rest timer session |
| POST | `/api/timer/pause` | required | Pause rest timer |
| POST | `/api/timer/resume` | required | Resume rest timer |
| POST | `/api/timer/update` | required | Update timer end time |
| POST | `/api/timer/fire` | required | Fire timer notification |
| POST | `/api/timer/cleanup` | required | Delete timer session |
| POST | `/api/timer/cron` | Vercel cron | Fire all expired timers |
| GET | `/api/cron/weekly-report` | x-cron-secret | Send weekly fitness reports to all users |
| POST | `/api/upload/workout-photo` | required | Upload photo to Vercel Blob |
| POST | `/api/telegram/webhook` | Telegram | Bot webhook handler |

---

## 5. Context / Providers Hierarchy

```
app/layout.tsx
└── <Providers>  (app/providers.tsx)
    └── AuthProvider  (lib/auth/context.tsx)
        │  Exposes: { status, user, isLinked, isTelegram, refetch(), link(), errorMessage }
        │  Hook: useAuth()
        │
        └── AuthGate  (components/AuthGate.tsx)
            │  Blocks render until status !== 'loading'
            │
            └── ProfileProvider  (lib/profile/context.tsx)
                │  Exposes: { profile, isLoading, hasCompletedOnboarding, isPro, proExpiresAt,
                │             trialEndsAt, trialUsed, refetch(), refreshProfile(), saveProfile(),
                │             updateProfile(), showTrialOnboarding, trialOnboardingEndsAt,
                │             dismissTrialOnboarding(), triggerTrialOnboarding() }
                │  Hook: useProfile()
                │
                └── GlobalSheets  (inline in providers.tsx)
                    │  Renders <ProTrialOnboardingSheet> when showTrialOnboarding === true
                    │
                    └── OnboardingGate  (components/OnboardingGate.tsx)
                        │  Renders <OnboardingWizard> if !hasCompletedOnboarding
                        │
                        └── WorkoutProvider  (lib/workout/state.ts)
                            │  Exposes: { draft, dispatch, savedWorkouts, saveWorkoutToHistory(), hasDraft }
                            │  Hook: useWorkout()
                            │  Persists draft to localStorage (key: nextrep_workout_draft)
                            │
                            └── {children}  ← page content
```

**Persistent UI rendered in `app/layout.tsx` (outside LayoutShell):**
- `<TabBar>` — bottom navigation (hidden on `/workout/*`)
- `<AIChatWidget>` — floating AI chat (Pro only)
- `<ProGateTooltip>` — Pro feature tooltip
- `<ProBannerModal>` — promotional modal (every 15 launches)
