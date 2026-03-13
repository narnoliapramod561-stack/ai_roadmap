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
  materials: any[]
  
  setMaterial: (id: string, m: any) => void
  setMaterials: (m: any[]) => void
  addMaterial: (m: any) => void
  removeMaterial: (id: string) => void
  setRoadmap: (roadmap: Topic[]) => void
  setSchedule: (s: any) => void
  updateWeakTopics: (t: Topic[]) => void
  setReadinessScore: (score: number) => void
  reset: () => void
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
      materials: [],
      
      setMaterial: (id, m) => set({ currentMaterialId: id, currentMaterial: m }),
      setMaterials: (materials) => set({ materials }),
      addMaterial: (m) => set((state) => ({ 
        materials: [m, ...state.materials.filter(x => x.id !== m.id)] 
      })),
      removeMaterial: (id) => set((state) => ({
        materials: state.materials.filter(m => m.id !== id),
        currentMaterialId: state.currentMaterialId === id ? null : state.currentMaterialId,
        currentMaterial: state.currentMaterialId === id ? null : state.currentMaterial,
        roadmap: state.currentMaterialId === id ? [] : state.roadmap,
      })),
      setRoadmap: (roadmap) => {
        // Auto-derive weak topics and revision queue from roadmap
        const weakTopics = roadmap.filter(t => t.mastery < 40)
        const revisionQueue = roadmap.filter(t => t.mastery < 60)
        set({ roadmap, weakTopics, revisionQueue })
      },
      setSchedule: (s) => set({ schedule: s }),
      updateWeakTopics: (t) => set({ weakTopics: t }),
      setReadinessScore: (score) => set({ readinessScore: score }),
      reset: () => set({
        currentMaterialId: null,
        currentMaterial: null,
        roadmap: [],
        quizzes: [],
        schedule: null,
        readinessScore: 0,
        weakTopics: [],
        revisionQueue: [],
        materials: [],
      }),
    }),
    {
      name: 'smartscholar-study-storage',
    }
  )
)
