"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CvPrintPage() {
  const router = useRouter();
  useEffect(() => {
    window.print();
    const t = setTimeout(() => router.back(), 800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-black p-8 font-mono">
      <h1 className="text-2xl font-bold mb-4">Murillo Soares — CV</h1>
      <p>Para habilitar impressao formatada, adicione <code>public/gerador-cv.html</code>.</p>
    </div>
  );
}
