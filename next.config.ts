import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  connect-src 'self' https: wss:;
  block-all-mixed-content;
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  // Desativa o cabeçalho X-Powered-By: Next.js para dificultar fingerprinting da stack
  poweredByHeader: false,

  // Modo estrito do React para identificar problemas precocemente
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Evita ataque de MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Previne clickjacking (não permite iframe em outro domínio)
          { key: "X-Frame-Options", value: "DENY" },
          // Controla vazamento de URL no cabeçalho Referer
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Força HTTPS por 2 anos com subdomínios e inclusão na lista preload dos browsers
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Desativa recursos de hardware e APIs desnecessárias para minimizar superfície de ataque
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self)",
          },
          // Habilita prefetch de DNS para links seguros
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // Bloqueia execução de arquivos de políticas do Adobe Flash e PDF
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          // Content Security Policy (CSP)
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
      // -----------------------------------------------------------------------
      // Configuração de PWA: Service Worker
      // -----------------------------------------------------------------------
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          // Permite que o Service Worker gerencie todas as rotas a partir da raiz (/)
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      // -----------------------------------------------------------------------
      // Configuração de PWA: Manifesto Web
      // -----------------------------------------------------------------------
      {
        source: "/:path*(manifest.webmanifest|manifest.json)",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
          // Sempre revalida para que novas versões do app/ícones sejam detectadas imediatamente
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      // -----------------------------------------------------------------------
      // Configuração de PWA: Ícones de Aplicação (Cache imutável para carregamento instantâneo)
      // -----------------------------------------------------------------------
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
