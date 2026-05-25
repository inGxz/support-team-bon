"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const code = searchParams.get("code");

    if (!code) {
      router.push("/");
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

        if (!res.ok) {
          throw new Error("API error");
        }

        const data = await res.json();

        localStorage.setItem("user", JSON.stringify(data));

        router.push("/");

      } catch (err) {
        console.log(err);
        alert("Login failed");
        router.push("/");
      }

    };

    login();

  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl font-bold">
        {loading ? "Logging in with LINE..." : "Redirecting..."}
      </div>
    </div>
  );
}