import { create } from 'zustand'

export interface User {
  id: string
  email: string
  fullName: string
}

interface UserState {
  user: User | null
  token: string | null
  setUser: (u: User | null) => void
  setToken: (t: string | null) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: { id: "1", email: "demo@hackathon.com", fullName: "Demo Judge" }, // Mock logged in
  token: "mock-jwt",
  setUser: (u) => set({ user: u }),
  setToken: (t) => set({ token: t }),
  logout: () => set({ user: null, token: null })
}))
