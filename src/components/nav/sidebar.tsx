"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Receipt,
  PlusCircle,
  Users,
  Megaphone,
  CalendarCheck2,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/auth-client";

interface SidebarProps {
  condominioId: string;
  condominioNome: string;
  userName: string;
  userEmail: string;
  userPapel: string;
  userUnidadeInfo?: string;
  availableCondos?: Array<{ id: string; nome: string }>;
}

export function Sidebar({
  condominioId,
  condominioNome,
  userName,
  userEmail,
  userPapel,
  userUnidadeInfo,
  availableCondos = [],
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    {
      label: "Início",
      href: `/${condominioId}/dashboard`,
      icon: Home,
      active: pathname.endsWith("/dashboard") || pathname === `/${condominioId}`,
    },
    {
      label: "Lançamentos",
      href: `/${condominioId}/lancamentos`,
      icon: Receipt,
      active: pathname.includes("/lancamentos") && !pathname.endsWith("/novo"),
    },
    {
      label: "Moradores",
      href: `/${condominioId}/moradores`,
      icon: Users,
      active: pathname.includes("/moradores"),
    },
    {
      label: "Comunicados",
      href: `/${condominioId}/comunicados`,
      icon: Megaphone,
      active: pathname.includes("/comunicados"),
    },
    {
      label: "Reservas",
      href: `/${condominioId}/reservas`,
      icon: CalendarCheck2,
      active: pathname.includes("/reservas"),
    },
    {
      label: "Ocorrências",
      href: `/${condominioId}/ocorrencias`,
      icon: AlertTriangle,
      active: pathname.includes("/ocorrencias"),
    },
    {
      label: "Documentos",
      href: `/${condominioId}/documentos`,
      icon: FileText,
      active: pathname.includes("/documentos"),
    },
    {
      label: "Configurações",
      href: `/${condominioId}/configuracoes`,
      icon: Settings,
      active: pathname.includes("/configuracoes"),
    },
  ];

  async function handleLogout() {
    if (mobileOpen) setMobileOpen(false);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    ? userName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "US";

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Topo: Condomínio + Switcher */}
      <div className={cn("p-4 shrink-0", isMobile && "pr-12")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg border bg-muted/40 p-2.5 text-left transition hover:bg-muted/70 cursor-pointer">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {condominioNome}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Papel: {userPapel}
                </p>
              </div>
              {availableCondos.length > 1 && (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
          </DropdownMenuTrigger>
          {availableCondos.length > 1 && (
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Alternar Condomínio</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableCondos.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                    router.push(`/${c.id}/dashboard`);
                  }}
                  className={cn(
                    "cursor-pointer",
                    c.id === condominioId && "font-bold text-primary"
                  )}
                >
                  {c.nome}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>

      <Separator />

      {/* Navegação principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile) setMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Separator className="my-3" />

        {/* Botão em destaque "Novo lançamento" */}
        <Button asChild className="w-full justify-start gap-2 shadow-xs">
          <Link
            href={`/${condominioId}/lancamentos/novo`}
            onClick={() => {
              if (isMobile) setMobileOpen(false);
            }}
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span>Novo lançamento</span>
          </Link>
        </Button>
      </nav>

      <Separator />

      {/* Rodapé: Perfil e Logout */}
      <div className="flex items-center gap-3 p-3 bg-muted/20">
        <Avatar className="h-9 w-9 shrink-0 border">
          <AvatarImage src="" alt={userName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">
            {userName}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {userUnidadeInfo || userEmail}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
          title="Sair da conta"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sair</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* BARRA SUPERIOR MOBILE COM BOTÃO HAMBÚRGUER (< md)               */}
      {/* ---------------------------------------------------------------- */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 border-b bg-card/95 backdrop-blur flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm truncate text-foreground">
            {condominioNome}
          </span>
        </div>

        <SheetTrigger isOpen={mobileOpen} onOpenChange={setMobileOpen}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu de navegação"
            className="shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <SheetContent side="left" className="p-0 w-72 sm:w-80">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            {renderNavContent(true)}
          </SheetContent>
        </SheetTrigger>
      </header>

      {/* Espaçador superior para o conteúdo principal no mobile */}
      <div className="md:hidden h-14" aria-hidden="true" />

      {/* ---------------------------------------------------------------- */}
      {/* SIDEBAR DESKTOP FIXA (>= md)                                     */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col",
          "fixed inset-y-0 left-0 z-40 w-64",
          "border-r bg-card/95 backdrop-blur shadow-xs"
        )}
      >
        {renderNavContent(false)}
      </aside>
    </>
  );
}
