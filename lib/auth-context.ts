"use client"

import { dbOperations } from "./db"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { AppUser } from "./types"

/** Convert Supabase Auth User → AppUser */
function convertToAppUser(user: SupabaseUser): AppUser {
  return {
    id: user.id,
    email: user.email?? null,
    name: user.user_metadata?.name ?? null,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
    createdat: user.created_at,
    role: user.user_metadata?.role ?? null,
  }
}

export function getAuthUser(): AppUser | null {
  return dbOperations.getCurrentUser()
}

export function setAuthUser(user: SupabaseUser | null) {
  if (!user) {
    dbOperations.setCurrentUser(null)
    return
  }

  const appUser = convertToAppUser(user)
  dbOperations.setCurrentUser(appUser)
}

export function clearAuth() {
  dbOperations.logout()
}
