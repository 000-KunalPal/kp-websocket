"use client";
import { Home } from "@/components/home";
import { Login } from "@/components/login";
import { useState, useEffect } from "react";

export default function MainPage() {
  const [username, setUsername] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return username ? (
    <Home username={username} />
  ) : (
    <Login onSubmit={setUsername} />
  );
}
