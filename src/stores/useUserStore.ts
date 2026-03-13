import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useStudyStore } from './useStudyStore'
import { usePlannerStore } from './usePlannerStore'

// ... interfaces ...
export interface StudyInterval {
  id: string
  start: string // e.g., "09:00"
  end: string   // e.g., "11:00"
}

export interface User {
  id: string
  email: string
  firstName: string
  className?: string
  subject?: string
  studyIntervals?: StudyInterval[]
  examDate?: string
}

interface UserState {
  user: User | null
  token: string | null
  setUser: (u: User | null) => void
  setToken: (t: string | null) => void
  updateIntervals: (intervals: StudyInterval[]) => void
  setExamDate: (date: string) => void
  logout: () => void
  clearAllData: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (u) => set({ user: u }),
      setToken: (t) => set({ token: t }),
      updateIntervals: (intervals) => set((state) => ({
        user: state.user ? { ...state.user, studyIntervals: intervals } : null
      })),
      setExamDate: (date) => set((state) => ({
        user: state.user ? { ...state.user, examDate: date } : null
      })),
      logout: () => {
        useStudyStore.getState().reset()
        usePlannerStore.getState().reset()
        set({ user: null, token: null })
      },
      clearAllData: () => {
        useStudyStore.getState().reset()
        usePlannerStore.getState().reset()
        set({ user: null, token: null })
      },
    }),
    {
      name: 'smartscholar-user-storage',
    }
  )
)


