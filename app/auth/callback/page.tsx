"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ❗ สำคัญ: กัน Next.js prerender พัง
export const dynamic = "force-dynamic";

export default function CallbackPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const code = searchParams.get("code");

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

  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="text-center">

        <div className="text-xl font-bold mb-2">
          Support Team Bon
        </div>

        <div className="text-gray-600">
          {loading ? "Logging in with LINE..." : "Redirecting..."}
        </div>

      </div>

    </div>
  );
}