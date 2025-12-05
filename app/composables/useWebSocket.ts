/**
 * useWebSocket Composable
 *
 * Manages the WebSocket connection to the server.
 * Provides reactive connection status information and message handling.
 */

import type { Ref } from 'vue'
import type { ClientMessage, ServerMessage, ServerMessageType } from '~/types/websocket'

/**
 * WebSocket connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * Event handler type
 */
type MessageHandler<T = unknown> = (payload: T) => void

/**
 * WebSocket composable options
 */
interface UseWebSocketOptions {
  /** Automatically connect on mount */
  autoConnect?: boolean
  /** Automatically reconnect on connection loss */
  autoReconnect?: boolean
  /** Maximum number of reconnect attempts */
  maxReconnectAttempts?: number
  /** Delay between reconnects in ms */
  reconnectDelay?: number
}

/**
 * WebSocket composable return type
 */
interface UseWebSocketReturn {
  /** Current connection status */
  status: Ref<ConnectionStatus>
  /** Establish connection */
  connect: () => void
  /** Disconnect */
  disconnect: () => void
  /** Send message */
  send: <T>(type: ClientMessage['type'], payload: T) => void
  /** Register event handler */
  on: <T>(type: ServerMessageType, handler: MessageHandler<T>) => () => void
  /** One-time event handler */
  once: <T>(type: ServerMessageType, handler: MessageHandler<T>) => void
}

/**
 * useWebSocket Composable
 *
 * @param options - Configuration options
 * @returns WebSocket management functions
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

  /** WebSocket instance */
  let ws: WebSocket | null = null

  /** Reconnect attempts */
  let reconnectAttempts = 0

  /** Reconnect timer */
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  /** Ping interval */
  let pingInterval: ReturnType<typeof setInterval> | null = null

  /** Connection status */
  const status = ref<ConnectionStatus>('disconnected')

  /** Event handler map */
  const handlers = new Map<ServerMessageType, Set<MessageHandler>>()

  /**
   * Generate WebSocket URL
   */
  function getWebSocketUrl(): string {
    if (!import.meta.client) return ''

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/_ws`
  }

  /**
   * Call event handlers
   */
  function emitEvent(type: ServerMessageType, payload: unknown): void {
    const typeHandlers = handlers.get(type)
    if (typeHandlers) {
      typeHandlers.forEach(handler => handler(payload))
    }
  }

  /**
   * Establish connection
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

        // Start ping interval
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
   * Cleanup
   */
  function cleanup(): void {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }

  /**
   * Disconnect
   */
  function disconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    cleanup()
    reconnectAttempts = maxReconnectAttempts // Prevents auto-reconnect

    if (ws) {
      ws.close()
      ws = null
    }

    status.value = 'disconnected'
  }

  /**
   * Send message
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
   * Register event handler
   */
  function on<T>(type: ServerMessageType, handler: MessageHandler<T>): () => void {
    if (!handlers.has(type)) {
      handlers.set(type, new Set())
    }

    handlers.get(type)!.add(handler as MessageHandler)

    // Return unsubscribe function
    return () => {
      handlers.get(type)?.delete(handler as MessageHandler)
    }
  }

  /**
   * One-time event handler
   */
  function once<T>(type: ServerMessageType, handler: MessageHandler<T>): void {
    const wrappedHandler: MessageHandler<T> = (payload) => {
      handler(payload)
      handlers.get(type)?.delete(wrappedHandler as MessageHandler)
    }

    on(type, wrappedHandler)
  }

  // Auto-connect on mount
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
