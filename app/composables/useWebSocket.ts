/**
 * useWebSocket Composable
 *
 * Verwaltet die WebSocket-Verbindung zum Server.
 * Bietet reaktive Verbindungsstatusinformationen und Message-Handling.
 */

import type { Ref } from 'vue'
import type { ClientMessage, ServerMessage, ServerMessageType } from '~/types/websocket'

/**
 * WebSocket Verbindungsstatus
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * Event-Handler Typ
 */
type MessageHandler<T = unknown> = (payload: T) => void

/**
 * WebSocket Composable Optionen
 */
interface UseWebSocketOptions {
  /** Automatisch verbinden beim Mount */
  autoConnect?: boolean
  /** Automatisch neu verbinden bei Verbindungsverlust */
  autoReconnect?: boolean
  /** Maximale Anzahl Reconnect-Versuche */
  maxReconnectAttempts?: number
  /** Delay zwischen Reconnects in ms */
  reconnectDelay?: number
}

/**
 * WebSocket Composable Return Type
 */
interface UseWebSocketReturn {
  /** Aktueller Verbindungsstatus */
  status: Ref<ConnectionStatus>
  /** Verbindung herstellen */
  connect: () => void
  /** Verbindung trennen */
  disconnect: () => void
  /** Nachricht senden */
  send: <T>(type: ClientMessage['type'], payload: T) => void
  /** Event-Handler registrieren */
  on: <T>(type: ServerMessageType, handler: MessageHandler<T>) => () => void
  /** Einmaliger Event-Handler */
  once: <T>(type: ServerMessageType, handler: MessageHandler<T>) => void
}

/**
 * useWebSocket Composable
 *
 * @param options - Konfigurationsoptionen
 * @returns WebSocket-Management-Funktionen
 *
 * @example
 * ```ts
 * const { status, connect, send, on } = useWebSocket()
 *
 * on('session:updated', (payload) => {
 *   console.log('Session updated:', payload)
 * })
 *
 * send('session:create', { sessionName: 'Sprint 1', participantName: 'Max' })
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options

  /** WebSocket-Instanz */
  let ws: WebSocket | null = null

  /** Reconnect-Versuche */
  let reconnectAttempts = 0

  /** Reconnect Timer */
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  /** Ping-Interval */
  let pingInterval: ReturnType<typeof setInterval> | null = null

  /** Verbindungsstatus */
  const status = ref<ConnectionStatus>('disconnected')

  /** Event-Handler Map */
  const handlers = new Map<ServerMessageType, Set<MessageHandler>>()

  /**
   * WebSocket-URL generieren
   */
  function getWebSocketUrl(): string {
    if (!import.meta.client) return ''

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/_ws`
  }

  /**
   * Event-Handler aufrufen
   */
  function emitEvent(type: ServerMessageType, payload: unknown): void {
    const typeHandlers = handlers.get(type)
    if (typeHandlers) {
      typeHandlers.forEach(handler => handler(payload))
    }
  }

  /**
   * Verbindung herstellen
   */
  function connect(): void {
    if (!import.meta.client) return
    if (ws?.readyState === WebSocket.OPEN) return

    status.value = 'connecting'

    try {
      ws = new WebSocket(getWebSocketUrl())

      ws.onopen = () => {
        status.value = 'connected'
        reconnectAttempts = 0
        console.log('[WebSocket] Connected')

        // Ping-Interval starten
        pingInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            send('ping', {})
          }
        }, 30000)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage
          emitEvent(message.type, message.payload)
        }
        catch (error) {
          console.error('[WebSocket] Error parsing message:', error)
        }
      }

      ws.onclose = () => {
        status.value = 'disconnected'
        cleanup()
        console.log('[WebSocket] Disconnected')

        // Auto-Reconnect
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1)
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)

          reconnectTimer = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        status.value = 'error'
        console.error('[WebSocket] Error:', error)
      }
    }
    catch (error) {
      status.value = 'error'
      console.error('[WebSocket] Failed to connect:', error)
    }
  }

  /**
   * Aufräumen
   */
  function cleanup(): void {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }

  /**
   * Verbindung trennen
   */
  function disconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    cleanup()
    reconnectAttempts = maxReconnectAttempts // Verhindert Auto-Reconnect

    if (ws) {
      ws.close()
      ws = null
    }

    status.value = 'disconnected'
  }

  /**
   * Nachricht senden
   */
  function send<T>(type: ClientMessage['type'], payload: T): void {
    if (ws?.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message: not connected')
      return
    }

    const message: ClientMessage = {
      type,
      payload,
      timestamp: Date.now(),
    }

    ws.send(JSON.stringify(message))
  }

  /**
   * Event-Handler registrieren
   */
  function on<T>(type: ServerMessageType, handler: MessageHandler<T>): () => void {
    if (!handlers.has(type)) {
      handlers.set(type, new Set())
    }

    handlers.get(type)!.add(handler as MessageHandler)

    // Unsubscribe-Funktion zurückgeben
    return () => {
      handlers.get(type)?.delete(handler as MessageHandler)
    }
  }

  /**
   * Einmaliger Event-Handler
   */
  function once<T>(type: ServerMessageType, handler: MessageHandler<T>): void {
    const wrappedHandler: MessageHandler<T> = (payload) => {
      handler(payload)
      handlers.get(type)?.delete(wrappedHandler as MessageHandler)
    }

    on(type, wrappedHandler)
  }

  // Auto-Connect beim Mount
  if (import.meta.client && autoConnect) {
    onMounted(() => {
      connect()
    })

    onUnmounted(() => {
      disconnect()
    })
  }

  return {
    status,
    connect,
    disconnect,
    send,
    on,
    once,
  }
}
