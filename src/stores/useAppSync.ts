/**
 * useAppSync — Central cross-feature synchronization store
 *
 * This is the single source of truth for shared state that needs to
 * stay in sync across multiple pages (readiness score, quiz history,
 * materials list, planner progress).
 *
 * Pattern:
 *  - Any store/page that changes state calls the relevant `notify*` action
 *  - Pages subscribe to the values they need and react automatically
 *  - A global `lastSyncedAt` timestamp triggers re-fetches across components
 */
import { create } from 'zustand'
import { api } from '@/lib/api'

interface AppSyncState {
  // Shared data
  readinessPct: number
  topicsAttempted: number
  totalTopics: number
  weakAreas: string[]
  strongAreas: string[]
  quizHistory: any[]
  overdueTopics: any[]

  // Sync metadata
  lastPlannerSyncAt: number      // timestamp — changes trigger dashboard refresh
  lastMaterialSyncAt: number     // timestamp — changes trigger material lists refresh
  lastQuizSyncAt: number         // timestamp — changes trigger readiness refresh
  isSyncing: boolean

  // Actions
  fetchReadiness: (userId: string) => Promise<void>
  fetchQuizHistory: (userId: string) => Promise<void>
  fetchOverdue: (userId: string) => Promise<void>
  fetchAll: (userId: string) => Promise<void>

  // Event notifications — call these when something changes
  notifyPlannerChange: (userId: string) => void   // task completed/uncompleted
  notifyQuizComplete: (userId: string) => void    // quiz submitted
  notifyMaterialChange: () => void                // upload/delete
}

export const useAppSync = create<AppSyncState>((set, get) => ({
  readinessPct: 0,
  topicsAttempted: 0,
  totalTopics: 0,
  weakAreas: [],
  strongAreas: [],
  quizHistory: [],
  overdueTopics: [],
  lastPlannerSyncAt: 0,
  lastMaterialSyncAt: 0,
  lastQuizSyncAt: 0,
  isSyncing: false,

  fetchReadiness: async (userId) => {
    try {
      const data = await api.getReadinessScore(userId)
      if (data) {
        set({
          readinessPct: data.readiness_pct ?? 0,
          topicsAttempted: data.topics_attempted ?? 0,
          totalTopics: data.total_topics ?? 0,
          weakAreas: data.weak_areas ?? [],
          strongAreas: data.strong_areas ?? [],
        })
      }
    } catch (e) {
      console.warn('[AppSync] readiness fetch failed', e)
    }
  },

  fetchQuizHistory: async (userId) => {
    try {
      const data = await api.getQuizHistory(userId)
      set({ quizHistory: data || [] })
    } catch (e) {
      console.warn('[AppSync] quiz history fetch failed', e)
    }
  },

  fetchOverdue: async (userId) => {
    try {
      const data = await api.getOverdueTopics(userId)
      set({ overdueTopics: data?.overdue || [] })
    } catch (e) {
      console.warn('[AppSync] overdue fetch failed', e)
    }
  },

  fetchAll: async (userId) => {
    set({ isSyncing: true })
    await Promise.allSettled([
      get().fetchReadiness(userId),
      get().fetchQuizHistory(userId),
      get().fetchOverdue(userId),
    ])
    set({ isSyncing: false })
  },

  // Called whenever a planner task is toggled
  notifyPlannerChange: (userId) => {
    set({ lastPlannerSyncAt: Date.now() })
    // Debounced readiness refresh — wait 1.5s for backend to process
    setTimeout(() => {
      get().fetchReadiness(userId)
    }, 1500)
  },

  // Called after a quiz is submitted
  notifyQuizComplete: (userId) => {
    set({ lastQuizSyncAt: Date.now() })
    setTimeout(() => {
      get().fetchReadiness(userId)
      get().fetchQuizHistory(userId)
      get().fetchOverdue(userId)
    }, 500)
  },

  // Called after material upload/delete
  notifyMaterialChange: () => {
    set({ lastMaterialSyncAt: Date.now() })
  },
}))
