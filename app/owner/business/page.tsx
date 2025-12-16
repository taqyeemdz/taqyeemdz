"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Plus,
  QrCode,
  ChevronRight,
  MoreHorizontal,
  Star
} from "lucide-react";
import { QRCodeSVG as QRCode } from "qrcode.react";

export default function OwnerBusinessPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return router.replace("/auth/login");

      const { data: links, error } = await supabase
        .from("user_business")
        .select("business_id, businesses(*)")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching businesses:", error);
      } else if (links) {
        const businessList = links.map((link: any) => link.businesses);
        setBusinesses(businessList);
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className=" mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your businesses and view feedback.</p>
        </div>
        <button
          onClick={() => router.push("/owner/business/new")}
          className="group flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full font-medium shadow-lg shadow-gray-200 hover:shadow-xl hover:scale-105 transition-all active:scale-95"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>New Business</span>
        </button>
      </div>

      {/* CONTENT */}
      {businesses.length > 0 ? (
        <div className="flex flex-col gap-4">
          {businesses.map((b) => (
            <BusinessRow key={b.id} business={b} router={router} />
          ))}
        </div>
      ) : (
        <EmptyState router={router} />
      )}
    </div>
  );
}

function BusinessRow({ business, router }: { business: any, router: any }) {
  const [showQr, setShowQr] = useState(false);
  const feedbackLink = `${window.location.origin}/client/feedback/${business.id}`;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="p-5 flex flex-col md:flex-row items-start md:items-center gap-6">

        {/* ICON / AVATAR */}
        <div
          onClick={() => router.push(`/owner/business/${business.id}`)}
          className="w-16 h-16 shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center cursor-pointer transform group-hover:scale-105 transition-transform"
        >
          <Building2 size={32} strokeWidth={1.5} />
        </div>

        {/* INFO */}
        <div
          onClick={() => router.push(`/owner/business/${business.id}`)}
          className="flex-1 cursor-pointer min-w-0"
        >
          <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {business.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
            {business.address && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="shrink-0" />
                <span className="truncate max-w-[200px]">{business.address}</span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={14} className="shrink-0" />
                <span>{business.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-gray-100">
          <button
            onClick={(e) => { e.stopPropagation(); setShowQr(!showQr); }}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${showQr ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            title="Show Details"
          >
            <QrCode size={18} />
          </button>

          <button
            onClick={() => router.push(`/owner/business/${business.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors ml-auto md:ml-0"
          >
            <span>Manage</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* EXPANDABLE QR AREA */}
      {showQr && (
        <div className="bg-gray-50 border-t border-gray-100 p-6 flex flex-col items-center animate-in slide-in-from-top-2 duration-200">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <QRCode value={feedbackLink} size={160} />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">Scan to give feedback</p>
          <a
            href={feedbackLink}
            target="_blank"
            rel="noreferrer"
            className="mt-1 text-xs text-indigo-500 hover:underline"
          >
            {feedbackLink}
          </a>
        </div>
      )}
    </div>
  );
}

function EmptyState({ router }: { router: any }) {
  return (
    <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center">
      <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 text-gray-400">
        <Building2 size={32} />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">No businesses yet</h2>
      <p className="text-gray-500 max-w-sm mx-auto mb-8">
        Get started by adding your first business. You'll be able to collect feedback and manage your profile.
      </p>
      <button
        onClick={() => router.push("/owner/business/new")}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all"
      >
        <Plus size={20} />
        <span>Create Business</span>
      </button>
    </div>
  );
}
