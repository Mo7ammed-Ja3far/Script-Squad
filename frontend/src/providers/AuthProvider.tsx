import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { authApi } from "@/services/endpoints"
import { tokenStore } from "@/services/api"
import type { User, UserRole } from "@/types"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (user: User, token?: string) => void
  logout: () => Promise<void>
  updateUser: (user: User) => void
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // On mount, verify session via GET /api/auth/me
  useEffect(() => {
    authApi.getMe()
      .then(({ data }) => {
        if (data?.user) {
          setState({ user: data.user, isLoading: false, isAuthenticated: true })
        } else {
          setState({ user: null, isLoading: false, isAuthenticated: false })
        }
      })
      .catch(() => {
        setState({ user: null, isLoading: false, isAuthenticated: false })
      })
  }, [])

  const login = useCallback((user: User, token?: string) => {
    if (token) tokenStore.set(token)
    setState({ user, isLoading: false, isAuthenticated: true })
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    tokenStore.clear()
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  const updateUser = useCallback((user: User) => {
    setState(s => ({ ...s, user }))
  }, [])

  const hasRole = useCallback((...roles: UserRole[]) => {
    return !!state.user && roles.includes(state.user.role)
  }, [state.user])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
