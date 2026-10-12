-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('TRIAL', 'ATIVA', 'EXPIRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ModuloPago" AS ENUM ('NUCLEO', 'DOCUMENTOS');

-- CreateTable
CREATE TABLE "Plano" (
    "id" TEXT NOT NULL,
    "modulo" "ModuloPago" NOT NULL,
    "nome" TEXT NOT NULL,
    "valorMensal" DECIMAL(65,30) NOT NULL,
    "abacatePayLinkId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
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
CREATE TABLE "Pagamento" (
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
CREATE UNIQUE INDEX "Assinatura_condominioId_modulo_key" ON "Assinatura"("condominioId", "modulo");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_referenciaExterna_key" ON "Pagamento"("referenciaExterna");

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "Assinatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
