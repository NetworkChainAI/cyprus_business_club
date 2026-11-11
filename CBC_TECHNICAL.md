# CBC Platform — Техническая реализация и оценка

---

## 1. Технологический стек

| Слой | Технология | Версия |
|---|---|---|
| **Frontend** | SvelteKit + Svelte 5 | 2.22.2 |
| **Язык** | TypeScript | 5.0+ |
| **ORM** | Prisma | 6.19.0 |
| **БД** | PostgreSQL | — |
| **Сервер** | Node.js (adapter-node) | — |
| **Реалтайм** | Socket.io | 4.8.1 |
| **Стилизация** | Scoped CSS + глобальные стили | — |
| **Сборка** | Vite | 6.2.6 |
| **Деплой** | PM2 (порт 7766) | — |
| **Rich Text** | TipTap | 3.20.1 |
| **Карты** | Leaflet | 1.9.4 |

---

## 2. Архитектура

```
┌──────────────────────────────────────────────────┐
│                   SvelteKit App                   │
├──────────────┬───────────────────────────────────┤
│  Frontend    │  Backend (API Routes)              │
│  Svelte 5   │  67+ REST endpoints                │
│  89+ комп.  │  JWT auth middleware               │
│  i18n RU/EN │  Prisma ORM → PostgreSQL           │
├──────────────┴───────────────────────────────────┤
│              Внешние интеграции                    │
│  Stripe │ PayPal │ Custody API │ OpenAI │ Resend  │
│  Google OAuth │ Leaflet │ Exchange Rate API       │
└──────────────────────────────────────────────────┘
```

**Паттерн:** Fullstack monolith на SvelteKit. API routes — серверные `+server.ts`. Фронтенд — `.svelte` компоненты. Роутинг с языковым префиксом `[lang]/`.

---

## 3. Модули — техническая реализация

---

### 3.1 Аутентификация

**Ключевые файлы:**
- `src/hooks.server.ts` — middleware, JWT из HttpOnly cookie
- `src/lib/jwt.ts` — signJwt / verifyJwt (jose, HS256, 7 дней)
- `src/lib/server/security.ts` — rate limiter, password validation, file validation, security headers
- `src/routes/api/register/`, `api/login/`, `api/logout/`
- `src/routes/api/auth/google/` — Google OAuth callback
- `src/routes/api/verify-email/` — подтверждение email
- `src/components/Login.svelte`, `Register.svelte`

**Модели Prisma:** `CbcUser` (email, password, googleId, referralId, emailVerified, emailVerifyToken)

**Как работает:**
- JWT payload: `{uid, email, emailVerified}` → HttpOnly cookie `auth_token`
- Google OAuth 2.0: state-параметр для трекинга реферала
- Пароли: bcryptjs + password policy (8+ chars, upper/lower/digit)
- Email верификация: Resend API, уникальный токен, 24ч TTL
- Guard в middleware: неверифицированные → редирект `/verify-email`
- Rate limiting: login (10/15min), register (5/15min) per IP
- Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy

**~15 файлов, ~600 LOC**

---

### 3.2 Профили и пользователи

**Ключевые файлы:**
- `src/components/Profile.svelte` + `src/components/Profile/` (8 табов: ProfileHeader, ProfileSidebar, ProfileTabs, ProfileAchievements + Tabs/TicketsTab, AboutTab, InterestsTab, EventsTab, MeetingsTab, FollowersTab, FollowingTab, CompaniesTab)
- `src/components/members.svelte`, `member.svelte`, `MemberCard.svelte`
- `src/routes/api/user/profile/`, `api/user/settings/`, `api/user/onboarding/`
- `src/routes/api/members/`, `api/member/follow/`

**Модели Prisma:**
- `CbcUser` — id, email, password, googleId, referralId, invitedById, lastOnline, emailVerified
- `CbcUserInfo` — name, photo, bio, location, phone, dateOfBirth, status, role (USER/PARTNER/RESIDENT/ADMIN), trustScore, custodyAddress
- `CbcUserSetting` — isPrivate, emailSend, chatBotSend, onboardingDone
- `CbcFollow` — followerId, followingId (composite unique)

**Реализация:**
- Фото: multipart upload → `static/uploads/avatars/` (validated: type + size + sanitized name)
- Интересы: M2M с `EventCategory`
- Follow: дедупликация, anti-self-follow, уведомление получателю (+3 SC)
- Onboarding: wizard → +15 SC при завершении
- Поиск: по имени, био, email (min 2 символа, limit 10)

**~20 файлов, ~1500 LOC**

---

### 3.3 Ивенты

**Ключевые файлы:**
- `src/components/EventPage.svelte` + `src/components/Event/` (EventHero, EventAbout, EventAgenda, EventSidebar, EventOrganizer, EventSpeakers, EventSponsors, EventMap, EventParticipants, SimilarEvents)
- `src/components/events.svelte` — листинг с фильтрами
- `src/routes/api/add-event/` — создание
- `src/routes/api/events/[id]/` — обновление
- `src/routes/api/events/[id]/register/` — регистрация
- `src/routes/api/events/[id]/crypto-pay/` — крипто-оплата
- `src/routes/api/paypal/create/`, `capture/` — PayPal
- `src/routes/api/stripe/` — Stripe webhook
- `src/routes/api/ticket/[id]/pdf/` — PDF-билеты

**Модели Prisma:**
- `Event` — title, description, date, location, price, photo, documentPath, latitude, longitude, agenda (JSON), isActive, organizerId, communityId, brandId, chatId
- `EventRegistration` — userId, eventId, transactionId (composite unique)
- `EventCategory` — name (unique), byWho (USER/ADMIN). M2M с Event, Brand, CbcUser
- `EventSponsor` — eventId, brandId, name, logoUrl, order
- `EventSpeaker` — eventId, userId, name, email, photoUrl, title, order
- `CbcTransaction` — userId, type (EVENT_REGISTRATION), provider (PAYPAL/STRIPE/CRYPTO), status (CREATED/PENDING_CONFIRMATION/CAPTURED/FAILED/REFUNDED), amount, currency, providerPaymentId, rawDetails (JSON)

**Реализация:**
- При создании: автосоздание Chat + организатор как admin participant, +30 SC
- Агенда: JSON с валидацией HH:MM формата
- Спикеры/спонсоры: upload фото/лого (validated: type + size + sanitized filename)
- PDF-билет: PDFKit + QR-code (содержит URL ивента + registration ID)
- Оплата Stripe: Checkout Session → webhook → CbcTransaction(CAPTURED) + EventRegistration
- Оплата PayPal: Create Order → Capture → идемпотент по providerPaymentId
- Оплата Crypto: EUR→USD (exchangerate-api.com, кэш 5мин) → custody withdraw → CbcTransaction

**~20 файлов, ~2000 LOC**

---

### 3.4 Чат-система

**Ключевые файлы:**
- `src/components/chat.svelte` (~1400 LOC) — основной компонент
- `src/components/chat/TransferMessage.svelte` — спец-сообщения о переводах
- `src/routes/api/chat/` — list
- `src/routes/api/chat/create/` — создание DM
- `src/routes/api/chat/[chatId]/messages/` — получение сообщений
- `src/routes/api/chat/[chatId]/send/` — отправка (multipart)
- `src/routes/api/chat/[chatId]/read/` — пометка прочитанными
- `src/routes/api/chat/unread/` — счётчик непрочитанных

**Модели Prisma:**
- `Chat` — id, createdAt. Связь с Event (optional)
- `ChatParticipant` — userId, chatId, role (default "member"). Composite unique [userId, chatId]
- `Message` — chatId, senderId, content, type (default "text"), createdAt
- `MessageRead` — messageId, userId, readAt. Composite unique [messageId, userId]

**Реализация:**
- **Access control**: проверка ChatParticipant на каждом эндпоинте (send, messages, read)
- Polling: GET `?after=ISO_TIMESTAMP` каждую секунду (cursor-based)
- DM: проверка существующего чата перед созданием, anti-self-chat
- Файлы: multipart → `static/uploads/` (validated type/size, sanitized filename)
- Rate limit: 30 сообщений/минуту на пользователя
- Read: batch `createMany` при открытии чата
- Transfer messages: специальный UI для крипто-переводов
- UI: поиск, табы DM/Event, онлайн-индикаторы, разделители по датам, double-send protection

**~10 файлов, ~1800 LOC**

---

### 3.5 Крипто-кастодия (Custody)

**Ключевые файлы:**
- `src/components/Custody.svelte` — дашборд
- `src/components/custody/` — DepositModal, WithdrawModal, TransferModal, Secret, OtpInput
- `src/lib/custody/` — apiClient, auth, register, wallets, createWallet, withdraw, balances, getSecret, qrcode, types
- `src/routes/api/custody/login/`, `register/`, `check-session/`
- `src/lib/custody/balances.ts` — форматирование балансов

**Модель Prisma:** `CbcUserInfo.custodyAddress` (unique) — хранит адрес кошелька

**Реализация:**
- Внешний Custody API (HTTP REST): login, register, wallets, withdraw, getSecret
- Blockchain: Polygon (Layer 2)
- Токены: USDT, POL
- OTP: 6-значный код для каждой транзакции
- Сессия: отдельный JWT cookie `jwt` (1 час), проверка `/api/custody/check-session`
- Rate limiting: login (10/15min), register (5/15min) per IP
- Sparkline: SVG-графики балансов
- QR-код: для адреса пополнения
- Viem: Web3 библиотека для blockchain-операций
- При регистрации кошелька: +20 SC, +5 Trust, пересчёт trustScore

**~18 файлов, ~1200 LOC**

---

### 3.6 Репутационная система

**Ключевые файлы:**
- `src/lib/reputation/trust.ts` — recalcTrustScore()
- `src/lib/reputation/social.ts` — awardSocialCapital(), updateSocialTotal(), getRank()
- `src/lib/reputation/config.ts` — баллы, ранги, множители, anti-farm

**Модели Prisma:**
- `CbcTrustEvent` — userId, action, points, note, createdAt. Index [userId, createdAt]
- `CbcSocialLedger` — recipientId, sourceUserId, action, points, refId, refType. Indexes: [recipientId, createdAt], [recipientId, action, refId], [sourceUserId, action, createdAt]
- `CbcSocialTotal` — userId (unique), total (default 0), rank (default "Explorer"), updatedAt

**Реализация:**
- `awardSocialCapital()`: дедупликация по composite (recipientId, action, refId)
- `recalcTrustScore()`: проверка наличия фото, телефона, custody, speaker-статуса → clamp 0–100
- Ранги: Explorer I(0) → II(50) → III(150) → Mentor I(400) → II(800) → Leader I(1200) → II(2000)
- Trust-множители: 0.5x(0–29) / 1.0x(30–59) / 1.2x(60–79) / 1.5x(80–100)
- Anti-farm: 7-day min account age, 60-day 5% decay

**~5 файлов, ~220 LOC**

---

### 3.7 Сообщества

**Ключевые файлы:**
- `src/components/Communities.svelte` (~300 LOC) — листинг + карта
- `src/components/CommunityPage.svelte` (~250 LOC) — страница сообщества
- `src/components/Community/PostEditor.svelte`, `PostCard.svelte`
- `src/components/communityCreate/CommunityCreate.svelte` (~250 LOC)
- `src/routes/api/community/` — CRUD, join, posts

**Модели Prisma:**
- `Community` — name (unique), logoUrl, isPrivate, status (DISABLED/PENDING/ACTIVE), address (JSON), lat, lng. M2M: owners, members
- `CommunityJoinRequest` — communityId, userId, message. Composite unique [communityId, userId]
- `CbcPost` — title, excerpt, content (JSON), image, authorId, communityId, brandId, eventId

**Реализация:**
- Карта: Leaflet.js с маркерами сообществ
- Геокодинг: Nominatim API для автодополнения адреса
- Join: public → instant, private → request → notification → approve
- Посты: TipTap rich text → JSON хранение в `content`
- При одобрении: +30 SC создателю

**~10 файлов, ~1200 LOC**

---

### 3.8 Бренды

**Ключевые файлы:**
- `src/components/brands.svelte`, `brand.svelte`, `PartnerPage.svelte`
- `src/components/brandCreate/` — BrandCreate, Step1Basics, Step2ClientsBusiness, Step3Team
- `src/routes/api/brands/` — CRUD, search, follow
- `src/lib/utils/brandAnswersTemplateV1.ts` — шаблон ответов

**Модели Prisma:**
- `Brand` — ownerId, name, type (PERSONAL/COMPANY), status (PENDING/ACTIVE), logoUrl, website, answers (JSON). Indexes: [ownerId], [status], [type]
- `BrandTag` — type (AUDIENCE/PAIN/SOLUTION/MONETIZATION/CLIENT), title, isActive. Composite unique [type, title]
- `BrandTagOnBrand` — brandId, tagId (composite PK)
- `BrandFollow` — userId, brandId. Composite unique [userId, brandId]

**Реализация:**
- 3-шаговый wizard с deep-merge в JSON-шаблон `brandAnswersTemplateV1`
- 145+ предустановленных тегов (seed script `addEventCategories.js`)
- Follow: anti-self, anti-owner-follow, уведомление с 24ч дедупликацией
- Поиск: `contains` по name (min 2 символа, ACTIVE only, limit 10)

**~12 файлов, ~1000 LOC**

---

### 3.9 AI-ассистент

**Ключевые файлы:**
- `src/components/ContextAssistant.svelte` (~250 LOC) — UI модалка
- `src/components/AskAiButton.svelte` — floating кнопка
- `src/routes/api/assistant/+server.ts` — серверный эндпоинт
- `src/lib/assistant/tools.ts` — определения 5 tool-calling функций
- `src/lib/assistant/executor.ts` — исполнитель Prisma-запросов
- `src/lib/prompts/` — 12 контекстных файлов (~1000 LOC)

**Реализация:**
- OpenAI GPT-4.1-mini, temperature 0.5, max_tokens 700
- Tools: search_members, search_events, search_brands, search_communities, suggest_form_value
- Executor: Prisma-запросы с AND/OR логикой по категориям, фильтрация, limit 10
- 12 контекстов: global, event, eventCreate, brand, brandCreate, brandSearch, brandUnified, community, communityList, custody, expert, member
- Multi-turn: history передаётся в API
- i18n: auto-detect RU/EN, ответы на нужном языке
- Markdown rendering с кликабельными ссылками (`/ru/members/id`, `/en/events/id`)

**~18 файлов, ~2000 LOC**

---

### 3.10 Достижения

**Ключевые файлы:**
- `src/components/achievement.svelte`, `achievementSingle.svelte`
- `src/components/Profile/ProfileAchievements.svelte`, `ProfileAchievementDetail.svelte`
- `scripts/achievementsWorker.js` — PM2 фоновый worker

**Модели Prisma:**
- `Achievement` — code (unique), title, description, iconUrl, kind (ONE_OFF/PROGRESS/SEASONAL), tier (Common/Rare/Epic/Legendary/Mythic), requirement, levelsJson (JSON), startsAt, endsAt
- `UserAchievement` — userId, achievementId, level (default 1), earnedAt. Composite unique [userId, achievementId, level]

**Реализация:**
- Worker: setInterval 10сек, проверяет INVITED_FRIENDS (count referrals), EVENTS_VISITED (count registrations), CREATE_WALLET (custodyAddress exists)
- UI: фильтры по kind, отображение прогресса по уровням

**~5 файлов, ~400 LOC**

---

### 3.11 Встречи и календарь

**Ключевые файлы:**
- `src/components/Calendar.svelte`, `availability.svelte`, `bookingModal.svelte`
- `src/routes/api/user/availability/`, `api/user/meeting/add/`, `api/user/calendar/`

**Модели Prisma:**
- `Availability` — userId, start, end
- `MeetingSlot` — hostId, start, end
- `Meeting` — hostId, clientId, slotId (unique)

**Реализация:**
- Только Partner может создавать Availability
- Booking: проверка overlap, split слотов при частичном бронировании
- Calendar API: возвращает events (с регистрацией) + meetings (host + client)

**~6 файлов, ~500 LOC**

---

### 3.12 Уведомления

**Файлы:**
- `src/components/notifications.svelte` — dropdown bell
- `src/lib/services/notifications.ts` — createNotification, getByUserId, countUnread
- `src/routes/api/user/notifications/` — list, read, read-all

**Модель:** `Notification` — userId, emoji, textKey, params (JSON), status, type, link, isRead. onDelete: Cascade

**24ч дедупликация, i18n через textKey + params**

**~4 файла, ~300 LOC**

---

### 3.13 Фото-система

**Файлы:**
- `src/lib/utils/photo.ts` — photoSrc(), resolveUserPhoto(), userAvatarOrFallback()
- `src/routes/api/photo/[file]/+server.ts` — сервер изображений

**Реализация:**
- Smart routing: https URLs → pass-through, local → `/api/photo/`
- Sharp: WebP conversion, quality 80–82, max 1920px, `?w=NNN`
- Кэш: `.cache/` для обработанных
- Директории: `uploads/{events,brands,communities,docs,posts,avatars}/`

**~3 файла, ~200 LOC**

---

### 3.14 Интернационализация

**Файлы:**
- `src/lib/i18n.ts`, `src/lib/translations/`
- `src/lib/utils/localePath.ts`, `withLang.ts`, `dateLocale.ts`
- `src/routes/[lang]/` — все страницы под языковым префиксом

**sveltekit-i18n, auto-detect Accept-Language, RU/EN**

**~8 файлов, ~400 LOC**

---

### 3.15 Админ-панель

**Файлы:**
- `src/routes/[lang]/admin/` — UI страницы
- `src/routes/[lang]/platform-admin/` — платформенный админ
- `src/routes/api/platform-admin/` — API (все с проверкой ADMIN role)
- `src/routes/api/status/` — API (с проверкой ADMIN role)
- `src/components/admin/` — createEvent, createCategory, usersControl

**Функции:** управление пользователями (роли/статусы), модерация брендов/сообществ, категории

**~10 файлов, ~500 LOC**

---

## 4. Безопасность

### Реализованные меры защиты

| Мера | Файл | Описание |
|---|---|---|
| **Rate limiting** | `$lib/server/security.ts` | In-memory per-IP: login (10/15min), register (5/15min), custody (10/15min), chat send (30/min) |
| **Password policy** | `$lib/server/security.ts` | Min 8 chars, uppercase, lowercase, digit |
| **File validation** | `$lib/server/security.ts` | Type whitelist (image/document/chat), size limits (5/10/20 MB), filename sanitization |
| **Path traversal fix** | `sanitizeFileName()` | Remove `../`, special chars, limit 200 chars |
| **Chat access control** | `api/chat/[chatId]/*` | ChatParticipant check on send, messages, read |
| **User enumeration fix** | `api/login` | Generic "Invalid email or password" for both cases |
| **Security headers** | `hooks.server.ts` | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |
| **Email token TTL** | `api/verify-email` | 24-hour expiration |
| **Admin authorization** | `api/status`, `api/platform-admin/*` | ADMIN role check on all admin endpoints |
| **JWT HttpOnly** | All auth endpoints | Secure cookie, SameSite=Lax |
| **OTP** | Custody API | 6-digit code for each financial transaction |
| **Bcrypt** | `$lib/crypto.ts` | Password hashing |

---

## 5. База данных — используемые модели

**Всего CBC-моделей: 27**

| Домен | Модели |
|---|---|
| **Пользователи** | CbcUser, CbcUserInfo, CbcUserSetting, CbcEmailVerify, Onboarding |
| **Социальные** | CbcFollow, BrandFollow |
| **Репутация** | CbcTrustEvent, CbcSocialLedger, CbcSocialTotal |
| **Достижения** | Achievement, UserAchievement |
| **Ивенты** | Event, EventRegistration, EventCategory, EventSponsor, EventSpeaker |
| **Чат** | Chat, ChatParticipant, Message, MessageRead |
| **Сообщества** | Community, CommunityJoinRequest, CbcPost |
| **Бренды** | Brand, BrandTag, BrandTagOnBrand |
| **Платежи** | CbcTransaction |
| **Встречи** | Availability, MeetingSlot, Meeting |
| **Прочее** | Notification |

---

## 6. Внешние интеграции

| Сервис | Назначение | Библиотека |
|---|---|---|
| **Stripe** | Карточные платежи | stripe ^20.3.1 |
| **PayPal** | Альтернативные платежи | REST API (axios) |
| **OpenAI** | AI-ассистент (GPT-4.1-mini) | openai SDK |
| **Google OAuth** | Авторизация | google-auth-library ^10.5.0 |
| **Resend** | Email (верификация, уведомления) | resend ^6.9.3 |
| **Custody API** | Крипто-кошельки (Polygon/USDT/POL) | HTTP REST (кастомный) |
| **Exchange Rate API** | Конвертация EUR→USD | REST |
| **Nominatim** | Геокодинг адресов | REST |
| **Leaflet** | Интерактивные карты | leaflet ^1.9.4 |
| **Sharp** | Оптимизация изображений | sharp ^0.34.5 |
| **PDFKit** | Генерация PDF-билетов | pdfkit ^0.17.2 |
| **Socket.io** | WebSocket (реалтайм) | socket.io ^4.8.1 |
| **TipTap** | Rich text editor (посты) | @tiptap/core ^3.20.1 |

---

## 7. Статистика

| Метрика | Значение |
|---|---|
| Svelte-компоненты | 89+ |
| TypeScript файлы (lib) | 60+ |
| API эндпоинты | 67+ |
| Prisma модели (CBC) | 27 |
| AI prompt контексты | 12 |
| Миграции БД | 70+ |
| Общий LOC (оценка) | ~13,000–15,000 |

---

## 8. Оценка стоимости разработки

### Методология
Средние рыночные ставки: $40–80/ч (СНГ middle-senior), $80–150/ч (EU/US).

| Модуль | Сложность | Часы | СНГ ($50/ч) | EU/US ($120/ч) |
|---|---|---|---|---|
| Аутентификация + OAuth + Верификация | Средняя | 80–100 | $4,000–5,000 | $9,600–12,000 |
| Профили + Onboarding + Настройки | Средняя | 100–120 | $5,000–6,000 | $12,000–14,400 |
| Репутация (Trust + Social Capital) | Высокая | 80–100 | $4,000–5,000 | $9,600–12,000 |
| Ивенты (полный модуль + оплата) | Высокая | 200–250 | $10,000–12,500 | $24,000–30,000 |
| Чат-система | Высокая | 120–150 | $6,000–7,500 | $14,400–18,000 |
| Крипто-кастодия | Очень высокая | 150–200 | $7,500–10,000 | $18,000–24,000 |
| AI-ассистент (tool-calling + контексты) | Высокая | 100–130 | $5,000–6,500 | $12,000–15,600 |
| Сообщества (с картой и постами) | Средняя | 80–100 | $4,000–5,000 | $9,600–12,000 |
| Бренды (wizard + теги + follow) | Средняя | 80–100 | $4,000–5,000 | $9,600–12,000 |
| Достижения + Worker | Средняя | 60–80 | $3,000–4,000 | $7,200–9,600 |
| Встречи + Календарь | Средняя | 60–80 | $3,000–4,000 | $7,200–9,600 |
| Уведомления | Низкая | 30–40 | $1,500–2,000 | $3,600–4,800 |
| Фото-система (Sharp + CDN) | Средняя | 40–50 | $2,000–2,500 | $4,800–6,000 |
| Админ-панель | Средняя | 60–80 | $3,000–4,000 | $7,200–9,600 |
| i18n (RU/EN) | Средняя | 40–60 | $2,000–3,000 | $4,800–7,200 |
| Реферальная система + QR | Низкая | 20–30 | $1,000–1,500 | $2,400–3,600 |
| PDF-билеты | Низкая | 20–30 | $1,000–1,500 | $2,400–3,600 |
| Дизайн + вёрстка (89 компонентов) | Высокая | 200–250 | $10,000–12,500 | $24,000–30,000 |
| DevOps, БД, миграции | Средняя | 40–60 | $2,000–3,000 | $4,800–7,200 |

### Итого

| | Часы | СНГ ($50/ч) | EU/US ($120/ч) |
|---|---|---|---|
| **Минимум** | ~1,560 | **$78,000** | **$187,000** |
| **Максимум** | ~2,030 | **$101,500** | **$243,600** |
| **Среднее** | ~1,800 | **$90,000** | **$216,000** |

---

## 9. Уникальность платформы

### Что отличает CBC от аналогов

**1. Двухуровневая репутация (Trust + Social Capital)**
Объективная верификация (Trust) + субъективная активность (SC) с anti-sybil защитой и decay. Аналогов в комьюнити-платформах нет.

**2. Встроенная крипто-кастодия**
Полноценный кошелёк (Polygon USDT/POL) с P2P-переводами между участниками, OTP-безопасностью и интеграцией в чат. Для бизнес-клуба — уникально.

**3. Контекстный AI-ассистент**
Не чат-бот, а помощник с доступом к БД: ищет участников, ивенты, бренды, сообщества, помогает заполнять формы. 12 контекстных режимов.

**4. Тройная платёжная интеграция**
Stripe + PayPal + Crypto — максимальный охват для EU/CIS/crypto аудитории.

**5. Геймификация**
Achievements (5 тиров, 3 типа, уровни), ранговая система (Explorer→Leader), автоматический worker.

**6. Полный социальный граф**
Follow пользователей + follow брендов + membership в сообществах + регистрации на ивенты = комплексный нетворкинг-граф.

### Сравнение с конкурентами

| Фича | CBC | Mighty Networks | Circle.so | Discord |
|---|---|---|---|---|
| Крипто-кошелёк | ✅ | ❌ | ❌ | ❌ |
| AI-ассистент с DB search | ✅ | Частично | ❌ | Боты |
| Двойная репутация | ✅ | ❌ | Базовая | ❌ |
| 3 платёжных провайдера | ✅ | Stripe | Stripe | ❌ |
| Бренды/Партнёры | ✅ | ❌ | ❌ | ❌ |
| PDF-билеты на ивенты | ✅ | ❌ | ❌ | ❌ |
| Booking встреч | ✅ | ❌ | ❌ | ❌ |
| Achievements (тиры) | ✅ | ❌ | Базовые | ❌ |
| i18n (RU/EN) | ✅ | EN | EN | Multi |
| Карта сообществ | ✅ | ❌ | ❌ | ❌ |
