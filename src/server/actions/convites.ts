"use server";

import prisma, { PapelUsuario } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { aceitarConviteSchema } from "@/lib/validations/auth";

export async function obterDadosConvite(token: string) {
  try {
    const convite = await prisma.convite.findUnique({
      where: { token },
      include: {
        condominio: true,
        unidade: { include: { bloco: true } },
      },
    });

    if (!convite) {
      return { success: false, error: "Convite não encontrado ou link inválido." };
    }

    if (convite.status !== "PENDENTE") {
      return { success: false, error: "Este convite já foi aceito ou expirou." };
    }

    if (new Date() > convite.expiresAt) {
      await prisma.convite.update({
        where: { id: convite.id },
        data: { status: "EXPIRADO" },
      });
      return { success: false, error: "Este convite expirou. Solicite um novo envio ao síndico." };
    }

    return {
      success: true,
      data: {
        email: convite.email,
        condominioNome: convite.condominio.nome,
        condominioId: convite.condominioId,
        unidadeIdentificador: convite.unidade.identificador,
        blocoNome: convite.unidade.bloco?.nome,
        tipoOcupacao: convite.tipoOcupacao,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao validar convite.";
    return { success: false, error: msg };
  }
}

export async function aceitarConvite(input: unknown) {
  try {
    const parsed = aceitarConviteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
    }

    const convite = await prisma.convite.findUnique({
      where: { token: parsed.data.token },
    });

    if (!convite || convite.status !== "PENDENTE" || new Date() > convite.expiresAt) {
      return { success: false, error: "Convite inválido ou expirado." };
    }

    // Cria a conta do usuário via Better Auth
    let userId: string;
    const existingUser = await prisma.user.findUnique({
      where: { email: convite.email },
    });

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const res = await auth.api.signUpEmail({
        body: {
          name: parsed.data.nome,
          email: convite.email,
          password: parsed.data.password,
        },
      });
      if (!res?.user) {
        return { success: false, error: "Não foi possível criar o usuário para o convite." };
      }
      userId = res.user.id;
    }

    // Vincula o Membership com papel MORADOR
    await prisma.membership.upsert({
      where: {
        userId_condominioId: {
          userId,
          condominioId: convite.condominioId,
        },
      },
      update: {
        papel: PapelUsuario.MORADOR,
        ativo: true,
      },
      create: {
        userId,
        condominioId: convite.condominioId,
        papel: PapelUsuario.MORADOR,
        ativo: true,
      },
    });

    // Cria perfil do morador na unidade
    await prisma.moradorPerfil.create({
      data: {
        userId,
        unidadeId: convite.unidadeId,
        tipoOcupacao: convite.tipoOcupacao,
      },
    });

    // Marca convite como aceito
    await prisma.convite.update({
      where: { id: convite.id },
      data: { status: "ACEITO" },
    });

    return {
      success: true,
      data: {
        condominioId: convite.condominioId,
        email: convite.email,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao processar convite.";
    return { success: false, error: msg };
  }
}
