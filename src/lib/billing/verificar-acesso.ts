import prisma from '@/lib/db/prisma';
import type { ModuloPago } from '@/lib/db/prisma';

export type StatusAcessoModulo = 'LIBERADO' | 'PLANO_EXPIRADO' | 'MODULO_NAO_CONTRATADO';

/**
 * Verifica se o condomínio possui acesso liberado para gravação/mutação no módulo especificado.
 *
 * - NUCLEO: 2 meses de teste grátis (TRIAL). Se expirado ou cancelado sem pagamento ativo -> PLANO_EXPIRADO.
 * - DOCUMENTOS: módulo pago avulso (sem trial). Se não tiver assinatura ativa -> MODULO_NAO_CONTRATADO.
 *
 * Leitura nunca é bloqueada pelo helper; ele é chamado em toda Server Action de mutação.
 */
export async function verificarAcesso(
  condominioId: string,
  modulo: ModuloPago,
): Promise<StatusAcessoModulo> {
  const agora = new Date();

  const assinatura = await prisma.assinatura.findUnique({
    where: {
      condominioId_modulo: {
        condominioId,
        modulo,
      },
    },
  });

  if (modulo === 'NUCLEO') {
    if (!assinatura) {
      // Se não houver assinatura registrada, consideramos expirada
      return 'PLANO_EXPIRADO';
    }

    if (assinatura.status === 'TRIAL' && assinatura.trialFim && assinatura.trialFim > agora) {
      return 'LIBERADO';
    }

    if (assinatura.status === 'ATIVA' && (!assinatura.validaAte || assinatura.validaAte > agora)) {
      return 'LIBERADO';
    }

    return 'PLANO_EXPIRADO';
  }

  if (modulo === 'DOCUMENTOS') {
    if (!assinatura) {
      return 'MODULO_NAO_CONTRATADO';
    }

    if (assinatura.status === 'ATIVA' && (!assinatura.validaAte || assinatura.validaAte > agora)) {
      return 'LIBERADO';
    }

    return 'MODULO_NAO_CONTRATADO';
  }

  return 'LIBERADO';
}

export interface InfoStatusPlano {
  status: 'TRIAL' | 'ATIVA' | 'EXPIRADA' | 'CANCELADA';
  diasRestantesTrial: number;
  validaAte: Date | null;
  trialFim: Date | null;
  isTrial: boolean;
  isUrgente: boolean; // últimos 7 dias de trial
  isExpirado: boolean;
  nomePlano: string;
}

/**
 * Retorna as informações do plano NÚCLEO para exibição no PlanoStatusCard da Sidebar e Menu Mobile.
 */
export async function obterInfoPlano(condominioId: string): Promise<InfoStatusPlano> {
  const agora = new Date();

  const assinatura = await prisma.assinatura.findUnique({
    where: {
      condominioId_modulo: {
        condominioId,
        modulo: 'NUCLEO',
      },
    },
  });

  if (!assinatura) {
    return {
      status: 'EXPIRADA',
      diasRestantesTrial: 0,
      validaAte: null,
      trialFim: null,
      isTrial: false,
      isUrgente: false,
      isExpirado: true,
      nomePlano: 'Plano Núcleo',
    };
  }

  const isTrial = assinatura.status === 'TRIAL';
  let diasRestantesTrial = 0;

  if (isTrial && assinatura.trialFim) {
    const diffMs = assinatura.trialFim.getTime() - agora.getTime();
    diasRestantesTrial = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const isExpirado =
    (isTrial && diasRestantesTrial === 0) ||
    assinatura.status === 'EXPIRADA' ||
    assinatura.status === 'CANCELADA' ||
    (assinatura.status === 'ATIVA' && !!assinatura.validaAte && assinatura.validaAte <= agora);

  const isUrgente = isTrial && diasRestantesTrial > 0 && diasRestantesTrial <= 7;

  return {
    status: assinatura.status,
    diasRestantesTrial,
    validaAte: assinatura.validaAte,
    trialFim: assinatura.trialFim,
    isTrial,
    isUrgente,
    isExpirado,
    nomePlano: 'Plano Núcleo',
  };
}
