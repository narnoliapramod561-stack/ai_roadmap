import { create } from 'zustand'

interface FocusState {
  isFocusMode: boolean
  toggleFocusMode: () => void
  setFocusMode: (value: boolean) => void
}

export const useFocusStore = create<FocusState>((set) => ({
  isFocusMode: false,
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setFocusMode: (value) => set({ isFocusMode: value }),
}))
