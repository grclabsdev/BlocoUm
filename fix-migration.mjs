import { readFileSync, writeFileSync } from "node:fs";

const file =
  "prisma/migrations/20261015000432_init/migration.sql";
let sql = readFileSync(file, "utf8");

// Enums: ignora se o tipo já existe
sql = sql.replace(
  /CREATE TYPE ("[^"]+") AS ENUM \([^)]*\);/g,
  (stmt) =>
    `DO $$ BEGIN\n  ${stmt}\nEXCEPTION WHEN duplicate_object THEN NULL;\nEND $$;`
);

// Tabelas
sql = sql.replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "');

// Índices (normais e únicos)
sql = sql.replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "');
sql = sql.replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "');

// Foreign keys: ignora se a constraint já existe
sql = sql.replace(
  /^ALTER TABLE .* ADD CONSTRAINT .*;$/gm,
  (stmt) =>
    `DO $$ BEGIN\n  ${stmt}\nEXCEPTION WHEN duplicate_object THEN NULL;\nEND $$;`
);

writeFileSync(file, sql);
console.log("migration.sql atualizada");