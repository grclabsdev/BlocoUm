import { betterAuth } from "better-auth";
import { username, organization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
  // ── Identidade da instância ──────────────────────────────────────────
  secret: process.env.BETTER_AUTH_SECRET, // obrigatório: gere com `openssl rand -base64 32`
  baseURL: process.env.BETTER_AUTH_URL, // ex: https://app.seudominio.com.br
  trustedOrigins: [
    process.env.APP_URL!, // ex: https://app.seudominio.com.br
    // adicione o domínio do seu frontend se for diferente (ex: painel do síndico)
  ],

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // ── Email + senha ─────────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 10, // 8 é o default; 10 é um piso melhor sem pesar na UX
    maxPasswordLength: 128,
    requireEmailVerification: true, // exige confirmação de email antes de logar
    revokeSessionsOnPasswordReset: true, // derruba sessões antigas ao trocar senha
    resetPasswordTokenExpiresIn: 60 * 15, // token de reset expira em 15 min
    sendResetPassword: async ({ user, url }) => {
      // TODO: plugar provedor de email real (Resend, SES, etc.)
      // await sendEmail({ to: user.email, subject: "Redefinir senha", html: `...${url}...` });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60, // 1h para verificar o email
    sendVerificationEmail: async ({ user, url }) => {
      // TODO: plugar provedor de email real
      // await sendEmail({ to: user.email, subject: "Confirme seu email", html: `...${url}...` });
    },
  },

  // ── Sessão ────────────────────────────────────────────────────────────
  session: {
    expiresIn: 60 * 60 * 24 * 7, // sessão dura 7 dias
    updateAge: 60 * 60 * 24, // renova o cookie a cada 24h de uso
    freshAge: 60 * 15, // 15min: janela de "sessão fresca" p/ ações sensíveis (trocar senha/email)
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // cache de 5min evita bater no banco a cada request
    },
  },

  // ── Rate limiting (essencial contra força bruta) ────────────────────
  rateLimit: {
    enabled: true,
    storage: "database", // sobrevive a restart do servidor; migre p/ "secondary-storage" (Redis) quando escalar
    customRules: {
      "/sign-in/email": { window: 60, max: 5 }, // 5 tentativas/min por IP
      "/sign-up/email": { window: 60 * 10, max: 3 }, // 3 cadastros/10min por IP
      "/request-password-reset": { window: 60 * 15, max: 3 },
      "/is-username-available": { window: 10, max: 10 }, // se reativar o endpoint (ver nota abaixo)
    },
  },

  // ── Cookies e headers ────────────────────────────────────────────────
  advanced: {
    useSecureCookies: true, // força HTTPS-only mesmo se algo detectar ambiente errado
    cookiePrefix: "condosimples",
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
    },
    // disableCSRFCheck / disableOriginCheck: NUNCA desabilitar — mantenha o padrão (proteção ativa)
  },

  // ── OAuth (preparando o terreno para a fase 2) ─────────────────────
  account: {
    encryptOAuthTokens: true, // já deixa configurado; só passa a valer quando adicionar providers
  },

  plugins: [
    username({
      minUsernameLength: 5,
      maxUsernameLength: 32,
    }),
    organization({
      teams: { enabled: true },
      schema: {
        organization: {
          modelName: "apartamentos",
          fields: { name: "nome" },
          additionalFields: {
            chavePix: { type: "string", required: false },
            cidade: { type: "string", required: false },
          },
        },
        member: { modelName: "moradores" },
        team: {
          modelName: "unidades",
          additionalFields: {
            fracaoIdeal: { type: "number", required: false },
          },
        },
        invitation: { modelName: "convites" },
      },
    }),
  ],
});
