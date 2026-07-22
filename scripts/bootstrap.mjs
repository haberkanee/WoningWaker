/**
 * Gedeelde opstartlogica: zorgt voor een werkende database (ingebouwd of extern),
 * zet het schema klaar en vult zo nodig demo-data. Gebruikt door dev.mjs en
 * start.mjs zodat WoningWaker met één commando draait — zonder Docker of losse
 * database-installatie.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Standaard project-lokaal (.postgres). Overschrijfbaar via EMBEDDED_DB_DIR voor
// omgevingen waar de projectmap geen permissiewijzigingen toestaat.
const dataDir = process.env.EMBEDDED_DB_DIR
  ? path.resolve(process.env.EMBEDDED_DB_DIR)
  : path.join(root, ".postgres");
const EMBEDDED_PORT = Number(process.env.EMBEDDED_DB_PORT ?? 5433);
const EMBEDDED_URL = `postgresql://woningwaker:woningwaker@localhost:${EMBEDDED_PORT}/woningwaker?schema=public`;

const wilExtern = !!process.env.DATABASE_URL && process.env.USE_EMBEDDED_DB !== "true";

let pg = null;

/** Zet veilige standaardwaarden voor lokaal draaien zonder configuratie. */
function ensureEnvDefaults() {
  if (!process.env.AUTH_SECRET) {
    // Vaste dev-secret zodat sessies een herstart overleven. NIET voor productie.
    process.env.AUTH_SECRET = "woningwaker-lokale-dev-secret-verander-in-productie-0123456789";
  }
  if (!process.env.NEXTAUTH_URL) process.env.NEXTAUTH_URL = "http://localhost:3000";
  if (!process.env.APP_URL) process.env.APP_URL = "http://localhost:3000";
  process.env.AUTH_TRUST_HOST = process.env.AUTH_TRUST_HOST ?? "true";
}

/** Bereidt de database voor. Geeft een async cleanup-functie terug. */
export async function prepareDatabase({ seedIfEmpty }) {
  ensureEnvDefaults();
  if (wilExtern) {
    console.log("→ Externe database gebruikt (DATABASE_URL is gezet).");
    await ensureSchema(process.env.DATABASE_URL, { seedIfEmpty: false });
    return async () => {};
  }

  process.env.DATABASE_URL = EMBEDDED_URL;
  await startEmbedded();
  await ensureSchema(EMBEDDED_URL, { seedIfEmpty });
  return async () => {
    if (pg) {
      try {
        await pg.stop();
      } catch {
        /* negeren */
      }
    }
  };
}

async function startEmbedded() {
  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const alGeinitialiseerd = existsSync(path.join(dataDir, "PG_VERSION"));
  // Zorg dat de bovenliggende map bestaat; initdb maakt de datamap zelf aan
  // (en zet de juiste rechten) — daarom niet zelf voor-aanmaken.
  await mkdir(path.dirname(dataDir), { recursive: true });

  pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "woningwaker",
    password: "woningwaker",
    port: EMBEDDED_PORT,
    persistent: true,
    onLog: () => {},
    onError: () => {},
  });

  if (!alGeinitialiseerd) {
    console.log("→ Ingebouwde database aanmaken (eenmalig, kan even duren)…");
    await pg.initialise();
  }
  console.log(`→ Ingebouwde database starten op poort ${EMBEDDED_PORT}…`);
  await pg.start();

  if (!alGeinitialiseerd) {
    try {
      await pg.createDatabase("woningwaker");
    } catch {
      /* bestaat al */
    }
  }
}

async function ensureSchema(databaseUrl, { seedIfEmpty }) {
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  await run("npx", ["prisma", "generate"], env);
  console.log("→ Databaseschema bijwerken…");
  await run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], env);

  if (seedIfEmpty && (await isLeeg())) {
    console.log("→ Demo-data laden…");
    await run("npx", ["tsx", "prisma/seed.ts"], env);
  }
}

async function isLeeg() {
  if (!pg) return false;
  try {
    const client = pg.getPgClient();
    await client.connect();
    const tabel = await client.query(
      "select count(*)::int as n from information_schema.tables where table_name = 'User'",
    );
    let leeg = true;
    if (tabel.rows[0].n > 0) {
      const users = await client.query('select count(*)::int as n from "User"');
      leeg = users.rows[0].n === 0;
    }
    await client.end();
    return leeg;
  } catch {
    return false;
  }
}

export function run(cmd, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
      env,
    });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} faalde (${code})`))));
  });
}

/** Start een langlopend proces (next dev/start) en verzorgt nette afsluiting. */
export function runServer(cmd, args, cleanup) {
  const proc = spawn(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  let bezig = false;
  const stop = async (code) => {
    if (bezig) return;
    bezig = true;
    await cleanup();
    process.exit(code ?? 0);
  };

  proc.on("exit", (code) => stop(code ?? 0));
  process.on("SIGINT", () => {
    proc.kill("SIGINT");
    stop(0);
  });
  process.on("SIGTERM", () => {
    proc.kill("SIGTERM");
    stop(0);
  });
}

export function toonLogin() {
  console.log("  Demo-login:  demo@woningwaker.nl  / Demo1234");
  console.log("  Admin-login: admin@woningwaker.nl / Demo1234\n");
}
