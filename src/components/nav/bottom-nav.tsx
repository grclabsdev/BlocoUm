"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  condominioId: string;
}

export function BottomNav({ condominioId }: BottomNavProps) {
  const pathname = usePathname();

  const isLancamentos =
    pathname.includes("/lancamentos") && !pathname.endsWith("/novo");
  const isNovoLancamento = pathname.endsWith("/novo");
  const isInicio =
    pathname.endsWith("/dashboard") || pathname === `/${condominioId}`;

  return (
    <>
      <nav
        className={cn(
          "md:hidden fixed bottom-0 inset-x-0 z-40",
          "border-t bg-card/95 backdrop-blur shadow-lg",
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="relative grid grid-cols-3 items-end h-16 px-4">
          {/* 1. Lançamentos (esquerda) */}
          <Link
            href={`/${condominioId}/lancamentos`}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full text-xs font-medium transition-colors",
              isLancamentos ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            <Receipt className="h-5 w-5" />
            <span>Lançamentos</span>
          </Link>

          {/* 2. Novo lançamento — botão circular elevado, central, cor primária */}
          <div className="flex justify-center">
            <Link
              href={`/${condominioId}/lancamentos/novo`}
              aria-label="Novo lançamento"
              className={cn(
                "flex flex-col items-center justify-center",
                "-translate-y-4 h-14 w-14 rounded-full",
                "bg-primary text-primary-foreground shadow-xl ring-4 ring-background",
                "active:scale-95 transition-transform"
              )}
            >
              <PlusCircle className="h-7 w-7" />
            </Link>
          </div>

          {/* 3. Início (direita) */}
          <Link
            href={`/${condominioId}/dashboard`}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full text-xs font-medium transition-colors",
              isInicio ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            <Home className="h-5 w-5" />
            <span>Início</span>
          </Link>
        </div>
      </nav>

      {/* Espaçador para conteúdo não ser coberto no mobile */}
      <div className="md:hidden h-20" aria-hidden="true" />
    </>
  );
}
