import "dotenv/config";
import { prisma, PapelUsuario, TipoOcupacao, TipoLancamento, StatusCobranca, StatusOcorrencia } from "../src/lib/db/prisma";
import { auth } from "../src/lib/auth/auth";

async function getOrCreateUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });
  if (existing && existing.accounts.length > 0) {
    return existing;
  }

  if (existing && existing.accounts.length === 0) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const res = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  return await prisma.user.findUniqueOrThrow({ where: { id: res.user.id } });
}

async function main() {
  console.log("🌱 Iniciando seed do condomínio BlocoUm...");

  // 1. Condomínio de exemplo
  const condominio = await prisma.condominio.upsert({
    where: { id: "condo-solar-acacias" },
    update: {},
    create: {
      id: "condo-solar-acacias",
      nome: "Condomínio Edifício Solar das Acácias",
      cnpj: "12.345.678/0001-90",
      endereco: "Rua das Acácias, 450 - Bairro Jardim, São Paulo - SP",
      rateioTipo: "FRACAO_IDEAL",
      diaVencimento: 10,
      multaAtrasoPct: 2.0,
      jurosMesPct: 1.0,
    },
  });
  console.log(`✓ Condomínio: ${condominio.nome} (${condominio.id})`);

  // 1.1 Planos configuráveis
  const planoNucleo = await prisma.plano.upsert({
    where: { id: "plano-nucleo-padrao" },
    update: {},
    create: {
      id: "plano-nucleo-padrao",
      modulo: "NUCLEO",
      nome: "Plano Núcleo (Gestão Completa)",
      valorMensal: 99.0,
      ativo: true,
    },
  });

  const planoDocumentos = await prisma.plano.upsert({
    where: { id: "plano-documentos-padrao" },
    update: {},
    create: {
      id: "plano-documentos-padrao",
      modulo: "DOCUMENTOS",
      nome: "Módulo Documentos (Armazenamento em Nuvem)",
      valorMensal: 49.0,
      ativo: true,
    },
  });

  // 1.2 Assinaturas do condomínio (2 meses grátis de Núcleo, Documentos expirado)
  const agora = new Date();
  const em60Dias = new Date(agora.getTime() + 60 * 24 * 60 * 60 * 1000);

  await prisma.assinatura.upsert({
    where: {
      condominioId_modulo: {
        condominioId: condominio.id,
        modulo: "NUCLEO",
      },
    },
    update: {},
    create: {
      condominioId: condominio.id,
      modulo: "NUCLEO",
      planoId: planoNucleo.id,
      status: "TRIAL",
      trialInicio: agora,
      trialFim: em60Dias,
    },
  });

  await prisma.assinatura.upsert({
    where: {
      condominioId_modulo: {
        condominioId: condominio.id,
        modulo: "DOCUMENTOS",
      },
    },
    update: {},
    create: {
      condominioId: condominio.id,
      modulo: "DOCUMENTOS",
      planoId: planoDocumentos.id,
      status: "EXPIRADA",
    },
  });
  console.log(`✓ Assinaturas provisionadas (Núcleo com 60 dias de trial, Documentos bloqueado)`);

  // 2. Blocos (2 blocos)
  const blocoA = await prisma.bloco.upsert({
    where: { id: "bloco-a" },
    update: {},
    create: {
      id: "bloco-a",
      condominioId: condominio.id,
      nome: "Bloco A (Torre Sul)",
    },
  });

  const blocoB = await prisma.bloco.upsert({
    where: { id: "bloco-b" },
    update: {},
    create: {
      id: "bloco-b",
      condominioId: condominio.id,
      nome: "Bloco B (Torre Norte)",
    },
  });
  console.log("✓ 2 Blocos criados (Bloco A e Bloco B)");

  // 3. Unidades (6 unidades — frações ideais somando exatamente 100%)
  // Bloco A: 15% + 15% + 20% = 50%
  // Bloco B: 15% + 15% + 20% = 50%
  const unidadesData = [
    { id: "unid-a-101", blocoId: blocoA.id, identificador: "Apto 101", fracaoIdeal: 15.0 },
    { id: "unid-a-102", blocoId: blocoA.id, identificador: "Apto 102", fracaoIdeal: 15.0 },
    { id: "unid-a-201", blocoId: blocoA.id, identificador: "Apto 201", fracaoIdeal: 20.0 },
    { id: "unid-b-101", blocoId: blocoB.id, identificador: "Apto 101", fracaoIdeal: 15.0 },
    { id: "unid-b-102", blocoId: blocoB.id, identificador: "Apto 102", fracaoIdeal: 15.0 },
    { id: "unid-b-201", blocoId: blocoB.id, identificador: "Apto 201", fracaoIdeal: 20.0 },
  ];

  const unidades = [];
  for (const u of unidadesData) {
    const unidade = await prisma.unidade.upsert({
      where: { id: u.id },
      update: { fracaoIdeal: u.fracaoIdeal },
      create: {
        id: u.id,
        condominioId: condominio.id,
        blocoId: u.blocoId,
        identificador: u.identificador,
        fracaoIdeal: u.fracaoIdeal,
      },
    });
    unidades.push(unidade);
  }
  console.log("✓ 6 Unidades criadas (Frações ideais somam 100.00%)");

  // 4. Usuários (1 Síndico + 3 Moradores)
  const sindicoUser = await getOrCreateUser("Carlos Silva (Síndico)", "sindico@solardasacacias.com.br", "SenhaForte123!");
  const morador1 = await getOrCreateUser("Ana Souza", "morador1@solardasacacias.com.br", "SenhaForte123!");
  const morador2 = await getOrCreateUser("Bruno Oliveira", "morador2@solardasacacias.com.br", "SenhaForte123!");
  const morador3 = await getOrCreateUser("Carla Mendes", "morador3@solardasacacias.com.br", "SenhaForte123!");

  // Memberships
  await prisma.membership.upsert({
    where: { userId_condominioId: { userId: sindicoUser.id, condominioId: condominio.id } },
    update: { papel: PapelUsuario.SINDICO, ativo: true },
    create: {
      userId: sindicoUser.id,
      condominioId: condominio.id,
      papel: PapelUsuario.SINDICO,
      ativo: true,
    },
  });

  const moradoresConfigs = [
    { user: morador1, unidadeId: "unid-a-101", tipo: TipoOcupacao.PROPRIETARIO },
    { user: morador2, unidadeId: "unid-a-102", tipo: TipoOcupacao.INQUILINO },
    { user: morador3, unidadeId: "unid-b-201", tipo: TipoOcupacao.PROPRIETARIO },
  ];

  for (const mc of moradoresConfigs) {
    await prisma.membership.upsert({
      where: { userId_condominioId: { userId: mc.user.id, condominioId: condominio.id } },
      update: { papel: PapelUsuario.MORADOR, ativo: true },
      create: {
        userId: mc.user.id,
        condominioId: condominio.id,
        papel: PapelUsuario.MORADOR,
        ativo: true,
      },
    });

    const existingPerfil = await prisma.moradorPerfil.findFirst({
      where: { userId: mc.user.id, unidadeId: mc.unidadeId },
    });
    if (!existingPerfil) {
      await prisma.moradorPerfil.create({
        data: {
          userId: mc.user.id,
          unidadeId: mc.unidadeId,
          tipoOcupacao: mc.tipo,
        },
      });
    }
  }
  console.log("✓ Usuários e Memberships configurados (1 Síndico + 3 Moradores vinculados)");

  // 5. Categorias Financeiras
  const catTaxa = await prisma.lancamentoCategoria.upsert({
    where: { id: "cat-taxa" },
    update: {},
    create: { id: "cat-taxa", condominioId: condominio.id, nome: "Taxa Condominial Ordinária", tipo: TipoLancamento.RECEITA },
  });
  const catFundo = await prisma.lancamentoCategoria.upsert({
    where: { id: "cat-fundo" },
    update: {},
    create: { id: "cat-fundo", condominioId: condominio.id, nome: "Fundo de Reserva", tipo: TipoLancamento.RECEITA },
  });
  const catManutencao = await prisma.lancamentoCategoria.upsert({
    where: { id: "cat-manutencao" },
    update: {},
    create: { id: "cat-manutencao", condominioId: condominio.id, nome: "Manutenção e Conservação", tipo: TipoLancamento.DESPESA },
  });
  const catEnergia = await prisma.lancamentoCategoria.upsert({
    where: { id: "cat-energia" },
    update: {},
    create: { id: "cat-energia", condominioId: condominio.id, nome: "Energia Elétrica Áreas Comuns", tipo: TipoLancamento.DESPESA },
  });
  const catLimpeza = await prisma.lancamentoCategoria.upsert({
    where: { id: "cat-limpeza" },
    update: {},
    create: { id: "cat-limpeza", condominioId: condominio.id, nome: "Limpeza e Portaria", tipo: TipoLancamento.DESPESA },
  });
  console.log("✓ Categorias de lançamento criadas");

  // 6. Lançamentos dos últimos meses (para gráfico e balanço)
  const hoje = new Date();
  for (let m = 5; m >= 0; m--) {
    const dataMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - m, 15));
    // Receita de taxa
    await prisma.lancamento.create({
      data: {
        condominioId: condominio.id,
        categoriaId: catTaxa.id,
        tipo: TipoLancamento.RECEITA,
        descricao: `Taxa condominial mês ${dataMes.getUTCMonth() + 1}/${dataMes.getUTCFullYear()}`,
        valor: 12000.0,
        data: dataMes,
      },
    });
    // Despesa de limpeza/portaria
    await prisma.lancamento.create({
      data: {
        condominioId: condominio.id,
        categoriaId: catLimpeza.id,
        tipo: TipoLancamento.DESPESA,
        descricao: `Folha terceirizada de portaria e limpeza ${dataMes.getUTCMonth() + 1}/${dataMes.getUTCFullYear()}`,
        valor: 5800.0,
        data: new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - m, 5)),
      },
    });
    // Despesa de energia
    await prisma.lancamento.create({
      data: {
        condominioId: condominio.id,
        categoriaId: catEnergia.id,
        tipo: TipoLancamento.DESPESA,
        descricao: `Conta de luz Enel ${dataMes.getUTCMonth() + 1}/${dataMes.getUTCFullYear()}`,
        valor: 1450.0 + (m * 40),
        data: new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - m, 10)),
      },
    });
    // Despesa manutenção esporádica
    if (m % 2 === 0) {
      await prisma.lancamento.create({
        data: {
          condominioId: condominio.id,
          categoriaId: catManutencao.id,
          tipo: TipoLancamento.DESPESA,
          descricao: `Manutenção bombas d'água e extintores`,
          valor: 920.0,
          data: new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - m, 20)),
        },
      });
    }
  }
  console.log("✓ Lançamentos financeiros históricos gerados (últimos 6 meses)");

  // 7. Cobranças para as unidades (mês atual e anterior)
  const mesAtual = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
  const mesAnterior = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, 1));
  const vencimentoMesAnterior = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, 10));
  const vencimentoMesAtual = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 10));

  for (const u of unidades) {
    const valBase = Number(u.fracaoIdeal) * 80; // ex: 15% -> R$ 1.200, 20% -> R$ 1.600

    // Cobrança mês anterior
    const isAtrasado = u.id === "unid-b-102"; // uma atrasada para demonstrar cálculo de multa/juros
    const statusAnt = isAtrasado ? StatusCobranca.ATRASADO : StatusCobranca.PAGO;
    const diasAtraso = 25;
    const multa = valBase * 0.02;
    const juros = (valBase * 0.01 / 30) * diasAtraso;
    const valAtual = isAtrasado ? (valBase + multa + juros) : valBase;

    await prisma.cobranca.upsert({
      where: { unidadeId_competencia: { unidadeId: u.id, competencia: mesAnterior } },
      update: {},
      create: {
        unidadeId: u.id,
        competencia: mesAnterior,
        valorOriginal: valBase,
        valorAtual: valAtual,
        vencimento: vencimentoMesAnterior,
        status: statusAnt,
        pagoEm: isAtrasado ? null : vencimentoMesAnterior,
      },
    });

    // Cobrança mês atual (PENDENTE)
    await prisma.cobranca.upsert({
      where: { unidadeId_competencia: { unidadeId: u.id, competencia: mesAtual } },
      update: {},
      create: {
        unidadeId: u.id,
        competencia: mesAtual,
        valorOriginal: valBase,
        valorAtual: valBase,
        vencimento: vencimentoMesAtual,
        status: StatusCobranca.PENDENTE,
      },
    });
  }
  console.log("✓ Cobranças geradas para as 6 unidades (incluindo 1 atrasada para cálculo de multa/juros)");

  // 8. Áreas Comuns
  const salao = await prisma.areaComum.upsert({
    where: { id: "area-salao" },
    update: {},
    create: {
      id: "area-salao",
      condominioId: condominio.id,
      nome: "Salão de Festas com Espaço Gourmet",
      antecedenciaMinHrs: 24,
    },
  });

  const churrasqueira = await prisma.areaComum.upsert({
    where: { id: "area-churras" },
    update: {},
    create: {
      id: "area-churras",
      condominioId: condominio.id,
      nome: "Churrasqueira da Piscina",
      antecedenciaMinHrs: 12,
    },
  });
  console.log("✓ Áreas comuns cadastradas (Salão de Festas e Churrasqueira)");

  // 9. Reservas
  const dataReservaFutura = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() + 3, 18, 0));
  const dataReservaFuturaFim = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() + 3, 23, 0));

  await prisma.reserva.create({
    data: {
      areaComumId: salao.id,
      unidadeId: "unid-a-101",
      inicio: dataReservaFutura,
      fim: dataReservaFuturaFim,
      status: "CONFIRMADA",
      criadoPor: morador1.id,
    },
  });
  console.log("✓ Reserva confirmada criada");

  // 10. Comunicados
  await prisma.comunicado.create({
    data: {
      condominioId: condominio.id,
      titulo: "Limpeza das caixas d'água semestral",
      corpo: "Prezados condôminos, na próxima quarta-feira das 08h às 17h realizaremos a higienização das caixas d'água. Solicitamos economia no consumo de água durante o período.",
      blocoId: null, // Todos os blocos
    },
  });

  await prisma.comunicado.create({
    data: {
      condominioId: condominio.id,
      titulo: "Pintura dos corredores do Bloco A",
      corpo: "Informamos aos moradores do Bloco A que a equipe de pintura iniciará os trabalhos no 2º andar na quinta-feira.",
      blocoId: blocoA.id,
    },
  });
  console.log("✓ Comunicados publicados (1 geral e 1 para Bloco A)");

  // 11. Ocorrências
  const ocorrencia1 = await prisma.ocorrencia.create({
    data: {
      condominioId: condominio.id,
      unidadeId: "unid-a-101",
      categoria: "Manutenção Predial",
      titulo: "Lâmpada do hall do 1º andar piscando",
      descricao: "A lâmpada LED em frente ao elevador social está oscilando constantemente.",
      status: StatusOcorrencia.EM_ANDAMENTO,
      criadoPor: morador1.id,
      atribuidoA: sindicoUser.id,
    },
  });

  await prisma.ocorrenciaComentario.create({
    data: {
      ocorrenciaId: ocorrencia1.id,
      autorId: sindicoUser.id,
      texto: "Chamado recebido e repassado ao zelador para troca nesta manhã.",
    },
  });

  await prisma.ocorrencia.create({
    data: {
      condominioId: condominio.id,
      unidadeId: "unid-b-201",
      categoria: "Barulho / Convivência",
      titulo: "Ruído excessivo após as 22h",
      descricao: "Houve som alto e movimentação no corredor próximo à meia-noite.",
      status: StatusOcorrencia.ABERTA,
      criadoPor: morador3.id,
    },
  });
  console.log("✓ Ocorrências com comentários criadas");

  // 12. Documentos
  await prisma.documento.createMany({
    data: [
      {
        condominioId: condominio.id,
        categoria: "CONVENCAO",
        titulo: "Convenção do Condomínio Edifício Solar das Acácias",
        arquivoUrl: "https://exemplo.com/docs/convencao.pdf",
        visivelPara: "TODOS",
      },
      {
        condominioId: condominio.id,
        categoria: "REGIMENTO",
        titulo: "Regimento Interno e Normas de Convivência",
        arquivoUrl: "https://exemplo.com/docs/regimento.pdf",
        visivelPara: "TODOS",
      },
      {
        condominioId: condominio.id,
        categoria: "ATA",
        titulo: "Ata da Assembleia Geral Ordinária de Eleição e Orçamento",
        arquivoUrl: "https://exemplo.com/docs/ata-ago-2026.pdf",
        visivelPara: "TODOS",
      },
      {
        condominioId: condominio.id,
        categoria: "OUTRO",
        titulo: "Parecer Fiscal do Conselho Consultivo - 1º Trimestre",
        arquivoUrl: "https://exemplo.com/docs/parecer-conselho.pdf",
        visivelPara: "CONSELHO",
      },
    ],
  });
  console.log("✓ Documentos do condomínio cadastrados");

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("-------------------------------------------------------------------");
  console.log("Condomínio ID: condo-solar-acacias");
  console.log("Síndico: sindico@solardasacacias.com.br / Senha: SenhaForte123!");
  console.log("Moradores: morador1@solardasacacias.com.br (Apto 101 Bloco A)");
  console.log("           morador2@solardasacacias.com.br (Apto 102 Bloco A)");
  console.log("           morador3@solardasacacias.com.br (Apto 201 Bloco B)");
  console.log("           Senha para todos: SenhaForte123!");
  console.log("-------------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
