// Core data types for TaqyeemDZ SaaS



  export type UserRole = "admin" | "business_owner" | "manager" | "staff"

export type User = {
  id: string
  createdat: Date
  email: string
  name?: string
  business_id?: string
  role: "admin" | "owner" | "manager" | "staff"
}





export interface Business {
  id: string
  name: string
  ownerId: string
  description: string
  category: string
  phone: string
  email: string
  website?: string
  logo?: string
  primaryColor: string
  accentColor: string
  address: string
  city: string
  country: string
  branches: Branch[]
  created_at: string;
  updatedAt: Date
  subscriptionPlan: "starter" | "pro" | "enterprise"
  subscriptionstatus: "inactive" |"active" | "cancelled" | "expired"
  maxBranches: number
  maxQRCodes: number
}

export type Branch = {
  id: string
  business_id: string
  name: string
  address: string
  phone: string
  manager: string
  isActive: boolean
  createdat: string | Date
  updatedAt: string | Date
}


export type FormType = "feedback" | "rating" | "survey"


export type FeedbackStatus = "new" | "viewed" | "responded" | "archived"

export type Feedback = {
  id: string
  business_id: string
  branchId?: string
  qrCodeId: string

  customerName: string
  customerEmail?: string
  customerPhone?: string

  rating: number
  category: string
  subject: string
  message: string

  status: FeedbackStatus
  response?: string
  priority: "high" | "low"

  createdat: string | Date
  respondedAt?: string | Date
}




// Your application-level user
export type AppUser = {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
  createdat: string
  role: "admin" | "owner" | "manager" | "staff" | null
  business_id?: string
}



export interface Analytics {
  business_id: string
  branchId?: string
  totalFeedback: number
  averageRating: number
  totalScans: number
  feedbackByCategory: Record<string, number>
  feedbackByRating: Record<number, number>
  feedbackTrend: Array<{ date: string; count: number; avgRating: number }>
  responseRate: number
  averageResponseTime: number
  lastUpdated: Date
}

export interface Notification {
  id: string
  business_id: string
  userId: string
  type: "new_feedback" | "new_rating" | "system" | "report"
  title: string
  message: string
  isRead: boolean
  data?: Record<string, any>
  createdat: Date
}

export type QRCode = {
  id: string
  business_id: string
  branchId?: string

  name: string
  code: string
  scansCount: number
  description:string
  formType: string
  isActive: boolean

  createdat: string   // <-- MUST BE string
}

