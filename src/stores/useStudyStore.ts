import { create } from 'zustand'

export interface Topic {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  mastery: number
}

interface StudyState {
  currentMaterial: any | null
  roadmap: Topic[]
  quizzes: any[]
  schedule: any | null
  readinessScore: number
  weakTopics: Topic[]
  revisionQueue: Topic[]
  
  setMaterial: (m: any) => void
  setSchedule: (s: any) => void
  updateWeakTopics: (t: Topic[]) => void
  setReadinessScore: (score: number) => void
}

export const useStudyStore = create<StudyState>((set) => ({
  currentMaterial: null,
  roadmap: [
    { id: '1', name: 'Maxwell Equations', difficulty: 'hard', mastery: 42 },
    { id: '2', name: 'Gauss Law', difficulty: 'medium', mastery: 85 },
    { id: '3', name: 'Ampere Law', difficulty: 'hard', mastery: 20 },
  ],
  quizzes: [],
  schedule: null,
  readinessScore: 84,
  weakTopics: [
    { id: '1', name: 'Maxwell Equations', difficulty: 'hard', mastery: 42 },
    { id: '3', name: 'Ampere Law', difficulty: 'hard', mastery: 20 },
  ],
  revisionQueue: [
    { id: '2', name: 'Gauss Law', difficulty: 'medium', mastery: 85 }
  ],
  
  setMaterial: (m) => set({ currentMaterial: m }),
  setSchedule: (s) => set({ schedule: s }),
  updateWeakTopics: (t) => set({ weakTopics: t }),
  setReadinessScore: (score) => set({ readinessScore: score }),
}))
