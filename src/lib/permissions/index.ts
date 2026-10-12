import { PapelUsuario } from "@/generated/prisma/client";

export type Modulo =
  | "lancamentos"
  | "cobrancas"
  | "estrutural"
  | "comunicados"
  | "reservas"
  | "ocorrencias"
  | "documentos"
  | "configuracoes";

export type Acao = "visualizar" | "criar" | "editar" | "excluir";

export interface ContextoPermissao {
  isPropriaUnidade?: boolean;
  isProprioItem?: boolean;
}

export function podeAcao(
  papel: PapelUsuario,
  modulo: Modulo,
  acao: Acao,
  contexto?: ContextoPermissao
): boolean {
  // SINDICO tem permissão total em tudo
  if (papel === PapelUsuario.SINDICO) {
    return true;
  }

  // SUBSINDICO tem acesso quase total, exceto certas ações em configurações
  if (papel === PapelUsuario.SUBSINDICO) {
    return true;
  }

  // CONSELHEIRO: Leitura de tudo, não cria, não edita nem exclui
  if (papel === PapelUsuario.CONSELHEIRO) {
    return acao === "visualizar";
  }

  // MORADOR
  if (papel === PapelUsuario.MORADOR) {
    switch (modulo) {
      case "lancamentos":
        return false; // Sem acesso a lançamentos gerais
      case "cobrancas":
        // Vê apenas a própria cobrança
        return acao === "visualizar" && (contexto?.isPropriaUnidade ?? true);
      case "estrutural":
        // Vê dados da própria unidade
        return acao === "visualizar";
      case "comunicados":
        return acao === "visualizar";
      case "reservas":
        if (acao === "visualizar") return true;
        if (acao === "criar") return true; // Para própria unidade
        if (acao === "excluir") return contexto?.isProprioItem ?? false;
        return false;
      case "ocorrencias":
        if (acao === "visualizar") return true;
        if (acao === "criar") return true;
        if (acao === "editar") return contexto?.isProprioItem ?? false;
        return false;
      case "documentos":
        return acao === "visualizar";
      case "configuracoes":
        return false;
      default:
        return false;
    }
  }

  // FUNCIONARIO
  if (papel === PapelUsuario.FUNCIONARIO) {
    switch (modulo) {
      case "comunicados":
        return acao === "visualizar";
      case "reservas":
        return acao === "visualizar";
      case "ocorrencias":
        // Vê, comenta e atualiza status
        return acao === "visualizar" || acao === "editar";
      case "documentos":
        return acao === "visualizar";
      default:
        return false;
    }
  }

  return false;
}
