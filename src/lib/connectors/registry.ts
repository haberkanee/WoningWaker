import type { PlatformConnector } from "./types";
import { dakConnector } from "./dak";
import { rijnmondConnector } from "./rijnmond";
import { jsonFeedConnector } from "./json-feed";
import { emailConnector } from "./email";

/**
 * Centrale registry van actieve connectors. Nieuwe platforms (Mijn DAK,
 * Woonnet Rijnmond, Woonmatch, Huiswaarts, Woonkeus, …) voeg je hier toe.
 */
export const connectors: PlatformConnector[] = [
  dakConnector,
  rijnmondConnector,
  jsonFeedConnector,
  emailConnector,
];

export function getConnector(slug: string): PlatformConnector | undefined {
  return connectors.find((c) => c.slug === slug);
}
