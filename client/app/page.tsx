"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "@/components/LoginPage";

export default function Home() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/landing-page");
  };

  return <LoginPage onLogin={handleLogin} />;
}
