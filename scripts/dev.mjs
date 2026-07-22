#!/usr/bin/env node
/**
 * Eén-commando dev-starter voor WoningWaker.
 *
 *   npm run dev
 *
 * Start (indien nodig) een ingebouwde PostgreSQL, zet het schema klaar, vult
 * demo-data en start de Next.js dev-server. Geen Docker of losse
 * database-installatie nodig. Open daarna http://localhost:3000.
 */
import { prepareDatabase, runServer, toonLogin } from "./bootstrap.mjs";

const cleanup = await prepareDatabase({ seedIfEmpty: true });

console.log("\n✓ Klaar! WoningWaker start op http://localhost:3000\n");
toonLogin();

runServer("npx", ["next", "dev"], cleanup);
