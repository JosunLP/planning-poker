/**
 * useLocalStats Composable
 *
 * Manages local statistics storage and provides computed statistics.
 * Uses LocalStorage for persistence across browser sessions.
 */

import type { IParticipant, ISession } from '~/types'
import type {
  ICardFrequency,
  ILocalStatsStorage,
  IMeetingStatus,
  IQuickStats,
  ISessionStats,
  IStoryStats,
  ITimeSeriesPoint,
} from '~/types/stats'
import { DEFAULT_STATS_STORAGE, STATS_STORAGE_KEY } from '~/types/stats'
import { aggregateCardFrequency, calculateConsensusDistribution, calculateQuickStats, createStoryStats as createStoryStatsCore } from '~/utils/statsCalculations'

/**
 * Composable for managing local statistics
 */
export function useLocalStats() {
  /**
   * Reactive storage state
   */
  const storage = useState<ILocalStatsStorage>('localStats', () => DEFAULT_STATS_STORAGE)

  /**
   * Initialize storage from LocalStorage on client
   */
  function initStorage(): void {
    if (!import.meta.client) return

    try {
      const stored = localStorage.getItem(STATS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ILocalStatsStorage
        // Convert date strings back to Date objects
        parsed.lastUpdated = new Date(parsed.lastUpdated)
        Object.values(parsed.sessions).forEach((session) => {
          session.createdAt = new Date(session.createdAt)
          session.updatedAt = new Date(session.updatedAt)
          session.history.forEach((story) => {
            story.timestamp = new Date(story.timestamp)
          })
        })
        storage.value = parsed
      }
    }
    catch (error) {
      console.error('[useLocalStats] Failed to load stats from storage:', error)
    }
  }

  /**
   * Save storage to LocalStorage
   */
  function saveStorage(): void {
    if (!import.meta.client) return

    try {
      storage.value.lastUpdated = new Date()
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(storage.value))
    }
    catch (error) {
      console.error('[useLocalStats] Failed to save stats to storage:', error)
    }
  }

  /**
   * Get or create session stats
   */
  function getOrCreateSessionStats(session: ISession, joinCode: string): ISessionStats {
    if (!storage.value.sessions[session.id]) {
      storage.value.sessions[session.id] = {
        sessionId: session.id,
        sessionName: session.name,
        joinCode,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(),
        history: [],
      }
    }
    return storage.value.sessions[session.id]!
  }

  /**
   * Record a voting result (called when cards are revealed)
   */
  function recordVotingResult(
    session: ISession,
    joinCode: string,
    voters: IParticipant[],
  ): IStoryStats | null {
    if (!session.currentStory || !session.cardsRevealed) return null

    const sessionStats = getOrCreateSessionStats(session, joinCode)

    // Use extracted pure function for calculations
    const storyStats = createStoryStatsCore(
      session.currentStory,
      session.currentStoryDescription,
      voters,
    )

    // Check if this story was already recorded (avoid duplicates)
    const existingIndex = sessionStats.history.findIndex(
      h => h.story === storyStats.story
        && Math.abs(h.timestamp.getTime() - storyStats.timestamp.getTime()) < 60000
    )

    if (existingIndex === -1) {
      sessionStats.history.push(storyStats)
      sessionStats.updatedAt = new Date()
      saveStorage()
    }

    return storyStats
  }

  /**
   * Get quick stats for a session
   */
  function getQuickStats(sessionId?: string): IQuickStats {
    const sessions = sessionId
      ? [storage.value.sessions[sessionId]].filter(Boolean)
      : Object.values(storage.value.sessions)

    const allStories = sessions.flatMap(s => s?.history ?? [])

    return calculateQuickStats(allStories)
  }

  /**
   * Get meeting status from current session
   */
  function getMeetingStatus(session: ISession | null, voters: IParticipant[]): IMeetingStatus {
    if (!session) {
      return {
        status: 'waiting',
        currentStory: null,
        votingDuration: null,
        participationRate: 0,
        lastActivity: new Date(),
        participantsOnline: 0,
        storiesInQueue: 0,
        storiesCompleted: 0,
      }
    }

    const votedCount = voters.filter(v => v.selectedValue !== null).length
    const participationRate = voters.length > 0 ? (votedCount / voters.length) * 100 : 0

    const sessionStats = storage.value.sessions[session.id]
    const storiesCompleted = sessionStats?.history.length ?? 0

    return {
      status: session.status,
      currentStory: session.currentStory,
      votingDuration: null, // TODO: Track voting start time
      participationRate,
      lastActivity: new Date(session.updatedAt),
      participantsOnline: session.participants.length,
      storiesInQueue: session.storyQueue.length,
      storiesCompleted,
    }
  }

  /**
   * Get card frequency across all sessions
   */
  function getCardFrequency(sessionId?: string): ICardFrequency[] {
    const sessions = sessionId
      ? [storage.value.sessions[sessionId]].filter(Boolean)
      : Object.values(storage.value.sessions)

    const allStories = sessions.flatMap(s => s?.history ?? [])

    return aggregateCardFrequency(allStories)
  }

  /**
   * Get time series data for story points over time
   */
  function getPointsTimeSeries(sessionId?: string): ITimeSeriesPoint[] {
    const sessions = sessionId
      ? [storage.value.sessions[sessionId]].filter(Boolean)
      : Object.values(storage.value.sessions)

    return sessions
      .flatMap(s => s?.history ?? [])
      .filter(story => story.average !== null)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(story => ({
        date: story.timestamp,
        value: story.average!,
        label: story.story,
      }))
  }

  /**
   * Get recent stories (last N)
   */
  function getRecentStories(sessionId?: string, limit = 10): IStoryStats[] {
    const sessions = sessionId
      ? [storage.value.sessions[sessionId]].filter(Boolean)
      : Object.values(storage.value.sessions)

    return sessions
      .flatMap(s => s?.history ?? [])
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get consensus distribution (pie chart data)
   */
  function getConsensusDistribution(sessionId?: string): { consensus: number, noConsensus: number } {
    const sessions = sessionId
      ? [storage.value.sessions[sessionId]].filter(Boolean)
      : Object.values(storage.value.sessions)

    const allStories = sessions.flatMap(s => s?.history ?? [])

    return calculateConsensusDistribution(allStories)
  }

  /**
   * Get all session stats
   */
  function getAllSessions(): ISessionStats[] {
    return Object.values(storage.value.sessions)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  /**
   * Get session stats by ID
   */
  function getSessionStats(sessionId: string): ISessionStats | null {
    return storage.value.sessions[sessionId] ?? null
  }

  /**
   * Clear all stats
   */
  function clearAllStats(): void {
    storage.value = { ...DEFAULT_STATS_STORAGE }
    saveStorage()
  }

  /**
   * Clear stats for a specific session
   */
  function clearSessionStats(sessionId: string): void {
    const { [sessionId]: _, ...rest } = storage.value.sessions
    storage.value.sessions = rest
    saveStorage()
  }

  // Initialize on client
  if (import.meta.client) {
    initStorage()
  }

  return {
    // State
    storage: readonly(storage),

    // Actions
    initStorage,
    recordVotingResult,
    clearAllStats,
    clearSessionStats,

    // Computed stats
    getQuickStats,
    getMeetingStatus,
    getCardFrequency,
    getPointsTimeSeries,
    getRecentStories,
    getConsensusDistribution,
    getAllSessions,
    getSessionStats,
  }
}
