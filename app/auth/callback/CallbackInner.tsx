"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackInner() {

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {

    const code = searchParams.get("code");

    if (!code) return;

    const login = async () => {

      const res = await fetch("/api/line-login", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      localStorage.setItem("user", JSON.stringify(data));

      router.push("/");

    };

    login();

  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl font-bold">
        Logging in with LINE...
      </div>
    </div>
  );
}