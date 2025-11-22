"use client"

import type { AppUser, Business, Branch } from "@/lib/types"

// Local keys
const USER_KEY = "auth_user"
const BUSINESS_KEY = "businesses"
const BRANCH_KEY = "branches"

// Helper to load array from storage
function load<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : []
}

// Helper to save array to storage
function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const dbOperations = {
  /* =======================
        AUTH
  ======================== */
  setCurrentUser(user: AppUser | null) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  },

  getCurrentUser(): AppUser | null {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },

  logout() {
    localStorage.removeItem(USER_KEY)
  },

  /* =======================
        BUSINESS CRUD
  ======================== */
  createBusiness(business: Business) {
    const businesses = load<Business>(BUSINESS_KEY)
    businesses.push(business)
    save(BUSINESS_KEY, businesses)
    return business
  },

  updateBusiness(id: string, updates: Partial<Business>) {
    const businesses = load<Business>(BUSINESS_KEY)
    const index = businesses.findIndex(b => b.id === id)
    if (index === -1) return null

    businesses[index] = { ...businesses[index], ...updates }
    save(BUSINESS_KEY, businesses)
    return businesses[index]
  },

  getBusiness(id: string) {
    const businesses = load<Business>(BUSINESS_KEY)
    return businesses.find(b => b.id === id) || null
  },

  /* =======================
        BRANCH CRUD
  ======================== */
  createBranch(branch: Branch) {
    const branches = load<Branch>(BRANCH_KEY)
    branches.push(branch)
    save(BRANCH_KEY, branches)
    return branch
  },

  updateBranch(id: string, updates: Partial<Branch>) {
    const branches = load<Branch>(BRANCH_KEY)
    const index = branches.findIndex(b => b.id === id)
    if (index === -1) return null

    branches[index] = { ...branches[index], ...updates }
    save(BRANCH_KEY, branches)
    return branches[index]
  },

  deleteBranch(id: string) {
    const branches = load<Branch>(BRANCH_KEY)
    const updated = branches.filter(b => b.id !== id)
    save(BRANCH_KEY, updated)
    return true
  }
}
