import type { PlatformConnector } from "./types";
import { dakConnector } from "./dak";
import { rijnmondConnector } from "./rijnmond";
import { jsonFeedConnector } from "./json-feed";
import { emailConnector } from "./email";
import { DEMO_DATA } from "@/lib/config";

/**
 * Demo-connectors met voorbeelddata. Alleen actief als DEMO_DATA=true.
 */
const demoConnectors: PlatformConnector[] = [
  dakConnector,
  rijnmondConnector,
  jsonFeedConnector,
  emailConnector,
];

/**
 * Centrale registry van actieve fetch-connectors. Echte data komt binnen via
 * de inbound-e-mailwebhook (push, niet via fetch). Zet DEMO_DATA=true om de
 * demo-connectors te laden.
 */
export const connectors: PlatformConnector[] = DEMO_DATA ? demoConnectors : [];

export function getConnector(slug: string): PlatformConnector | undefined {
  return connectors.find((c) => c.slug === slug);
}
