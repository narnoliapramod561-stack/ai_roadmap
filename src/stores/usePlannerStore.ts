import { create } from 'zustand'
import { api } from '@/lib/api'
import type { StudyInterval } from './useUserStore'

export interface PlannerTask {
  id: string
  title: string
  description: string
  duration: string
  category: string
  priority: 'low' | 'medium' | 'high'
  is_completed: boolean
  timeframe: 'daily' | 'weekly' | 'monthly'
  subtopics?: { label: string, is_completed: boolean }[]
}

interface PlannerState {
  tasks: PlannerTask[]
  timeframe: 'daily' | 'weekly' | 'monthly'
  isLoading: boolean
  error: string | null
  
  setTimeframe: (timeframe: 'daily' | 'weekly' | 'monthly') => void
  fetchTasks: (userId: string) => Promise<void>
  generateNewPlan: (userId: string, examDate?: string, studyIntervals?: StudyInterval[], materialIds?: string[]) => Promise<void>
  toggleTask: (taskId: string) => Promise<void>
  toggleSubtopic: (taskId: string, index: number) => Promise<void>
  reset: () => void
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  tasks: [],
  timeframe: 'daily',
  isLoading: false,
  error: null,

  setTimeframe: (timeframe) => set({ timeframe }),

  fetchTasks: async (userId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.getPlanner(userId, get().timeframe)
      const tasks = (data || []).map((t: any) => ({
        ...t,
        subtopics: t.subtopics?.map((s: any) => 
          typeof s === 'string' ? { label: s, is_completed: false } : s
        )
      }))
      set({ tasks, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch planner', isLoading: false })
    }
  },

  generateNewPlan: async (userId, examDate, studyIntervals, materialIds) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.generatePlanner(userId, get().timeframe, examDate, studyIntervals, materialIds)
      const tasks = (response.tasks || []).map((t: any) => ({
        ...t,
        subtopics: t.subtopics?.map((s: any) => 
          typeof s === 'string' ? { label: s, is_completed: false } : s
        )
      }))
      set({ tasks, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to generate plan', isLoading: false })
    }
  },

  toggleTask: async (taskId) => {
    const { tasks } = get()
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newStatus = !task.is_completed
    
    // Optimistic Update + Mark all subtopics
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          is_completed: newStatus,
          subtopics: t.subtopics?.map(s => ({ ...s, is_completed: newStatus }))
        }
      }
      return t
    })
    set({ tasks: updatedTasks })

    try {
      await api.toggleTaskStatus(taskId, newStatus)
    } catch (err: any) {
      set({ tasks, error: 'Failed to sync task status' })
    }
  },

  toggleSubtopic: async (taskId, index) => {
    const { tasks } = get()
    const task = tasks.find(t => t.id === taskId)
    if (!task || !task.subtopics) return

    const updatedSubtopics = [...task.subtopics]
    updatedSubtopics[index] = { 
      ...updatedSubtopics[index], 
      is_completed: !updatedSubtopics[index].is_completed 
    }

    const allCompleted = updatedSubtopics.every(s => s.is_completed)
    const wasCompleted = task.is_completed
    
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          subtopics: updatedSubtopics,
          is_completed: allCompleted
        }
      }
      return t
    })
    
    set({ tasks: updatedTasks })

    // Sync only if parent status changed
    if (allCompleted !== wasCompleted) {
      try {
        await api.toggleTaskStatus(taskId, allCompleted)
      } catch (err) {
        set({ tasks, error: 'Failed to sync subtopic progress' })
      }
    }
  },
  reset: () => set({ tasks: [], error: null })
}))
