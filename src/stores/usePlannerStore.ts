import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import { useAppSync } from './useAppSync'
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

export interface LearnedTopic {
  topic_label: string
  material_id?: string
  learned_at: string
}

interface PlannerState {
  tasks: PlannerTask[]
  timeframe: 'daily' | 'weekly' | 'monthly'
  isLoading: boolean
  error: string | null
  learnedTopics: LearnedTopic[]

  setTimeframe: (timeframe: 'daily' | 'weekly' | 'monthly') => void
  fetchTasks: (userId: string) => Promise<void>
  generateNewPlan: (userId: string, examDate?: string, studyIntervals?: StudyInterval[], materialIds?: string[]) => Promise<void>
  toggleTask: (taskId: string) => Promise<void>
  toggleSubtopic: (taskId: string, index: number) => Promise<void>
  markTopicLearned: (userId: string, topicLabel: string, materialId?: string) => Promise<void>
  unlearnTopic: (userId: string, topicLabel: string) => Promise<void>
  fetchLearnedTopics: (userId: string) => Promise<void>
  reset: () => void
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      tasks: [],
      timeframe: 'daily',
      isLoading: false,
      error: null,
      learnedTopics: [],

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
          // Extract syllabus topics and subject names directly from local store
          const { useStudyStore } = await import('./useStudyStore')
          const allMaterials = useStudyStore.getState().materials
          const targetMaterials = materialIds && materialIds.length > 0
            ? allMaterials.filter((m: any) => materialIds.includes(m.id))
            : allMaterials

          const syllabusTopics: string[] = []
          const subjectNames: string[] = []

          for (const mat of targetMaterials) {
            // Collect subject names for fallback
            const name = mat.subject_name || mat.subject || mat.filename || mat.file_name
            if (name && !subjectNames.includes(name)) subjectNames.push(name)

            // Collect detailed topic names from ai_roadmap
            const ar = mat.ai_roadmap || {}
            for (const t of ar.topics || []) {
              if (t?.name && !syllabusTopics.includes(t.name)) syllabusTopics.push(t.name)
            }
            for (const n of ar.knowledge_graph?.nodes || []) {
              if (n?.label && !syllabusTopics.includes(n.label)) syllabusTopics.push(n.label)
            }
          }

          console.log(`[Planner] ${syllabusTopics.length} topics, ${subjectNames.length} subjects from local store`)

          const response = await api.generatePlanner(
            userId,
            get().timeframe,
            examDate,
            studyIntervals,
            materialIds,
            syllabusTopics.length > 0 ? syllabusTopics : undefined,
            subjectNames.length > 0 ? subjectNames : undefined
          )
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
          // Notify global sync — triggers readiness score refresh on dashboard
          const userId = (await import('./useUserStore')).useUserStore.getState().user?.id
          if (userId) useAppSync.getState().notifyPlannerChange(userId)
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

        if (allCompleted !== wasCompleted) {
          try {
            await api.toggleTaskStatus(taskId, allCompleted)
          } catch (err) {
            set({ tasks, error: 'Failed to sync subtopic progress' })
          }
        }
      },

      markTopicLearned: async (userId, topicLabel, materialId) => {
        try {
          await api.markTopicLearned(userId, topicLabel, materialId)
          // Optimistically add to local state
          const already = get().learnedTopics.some(t => t.topic_label === topicLabel)
          if (!already) {
            set(state => ({
              learnedTopics: [...state.learnedTopics, {
                topic_label: topicLabel,
                material_id: materialId,
                learned_at: new Date().toISOString()
              }]
            }))
          }
        } catch (err) {
          console.warn('Failed to mark topic as learned', err)
        }
      },

      unlearnTopic: async (userId, topicLabel) => {
        try {
          await api.unlearnTopic(userId, topicLabel)
          set(state => ({
            learnedTopics: state.learnedTopics.filter(t => t.topic_label !== topicLabel)
          }))
        } catch (err) {
          console.warn('Failed to unlearn topic', err)
        }
      },

      fetchLearnedTopics: async (userId) => {
        try {
          const data = await api.getLearnedTopics(userId)
          set({ learnedTopics: data || [] })
        } catch (err) {
          console.warn('Failed to fetch learned topics', err)
        }
      },

      reset: () => set({ tasks: [], error: null, learnedTopics: [] })
    }),
    {
      name: 'smartscholar-planner-storage',
      partialize: (state) => ({ learnedTopics: state.learnedTopics, timeframe: state.timeframe })
    }
  )
)
