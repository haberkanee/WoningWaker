#!/usr/bin/env node
/**
 * Productie-achtige start met ingebouwde database.
 *
 *   npm run build && npm run start:local
 *
 * Verwacht dat `next build` al is uitgevoerd. Start (indien nodig) de ingebouwde
 * PostgreSQL, werkt het schema bij en start de productieserver op poort 3000.
 */
import { prepareDatabase, runServer, toonLogin } from "./bootstrap.mjs";

const cleanup = await prepareDatabase({ seedIfEmpty: true });

console.log("\n✓ WoningWaker draait op http://localhost:3000\n");
toonLogin();

runServer("npx", ["next", "start"], cleanup);
