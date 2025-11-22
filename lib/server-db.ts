import fs from "fs"
import path from "path"

// ==== TYPES ====
import type { AppUser, Business, Branch, Feedback, QRCode } from "@/lib/types"

// Path of our JSON DB file
const DB_PATH = path.join(process.cwd(), "db.json")


// Shape of the DB
type DBShape = {
  users: AppUser[]
  businesses: Business[]
  branches: Branch[]
  feedback: Feedback[]
  qrcodes: QRCode[]
  notifications: any[]     // ← ADD THIS
}



// Create empty DB if missing
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial: DBShape = {
      users: [],
      businesses: [],
      branches: [],
      feedback: [],
      qrcodes: [],
        notifications: [],   // ← ADD THIS

    }
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2))
  }
}

function load(): DBShape {
  initDB()
  const raw = fs.readFileSync(DB_PATH, "utf8")
  return JSON.parse(raw) as DBShape
}

function save(data: DBShape) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// ====== SERVER DB OPERATIONS ======
export const serverDb = {
  /* ==========================
           USERS
  ========================== */

  createUser(user: AppUser): AppUser {
    const db = load()
    db.users.push(user)
    save(db)
    return user
  },

  updateUser(id: string, updates: Partial<AppUser>): AppUser | null {
    const db = load()
    const index = db.users.findIndex(u => u.id === id)
    if (index === -1) return null

    db.users[index] = { ...db.users[index], ...updates }
    save(db)
    return db.users[index]
  },

  getUser(id: string): AppUser | null {
    return load().users.find(u => u.id === id) || null
  },

  /* ==========================
        NOTIFICATIONS
========================== */

createNotification(notification: any) {
  const db = load()
  if (!db.notifications) db.notifications = []

  db.notifications.push(notification)
  save(db)
  return notification
},

getNotificationsByUser(userId: string) {
  const db = load()
  if (!db.notifications) return []
  return db.notifications.filter(n => n.userId === userId)
},

markNotificationAsRead(id: string) {
  const db = load()
  if (!db.notifications) return null

  const index = db.notifications.findIndex(n => n.id === id)
  if (index === -1) return null

  db.notifications[index].read = true
  db.notifications[index].readAt = new Date().toISOString()

  save(db)
  return db.notifications[index]
},

  /* ==========================
        BUSINESSES
  ========================== */

  createBusiness(business: Business): Business {
    const db = load()
    db.businesses.push(business)
    save(db)
    return business
  },

  updateBusiness(id: string, updates: Partial<Business>): Business | null {
    const db = load()
    const index = db.businesses.findIndex(b => b.id === id)
    if (index === -1) return null

    db.businesses[index] = { ...db.businesses[index], ...updates }
    save(db)
    return db.businesses[index]
  },

  getBusiness(id: string): Business | null {
    return load().businesses.find(b => b.id === id) || null
  },

  getBusinessesByOwner(ownerId: string): Business[] {
    return load().businesses.filter(b => b.ownerId === ownerId)
  },

  /* ==========================
            BRANCHES
  ========================== */

  createBranch(branch: Branch): Branch {
    const db = load()
    db.branches.push(branch)
    save(db)
    return branch
  },

  updateBranch(id: string, updates: Partial<Branch>): Branch | null {
    const db = load()
    const index = db.branches.findIndex(b => b.id === id)
    if (index === -1) return null

    db.branches[index] = { ...db.branches[index], ...updates }
    save(db)
    return db.branches[index]
  },

  deleteBranch(id: string): boolean {
    const db = load()
    db.branches = db.branches.filter(b => b.id !== id)
    save(db)
    return true
  },

  getBranchesByBusiness(business_id: string): Branch[] {
    return load().branches.filter(b => b.business_id === business_id)
  },

  /* ==========================
            QR CODES
  ========================== */

  createQRCode(qr: QRCode): QRCode {
    const db = load()
    db.qrcodes.push(qr)
    save(db)
    return qr
  },

  updateQRCode(id: string, updates: Partial<QRCode>): QRCode | null {
    const db = load()
    const index = db.qrcodes.findIndex(q => q.id === id)
    if (index === -1) return null

    db.qrcodes[index] = { ...db.qrcodes[index], ...updates }
    save(db)
    return db.qrcodes[index]
  },

  deleteQRCode(id: string): boolean {
    const db = load()
    db.qrcodes = db.qrcodes.filter(q => q.id !== id)
    save(db)
    return true
  },

  getQRCode(id: string): QRCode | null {
    return load().qrcodes.find(q => q.id === id) || null
  },

  getQRCodeByCode(code: string): QRCode | null {
    return load().qrcodes.find(q => q.code === code) || null
  },

  getQRCodesByBusiness(business_id: string): QRCode[] {
    return load().qrcodes.filter(q => q.business_id === business_id)
  },

  /* ==========================
            FEEDBACK
  ========================== */

  createFeedback(feedback: Feedback): Feedback {
    const db = load()
    db.feedback.push(feedback)
    save(db)
    return feedback
  },

  updateFeedback(id: string, updates: Partial<Feedback>): Feedback | null {
    const db = load()
    const index = db.feedback.findIndex(f => f.id === id)
    if (index === -1) return null

    db.feedback[index] = { ...db.feedback[index], ...updates }
    save(db)
    return db.feedback[index]
  },

  getFeedback(id: string): Feedback | null {
    return load().feedback.find(f => f.id === id) || null
  },

  getFeedbackByBusiness(business_id: string): Feedback[] {
    return load().feedback.filter(f => f.business_id === business_id)
  },
}
