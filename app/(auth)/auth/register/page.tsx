"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the onboarding request page
        router.replace("/auth/request");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse text-gray-500 font-medium">
                Redirection vers l'inscription...
            </div>
        </div>
    );
}
