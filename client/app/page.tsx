"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "@/components/LoginPage";
import { Api } from "@/lib/ApiEndpoint";

export default function Home() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    const res = await Api.loginUser({ email, password });

    // ✔ Store token in cookie so middleware can read it
    document.cookie = `access_token=${res.access_token}; path=/; max-age=86400; samesite=strict;`;

    router.push("/landing-page");
  };

  return <LoginPage onLogin={handleLogin} />;
}
