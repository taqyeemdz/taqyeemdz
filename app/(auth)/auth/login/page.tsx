"use client";

import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full flex justify-center">
        <Suspense fallback={
          <div className="bg-white border border-slate-100 shadow-2xl p-8 rounded-[2.5rem] w-full max-w-md flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Initialisation...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
