"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Triangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearSession, getSession, SESSION_STORAGE_KEY } from "@/lib/session";

const menuItems = [
  { href: "/dashboard", label: "Painel" },
  { href: "/obras", label: "Obras" },
  { href: "/itens", label: "Itens" },
  { href: "/servicos", label: "Serviços" },
  { href: "/etapas", label: "Etapas" },
  { href: "/cronograma", label: "Cronograma" },
  { href: "/lob", label: "L.O.B" },
  { href: "/configuracoes", label: "Configurações" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState(() => (typeof window === "undefined" ? null : getSession()));
  const [verificado, setVerificado] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setUsuario(null);
      setVerificado(true);
      router.replace("/login");
      return;
    }
    setUsuario(session);
    setVerificado(true);
  }, [router]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY) {
        const session = getSession();
        setUsuario(session);
        if (!session) {
          router.replace("/login");
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!verificado || !usuario) {
    return null;
  }

  const initials = usuario.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="min-h-screen bg-surface/80">
      <header className="border-b border-[var(--border)] bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-5 md:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-[var(--accent-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)] shadow-sm transition hover:bg-[var(--accent-muted)]/80"
          >
            <Triangle className="h-3.5 w-3.5 rotate-90" />
            Construtiva
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-foreground-muted md:flex">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 transition hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] ${pathname?.startsWith(item.href) ? "bg-[var(--accent-muted)] text-[var(--accent)] shadow-sm" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="relative flex items-center gap-3" ref={menuRef}>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-muted)] text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent-muted)]/80"
              onClick={() => setMenuAberto((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={menuAberto}
            >
              {initials || "U"}
            </button>
            {menuAberto ? (
              <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl border border-[var(--border)] bg-white shadow-xl">
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{usuario.nome}</p>
                  <p className="text-xs text-foreground-muted">Usuário do sistema</p>
                </div>
                <div className="flex flex-col gap-1 px-2 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-start rounded-xl px-3 py-2 text-sm font-medium"
                    onClick={() => {
                      setMenuAberto(false);
                      router.push("/configuracoes");
                    }}
                  >
                    Trocar senha
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-start rounded-xl px-3 py-2 text-sm font-medium text-[var(--danger)] hover:text-[var(--danger)]"
                    onClick={() => {
                      clearSession();
                      setUsuario(null);
                      setMenuAberto(false);
                      router.replace("/login");
                    }}
                  >
                    Sair
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-8 md:px-8">
        {children}
      </main>
    </div>
  );
}
