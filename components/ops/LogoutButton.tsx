"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      className="ops-logout-link"
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      <i
        className="fa-solid fa-arrow-right-from-bracket"
        aria-hidden="true"
      />
      <span>{isLoggingOut ? "A sair..." : "Sair"}</span>
    </button>
  );
}
