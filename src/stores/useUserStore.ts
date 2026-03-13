import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  firstName: string
  className: string
  subject: string
}

interface UserState {
  user: User | null
  token: string | null
  setUser: (u: User | null) => void
  setToken: (t: string | null) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (u) => set({ user: u }),
      setToken: (t) => set({ token: t }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'smartscholar-user-storage',
    }
  )
)


