-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PapelUsuario" AS ENUM ('SINDICO', 'SUBSINDICO', 'CONSELHEIRO', 'MORADOR', 'FUNCIONARIO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TipoOcupacao" AS ENUM ('PROPRIETARIO', 'INQUILINO', 'DEPENDENTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TipoLancamento" AS ENUM ('RECEITA', 'DESPESA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "StatusCobranca" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "StatusOcorrencia" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'RESOLVIDA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "StatusAssinatura" AS ENUM ('TRIAL', 'ATIVA', 'EXPIRADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ModuloPago" AS ENUM ('NUCLEO', 'DOCUMENTOS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuer" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Condominio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "endereco" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rateioTipo" TEXT NOT NULL DEFAULT 'FRACAO_IDEAL',
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "multaAtrasoPct" DECIMAL(65,30) NOT NULL DEFAULT 2.0,
    "jurosMesPct" DECIMAL(65,30) NOT NULL DEFAULT 1.0,

    CONSTRAINT "Condominio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Bloco" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Bloco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Unidade" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "blocoId" TEXT,
    "identificador" TEXT NOT NULL,
    "fracaoIdeal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MoradorPerfil" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "tipoOcupacao" "TipoOcupacao" NOT NULL,

    CONSTRAINT "MoradorPerfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LancamentoCategoria" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,

    CONSTRAINT "LancamentoCategoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Lancamento" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Cobranca" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "valorOriginal" DECIMAL(65,30) NOT NULL,
    "valorAtual" DECIMAL(65,30) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusCobranca" NOT NULL DEFAULT 'PENDENTE',
    "pagoEm" TIMESTAMP(3),

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Comunicado" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "blocoId" TEXT,
    "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ComunicadoLeitura" (
    "id" TEXT NOT NULL,
    "comunicadoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComunicadoLeitura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AreaComum" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "antecedenciaMinHrs" INTEGER NOT NULL DEFAULT 24,

    CONSTRAINT "AreaComum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Reserva" (
    "id" TEXT NOT NULL,
    "areaComumId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMADA',
    "criadoPor" TEXT,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Ocorrencia" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "unidadeId" TEXT,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusOcorrencia" NOT NULL DEFAULT 'ABERTA',
    "criadoPor" TEXT NOT NULL,
    "atribuidoA" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OcorrenciaComentario" (
    "id" TEXT NOT NULL,
    "ocorrenciaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OcorrenciaComentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Documento" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "arquivoUrl" TEXT NOT NULL,
    "visivelPara" TEXT NOT NULL DEFAULT 'TODOS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Convite" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "tipoOcupacao" "TipoOcupacao" NOT NULL DEFAULT 'PROPRIETARIO',
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Plano" (
    "id" TEXT NOT NULL,
    "modulo" "ModuloPago" NOT NULL,
    "nome" TEXT NOT NULL,
    "valorMensal" DECIMAL(65,30) NOT NULL,
    "abacatePayLinkId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Assinatura" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "modulo" "ModuloPago" NOT NULL,
    "planoId" TEXT,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'TRIAL',
    "trialInicio" TIMESTAMP(3),
    "trialFim" TIMESTAMP(3),
    "validaAte" TIMESTAMP(3),
    "abacatePayCustomerId" TEXT,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Pagamento" (
    "id" TEXT NOT NULL,
    "assinaturaId" TEXT NOT NULL,
    "referenciaExterna" TEXT NOT NULL,
    "metodo" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL,
    "pagoEm" TIMESTAMP(3),

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Membership_condominioId_idx" ON "Membership"("condominioId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Membership_userId_condominioId_key" ON "Membership"("userId", "condominioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bloco_condominioId_idx" ON "Bloco"("condominioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Unidade_condominioId_idx" ON "Unidade"("condominioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Unidade_blocoId_idx" ON "Unidade"("blocoId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MoradorPerfil_unidadeId_idx" ON "MoradorPerfil"("unidadeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MoradorPerfil_userId_idx" ON "MoradorPerfil"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LancamentoCategoria_condominioId_idx" ON "LancamentoCategoria"("condominioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Lancamento_condominioId_idx" ON "Lancamento"("condominioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Lancamento_categoriaId_idx" ON "Lancamento"("categoriaId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Cobranca_unidadeId_idx" ON "Cobranca"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Cobranca_unidadeId_competencia_key" ON "Cobranca"("unidadeId", "competencia");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comunicado_condominioId_idx" ON "Comunicado"("condominioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comunicado_blocoId_idx" ON "Comunicado"("blocoId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ComunicadoLeitura_comunicadoId_idx" ON "ComunicadoLeitura"("comunicadoId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ComunicadoLeitura_userId_idx" ON "ComunicadoLeitura"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ComunicadoLeitura_comunicadoId_userId_key" ON "ComunicadoLeitura"("comunicadoId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AreaComum_condominioId_idx" ON "AreaComum"("condominioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Reserva_areaComumId_idx" ON "Reserva"("areaComumId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Reserva_unidadeId_idx" ON "Reserva"("unidadeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ocorrencia_condominioId_idx" ON "Ocorrencia"("condominioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ocorrencia_unidadeId_idx" ON "Ocorrencia"("unidadeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OcorrenciaComentario_ocorrenciaId_idx" ON "OcorrenciaComentario"("ocorrenciaId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Documento_condominioId_idx" ON "Documento"("condominioId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Convite_token_key" ON "Convite"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Convite_condominioId_idx" ON "Convite"("condominioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Convite_unidadeId_idx" ON "Convite"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Assinatura_condominioId_modulo_key" ON "Assinatura"("condominioId", "modulo");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Pagamento_referenciaExterna_key" ON "Pagamento"("referenciaExterna");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Membership" ADD CONSTRAINT "Membership_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Bloco" ADD CONSTRAINT "Bloco_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Unidade" ADD CONSTRAINT "Unidade_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Unidade" ADD CONSTRAINT "Unidade_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "Bloco"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "MoradorPerfil" ADD CONSTRAINT "MoradorPerfil_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "MoradorPerfil" ADD CONSTRAINT "MoradorPerfil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "LancamentoCategoria" ADD CONSTRAINT "LancamentoCategoria_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Lancamento" ADD CONSTRAINT "Lancamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "LancamentoCategoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "Bloco"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ComunicadoLeitura" ADD CONSTRAINT "ComunicadoLeitura_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "Comunicado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ComunicadoLeitura" ADD CONSTRAINT "ComunicadoLeitura_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AreaComum" ADD CONSTRAINT "AreaComum_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_areaComumId_fkey" FOREIGN KEY ("areaComumId") REFERENCES "AreaComum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "OcorrenciaComentario" ADD CONSTRAINT "OcorrenciaComentario_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "Ocorrencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Documento" ADD CONSTRAINT "Documento_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Convite" ADD CONSTRAINT "Convite_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Convite" ADD CONSTRAINT "Convite_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "Assinatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
