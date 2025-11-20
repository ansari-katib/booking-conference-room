// @/hooks/useCurrentUser.ts
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Api } from "@/lib/ApiEndpoint";

interface DecodedToken {
  sub: string;
  email?: string;
  role?: string;
}

interface CurrentUser {
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
  isLoading: boolean;
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<CurrentUser>({
    userId: "",
    fullName: null,
    email: null,
    role: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = Cookies.get("access_token");

    if (!token) {
      setUser({
        userId: "",
        fullName: null,
        email: null,
        role: null,
        isLoading: false,
      });
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const userId = decoded.sub;

      // Now call your real API that needs the ID
      Api.currentUser(userId)
        .then((data) => {
          setUser({
            userId,
            fullName: data.fullName || data.name || "User",
            email: data.email || null,
            role: data.role || decoded.role || "user",
            isLoading: false,
          });
        })
        .catch(() => {
          // Fallback if API fails
          setUser({
            userId,
            fullName: "User",
            email: decoded.email || null,
            role: decoded.role || "user",
            isLoading: false,
          });
        });
    } catch (err) {
      setUser({
        userId: "",
        fullName: null,
        email: null,
        role: null,
        isLoading: false,
      });
    }
  }, []);

  return user;
}