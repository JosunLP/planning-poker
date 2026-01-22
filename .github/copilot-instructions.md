# Planning Poker - Copilot Instructions

## Architecture Overview

Real-time Planning Poker with Nuxt 4 compatibility, WebSocket-based communication, and OOP patterns.

### Core Concepts
- **Client-Server Split**: `app/` contains Vue frontend, `server/` contains Nitro backend with WebSocket
- **Real-time Communication**: `crossws` WebSocket via `server/routes/_ws.ts`, client binding through `useWebSocket` composable
- **Session Management**: Singleton `SessionStore` (`server/utils/sessionStore.ts`) manages all active sessions server-side
- **OOP Domain Logic**: `Session` and `Participant` classes in `app/utils/` with `toJSON()`/`fromJSON()` serialization

### Data Flow
1. Client sends `ClientMessage` (typed in `types/websocket.ts`) via WebSocket
2. Server processes in `_ws.ts`, mutates `SessionStore`, broadcasts `ServerMessage`
3. Client composable `useSession` updates reactive state via `useState('session')`

## Technology Stack

| Area | Technology |
|------|------------|
| Framework | Nuxt 4 (compatibility mode) |
| Runtime | Bun |
| Styling | Tailwind CSS with semantic colors (`primary`, `secondary`, `accent`) |
| WebSocket | crossws (Nitro experimental) |
| i18n | @nuxtjs/i18n (de/en) |

## Development

```bash
bun install         # Install dependencies
bun run dev         # Dev server with WebSocket (localhost:3000)
bun run typecheck   # vue-tsc type checking
bun run lint:fix    # ESLint with auto-fix
bun test            # Run tests
```

## Code Conventions

### TypeScript & Types
- **Strict Typing**: `typescript.strict: true` in nuxt.config
- **Interface-First**: All data structures as `I*` interfaces in `app/types/poker.ts`
- **Message Types**: Client/Server messages strictly typed in `types/websocket.ts`
- **Type Guards**: Validation functions like `isValidPokerValue()`, `isValidJoinCode()`

### Component Patterns
```vue
<script setup lang="ts">
// Define props as interface
interface Props {
  value: PokerValue
  selected?: boolean
}
const props = withDefaults(defineProps<Props>(), { selected: false })

// Typed emits
const emit = defineEmits<{ select: [value: PokerValue] }>()

// Computed for dynamic classes
const cardClasses = computed(() => [...])
</script>
```

### Composables
- `useSession()`: Main composable for session state, uses `useState('session')` for SSR compatibility
- `useWebSocket()`: Low-level WebSocket handling with auto-reconnect and ping/pong
- Event handlers with `on<PayloadType>('event:type', handler)` pattern

### OOP Classes (app/utils/)
- Implement interface from `types/poker.ts`
- Contain business logic (e.g., `Session.calculateResult()`)
- JSDoc for all public methods

### Styling
- Semantic Tailwind colors: `primary-500`, `secondary-200`, `accent-500`
- Responsive-first: Mobile-optimized components
- Prefer utility classes, avoid `@apply`

## WebSocket Messages

### Client → Server
`session:create`, `session:join`, `session:leave`, `vote:select`, `vote:reveal`, `vote:reset`, `voting:start`, `story:add`, `story:remove`, `story:next`

### Server → Client
`session:created`, `session:joined`, `session:updated`, `session:error`, `participant:joined`, `participant:left`

## Key Files

| File | Description |
|------|-------------|
| `app/types/poker.ts` | Core interfaces, `POKER_VALUES`, validation |
| `app/types/websocket.ts` | Message type definitions |
| `server/utils/sessionStore.ts` | Singleton session store |
| `server/routes/_ws.ts` | WebSocket message handler |
| `app/composables/useSession.ts` | Client-side session state |
| `tailwind.config.ts` | Color palette and design tokens |
