"use client";

import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserType } from "../../lib/schema";

interface DecodedToken {
  id: string;
  exp?: number;
}

interface ApiUserResponse {
  success: boolean;
  user: UserType;
}

export const useGetLoggedInUser = () => {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Memory cache (persists during session)
  const cache = useRef<{ user: any | null }>({ user: null });

  // ---------------------------------------------------------------------------
  // Fetch user by ID
  // ---------------------------------------------------------------------------
  const fetchUser = useCallback(async (userId: string) => {
    if (!userId) return;

    // If cached, reuse it
    if (cache.current.user) {
      setUser(cache.current.user);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: "GET",
      });

      if (!response.ok) {
        setUser(null);
        toast.error("Could not fetch user");
        setLoading(false);
        return;
      }

      const data: UserType = await response.json();
     console.log(data,"dataf fomr call");
      cache.current.user = data;
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      toast.error("Something went wrong retrieving your info.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Validate token and extract user ID
  // ---------------------------------------------------------------------------
  const validateToken = useCallback(() => {
    if (typeof window === "undefined") return null;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      router.push("/auth/login");
      return null;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        router.push("/auth/login");
        return null;
      }

      return decoded.id;
    } catch (err) {
      console.error("Token decoding failed:", err);
      localStorage.removeItem("token");
      toast.error("Invalid session. Please log in.");
      router.push("/auth/login");
      return null;
    }
  }, [router]);

  // ---------------------------------------------------------------------------
  // Run on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const userId = validateToken();
    if (userId) fetchUser(userId);
  }, [validateToken, fetchUser]);

  return { user, loading };
};
