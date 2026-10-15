"use server";

import prisma, {
  PapelUsuario,
  ModuloPago,
  StatusAssinatura,
  TipoLancamento,
  TipoOcupacao,
} from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { getServerSession } from "@/lib/auth/session";
import {
  onboardingCondominioSchema,
  type OnboardingCondominioInput,
} from "@/lib/validations/onboarding";

export interface ConviteGerado {
  email: string;
  unidade: string;
  tipoOcupacao: string;
  token: string;
  link: string;
}

export interface OnboardingResultado {
  condominioId: string;
  condominioNome: string;
  convitesGerados: ConviteGerado[];
}

export async function criarCondominioOnboarding(input: unknown) {
  try {
    const parsed = onboardingCondominioSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Dados inválidos.",
      };
    }

    const { admin, condominio, blocos, unidades, convites } = parsed.data;

    // 1. Identifica ou cria o usuário administrador (Síndico)
    let adminUserId: string;
    const session = await getServerSession();

    if (session?.user?.id) {
      adminUserId = session.user.id;
    } else {
      const existingUser = await prisma.user.findUnique({
        where: { email: admin.email },
      });

      if (existingUser) {
        adminUserId = existingUser.id;
      } else {
        if (!admin.password) {
          return {
            success: false,
            error: "Defina uma senha de acesso para sua conta de síndico.",
          };
        }

        const signUpRes = await auth.api.signUpEmail({
          body: {
            name: admin.nome,
            email: admin.email,
            password: admin.password,
          },
        });

        if (!signUpRes?.user) {
          return {
            success: false,
            error: "Não foi possível criar a conta de administrador.",
          };
        }

        adminUserId = signUpRes.user.id;
      }
    }

    // 2. Data atual e limites do período gratuito (60 dias de trial)
    const agora = new Date();
    const trialFim = new Date(agora.getTime() + 60 * 24 * 60 * 60 * 1000);
    const conviteExpiracao = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 3. Execução em transação no banco de dados
    const resultado = await prisma.$transaction(async (tx) => {
      // Cria o Condomínio
      const novoCondominio = await tx.condominio.create({
        data: {
          nome: condominio.nome,
          cnpj: condominio.cnpj || null,
          endereco: condominio.endereco,
          diaVencimento: condominio.diaVencimento,
          rateioTipo: condominio.rateioTipo,
        },
      });

      // Cria as Assinaturas de Módulos (NUCLEO com 60 dias de trial, DOCUMENTOS bloqueado)
      await tx.assinatura.createMany({
        data: [
          {
            condominioId: novoCondominio.id,
            modulo: ModuloPago.NUCLEO,
            status: StatusAssinatura.TRIAL,
            trialInicio: agora,
            trialFim: trialFim,
          },
          {
            condominioId: novoCondominio.id,
            modulo: ModuloPago.DOCUMENTOS,
            status: StatusAssinatura.EXPIRADA,
          },
        ],
      });

      // Vincula o Administrador como SINDICO
      await tx.membership.upsert({
        where: {
          userId_condominioId: {
            userId: adminUserId,
            condominioId: novoCondominio.id,
          },
        },
        update: {
          papel: PapelUsuario.SINDICO,
          ativo: true,
        },
        create: {
          userId: adminUserId,
          condominioId: novoCondominio.id,
          papel: PapelUsuario.SINDICO,
          ativo: true,
        },
      });

      // Cria Categorias Financeiras padrão
      await tx.lancamentoCategoria.createMany({
        data: [
          {
            condominioId: novoCondominio.id,
            nome: "Taxa Condominial",
            tipo: TipoLancamento.RECEITA,
          },
          {
            condominioId: novoCondominio.id,
            nome: "Fundo de Reserva",
            tipo: TipoLancamento.RECEITA,
          },
          {
            condominioId: novoCondominio.id,
            nome: "Multas e Juros",
            tipo: TipoLancamento.RECEITA,
          },
          {
            condominioId: novoCondominio.id,
            nome: "Manutenção e Conservação",
            tipo: TipoLancamento.DESPESA,
          },
          {
            condominioId: novoCondominio.id,
            nome: "Energia Elétrica e Água",
            tipo: TipoLancamento.DESPESA,
          },
          {
            condominioId: novoCondominio.id,
            nome: "Limpeza e Portaria",
            tipo: TipoLancamento.DESPESA,
          },
          {
            condominioId: novoCondominio.id,
            nome: "Administração e Softwares",
            tipo: TipoLancamento.DESPESA,
          },
        ],
      });

      // Cria os Blocos
      const blocoMap = new Map<string, string>();
      for (const b of blocos) {
        const blocoCriado = await tx.bloco.create({
          data: {
            condominioId: novoCondominio.id,
            nome: b.nome,
          },
        });
        blocoMap.set(b.nome, blocoCriado.id);
      }

      // Cria as Unidades com fração ideal distribuída
      const totalUnidades = unidades.length;
      const fracaoPadrao = Number((100 / totalUnidades).toFixed(4));
      const unidadeMap = new Map<string, string>();

      for (const u of unidades) {
        const blocoId = u.blocoNome ? blocoMap.get(u.blocoNome) || null : null;
        const unidadeCriada = await tx.unidade.create({
          data: {
            condominioId: novoCondominio.id,
            blocoId,
            identificador: u.identificador,
            fracaoIdeal: u.fracaoIdeal || fracaoPadrao,
          },
        });
        unidadeMap.set(u.identificador, unidadeCriada.id);
      }

      // Cria os Convites de Moradores
      const convitesGerados: ConviteGerado[] = [];
      for (const c of convites) {
        const unidadeId = unidadeMap.get(c.unidadeIdentificador);
        if (!unidadeId) continue;

        const token = crypto.randomUUID();
        await tx.convite.create({
          data: {
            condominioId: novoCondominio.id,
            unidadeId,
            email: c.email.toLowerCase(),
            tipoOcupacao: c.tipoOcupacao as TipoOcupacao,
            token,
            status: "PENDENTE",
            expiresAt: conviteExpiracao,
          },
        });

        convitesGerados.push({
          email: c.email,
          unidade: c.unidadeIdentificador,
          tipoOcupacao: c.tipoOcupacao,
          token,
          link: `/convite/${token}`,
        });
      }

      return {
        condominioId: novoCondominio.id,
        condominioNome: novoCondominio.nome,
        convitesGerados,
      };
    });

    return {
      success: true,
      data: resultado,
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao criar condomínio.";
    return { success: false, error: msg };
  }
}

