"use client";

import { Search, Bell, Mail } from "lucide-react";
import Image from "next/image";

export default function AdminTopBar({ user }: { user: any }) {
  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-[var(--border)] px-6 py-4 flex items-center gap-6">
      
      {/* Search bar */}
      <div className="flex-1">
        <div className="
          flex items-center gap-3
          bg-gray-50 rounded-full px-4 py-2
          border border-gray-200
        ">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* Icons */}
      <div className="flex items-center gap-4">
        <button className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">
          <Mail className="h-5 w-5 text-gray-500" />
        </button>

        <button className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-500" />
        </button>

        {/* User avatar + name */}
        <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
          <Image
            src="/" // replace with real avatar
            alt="User avatar"
            width={36}
            height={36}
            className="rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {user?.email || "Admin"}
            </span>
            <span className="text-xs text-gray-500">Administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
