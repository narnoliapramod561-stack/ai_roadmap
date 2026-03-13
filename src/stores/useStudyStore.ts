import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Topic {
  id: string
  label: string
  difficulty: 'easy' | 'medium' | 'hard'
  mastery: number
}

interface StudyState {
  currentMaterialId: string | null
  currentMaterial: any | null
  roadmap: Topic[]
  quizzes: any[]
  schedule: any | null
  readinessScore: number
  weakTopics: Topic[]
  revisionQueue: Topic[]
  
  setMaterial: (id: string, m: any) => void
  setRoadmap: (roadmap: Topic[]) => void
  setSchedule: (s: any) => void
  updateWeakTopics: (t: Topic[]) => void
  setReadinessScore: (score: number) => void
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      currentMaterialId: null,
      currentMaterial: null,
      roadmap: [],
      quizzes: [],
      schedule: null,
      readinessScore: 0,
      weakTopics: [],
      revisionQueue: [],
      
      setMaterial: (id, m) => set({ currentMaterialId: id, currentMaterial: m }),
      setRoadmap: (roadmap) => {
        // Auto-derive weak topics and revision queue from roadmap
        const weakTopics = roadmap.filter(t => t.mastery < 40)
        const revisionQueue = roadmap.filter(t => t.mastery < 60)
        set({ roadmap, weakTopics, revisionQueue })
      },
      setSchedule: (s) => set({ schedule: s }),
      updateWeakTopics: (t) => set({ weakTopics: t }),
      setReadinessScore: (score) => set({ readinessScore: score }),
    }),
    {
      name: 'smartscholar-study-storage',
    }
  )
)
