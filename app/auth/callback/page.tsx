"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CallbackPage() {

  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    // ดึง code แบบ safe (กัน build crash)
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      router.replace("/");
      return;
    }

    const login = async () => {

      try {

        const res = await fetch("/api/line-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        console.log("LOGIN RESPONSE:", data);

        if (!res.ok || data?.error) {
          throw new Error("LOGIN FAILED");
        }

        localStorage.setItem("user", JSON.stringify(data));

        router.replace("/");

      } catch (err) {

        console.log("LOGIN ERROR:", err);

        router.replace("/");

      } finally {
        setLoading(false);
      }

    };

    login();

  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-xl font-bold">
          Support Team Bon
        </div>
        <div className="text-gray-600 mt-2">
          {loading ? "Logging in with LINE..." : "Redirecting..."}
        </div>
      </div>
    </div>
  );
}