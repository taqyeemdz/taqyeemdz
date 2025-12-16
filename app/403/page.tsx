'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { LogOut, ShieldAlert } from 'lucide-react'

export default function ForbiddenPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email ?? null)
    })
  }, [supabase])

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-6">
      <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full border border-gray-100">
        <div className="flex flex-col items-center">
          <ShieldAlert size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don’t have permission to view this page.
          </p>

          {userEmail && (
            <p className="text-sm text-gray-500 mb-4">
              Logged in as <span className="font-medium">{userEmail}</span>
            </p>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-red-600 text-white font-medium py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        © {new Date().getFullYear()} Tayseer Platform
      </p>
    </div>
  )
}
