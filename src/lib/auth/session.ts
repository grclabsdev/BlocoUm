import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";

export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    return null;
  }
}

export async function getCondominioMembership(condominioId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return null;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      condominioId,
      ativo: true,
    },
    include: {
      condominio: true,
      user: true,
    },
  });

  return membership;
}

export async function getUserCondominios() {
  const session = await getServerSession();
  if (!session?.user?.id) return [];

  const memberships = await prisma.membership.findMany({
    where: {
      userId: session.user.id,
      ativo: true,
    },
    include: {
      condominio: true,
    },
  });

  return memberships;
}

export async function requireAuthMembership(condominioId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Não autorizado. Faça login para continuar.");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      condominioId,
      ativo: true,
    },
    include: {
      condominio: true,
      user: true,
    },
  });

  if (!membership) {
    throw new Error("Acesso negado para este condomínio.");
  }

  const moradorPerfil = await prisma.moradorPerfil.findFirst({
    where: {
      userId: session.user.id,
      unidade: {
        condominioId,
      },
    },
    include: {
      unidade: true,
    },
  });

  return { session, membership, moradorPerfil };
}
