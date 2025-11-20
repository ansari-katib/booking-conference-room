"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";

export default function AzureResponsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role") || "user";

    if (!token) {
      router.replace("/");
      return;
    }

    Cookies.set("access_token", token, {
      path: "/",
      sameSite: "strict",
      expires: 1, // 1 day
    });

    if (role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/landing-page");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      <p className="text-gray-600 text-sm">Completing secure sign-in…</p>
    </div>
  );
}

