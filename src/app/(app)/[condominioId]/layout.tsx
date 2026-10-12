import { redirect } from "next/navigation";
import { getServerSession, getCondominioMembership, getUserCondominios } from "@/lib/auth/session";
import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";
import prisma from "@/lib/db/prisma";

export default async function CondominioAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ condominioId: string }>;
}) {
  const resolvedParams = await params;
  const condominioId = resolvedParams.condominioId;

  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }

  const membership = await getCondominioMembership(condominioId);
  if (!membership || !membership.ativo) {
    redirect("/selecionar-condominio");
  }

  // Busca todos os condomínios aos quais o usuário tem acesso (para o switcher da sidebar)
  const todosMemberships = await getUserCondominios();
  const availableCondos = todosMemberships.map((m) => ({
    id: m.condominioId,
    nome: m.condominio.nome,
  }));

  // Busca informação de unidade se for morador
  const moradorPerfil = await prisma.moradorPerfil.findFirst({
    where: {
      userId: session.user.id,
      unidade: { condominioId },
    },
    include: {
      unidade: { include: { bloco: true } },
    },
  });

  const unidadeInfo = moradorPerfil
    ? `${moradorPerfil.unidade.identificador}${
        moradorPerfil.unidade.bloco ? ` · ${moradorPerfil.unidade.bloco.nome}` : ""
      }`
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Desktop (fixa a partir de md) */}
      <Sidebar
        condominioId={condominioId}
        condominioNome={membership.condominio.nome}
        userName={session.user.name || "Usuário"}
        userEmail={session.user.email}
        userPapel={membership.papel}
        userUnidadeInfo={unidadeInfo}
        availableCondos={availableCondos}
      />

      {/* Conteúdo Principal — com margem esquerda reservada no desktop para a sidebar */}
      <main className="md:pl-64 flex-1 transition-all">
        <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile (visível abaixo de md com os 3 itens) */}
      <BottomNav condominioId={condominioId} />
    </div>
  );
}
