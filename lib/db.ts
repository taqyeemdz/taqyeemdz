import type { AppUser, Feedback, Business, QRCode, Branch, Notification } from "./types"

const KEY = "local_db"

function load() {
  if (typeof window === "undefined") return {}
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : {
    users: [],
    businesses: [],
    branches: [],
    qrcodes: [],
    feedback: [],
    notifications: [],
  }
}

function save(db: any) {
  localStorage.setItem(KEY, JSON.stringify(db))
}

export const dbOperations = {
  /* ================= AUTH ================= */
 // ---- BRANCHES CRUD ----
  getBranchesByBusiness(business_id: string) {
    return branches.filter((b) => b.business_id === business_id);
  },

  createBranch(branch: Branch) {
    branches.push(branch);
    return branch;
  },

  updateBranch(id: string, updates: Partial<Branch>) {
    const index = branches.findIndex((b) => b.id === id);
    if (index === -1) return null;

    branches[index] = { ...branches[index], ...updates };
    return branches[index];
  },

  deleteBranch(id: string) {
    branches = branches.filter((b) => b.id !== id);
  },

  setCurrentUser(user: AppUser | null) {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user))
    else localStorage.removeItem("auth_user")
  },

  getCurrentUser(): AppUser | null {
    const raw = localStorage.getItem("auth_user")
    return raw ? JSON.parse(raw) : null
  },

  logout() {
    localStorage.removeItem("auth_user")
  },

  /* ================= FEEDBACK ================= */

  createFeedback(feedback: Feedback) {
    const db = load()
    db.feedback.push(feedback)
    save(db)
    return feedback
  },

  updateFeedback(id: string, updates: Partial<Feedback>) {
    const db = load()
    const index = db.feedback.findIndex((f: Feedback) => f.id === id)
    if (index === -1) return null

    db.feedback[index] = { ...db.feedback[index], ...updates }
    save(db)
    return db.feedback[index]
  },

  getFeedback(id: string) {
    const db = load()
    return db.feedback.find((f: Feedback) => f.id === id) || null
  },

  getFeedbackByBusiness(business_id: string) {
    const db = load()
    return db.feedback.filter((f: Feedback) => f.business_id === business_id)
  },

  // =========================
// 📌 QR CODES
// =========================
createQRCode(qr: QRCode): QRCode {
  const raw = localStorage.getItem("qr_codes")
  const list: QRCode[] = raw ? JSON.parse(raw) : []

  list.push(qr)
  localStorage.setItem("qr_codes", JSON.stringify(list))

  return qr
},

getQRCodeById(id: string): QRCode | null {
  const raw = localStorage.getItem("qr_codes")
  const list: QRCode[] = raw ? JSON.parse(raw) : []
  return list.find((q) => q.id === id) || null
},

getQRCodeByCode(code: string): QRCode | null {
  const raw = localStorage.getItem("qr_codes")
  const list: QRCode[] = raw ? JSON.parse(raw) : []
  return list.find((q) => q.code === code) || null
},

getQRCodesByBusiness(business_id: string): QRCode[] {
  const raw = localStorage.getItem("qr_codes")
  const list: QRCode[] = raw ? JSON.parse(raw) : []
  return list.filter((q) => q.business_id === business_id)
},

updateQRCode(id: string, updates: Partial<QRCode>): QRCode | null {
  const raw = localStorage.getItem("qr_codes")
  let list: QRCode[] = raw ? JSON.parse(raw) : []

  const index = list.findIndex((q) => q.id === id)
  if (index === -1) return null

  list[index] = { ...list[index], ...updates }
  localStorage.setItem("qr_codes", JSON.stringify(list))

  return list[index]
},

deleteQRCode(id: string): void {
  const raw = localStorage.getItem("qr_codes")
  let list: QRCode[] = raw ? JSON.parse(raw) : []

  list = list.filter((q) => q.id !== id)
  localStorage.setItem("qr_codes", JSON.stringify(list))
},

 // =========================
// 📌 BUSINESS
// =========================
createBusiness(business: Business): Business {
  const raw = localStorage.getItem("businesses")
  const list: Business[] = raw ? JSON.parse(raw) : []

  list.push(business)
  localStorage.setItem("businesses", JSON.stringify(list))

  return business
},

getBusiness(id: string): Business | null {
  const raw = localStorage.getItem("businesses")
  const list: Business[] = raw ? JSON.parse(raw) : []
  return list.find((b) => b.id === id) || null
},

getBusinesses(): Business[] {
  const raw = localStorage.getItem("businesses")
  return raw ? JSON.parse(raw) : []
},

updateBusiness(id: string, updates: Partial<Business>): Business | null {
  const raw = localStorage.getItem("businesses")
  let list: Business[] = raw ? JSON.parse(raw) : []

  const index = list.findIndex((b) => b.id === id)
  if (index === -1) return null

  list[index] = { ...list[index], ...updates }
  localStorage.setItem("businesses", JSON.stringify(list))

  return list[index]
},

deleteBusiness(id: string): void {
  const raw = localStorage.getItem("businesses")
  let list: Business[] = raw ? JSON.parse(raw) : []

  list = list.filter((b) => b.id !== id)
  localStorage.setItem("businesses", JSON.stringify(list))
},



  /* ================= QR CODES ================= */


}

/*
  IMPORTANT:
  This DB runs in the browser (localStorage).
  Only use in "use client" components.
*/

// In-memory storage (since you're not using a real DB yet)
let branches: Branch[] = [];

