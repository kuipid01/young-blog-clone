"use client";

import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { user } from "../../lib/schema";

export const useGetLoggedInUserId = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this only runs on the client
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      router.push("/auth/login");
      return;
    }

    try {
      const decoded: { id: string; exp?: number } = jwtDecode(token);

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        router.push("/auth/login");
        return;
      }
       setUserId(decoded.id);
 
    } catch (authError) {
      console.error("Token decoding failed:", authError);
      localStorage.removeItem("token");
      toast.error("Invalid session data. Please log in.");
      router.push("/auth/login");
      setUserId(null);
    }
    console.log("interanl ran",);
  }, []);
  return { userId };
};
