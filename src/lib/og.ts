import { createHash } from "node:crypto";

import { ARCH_STYLE } from "./arch-style.ts";

type Messages = { Dashboard: { systemOnline: string; headline: string; archNames: Record<string, string> } };
type Career = { person: { name: string; location: { city: string } } };

/** Everything the Open Graph image shows for one locale; the image is rendered from exactly this. */
export function ogInputs(career: Career, messages: Messages, locale: string) {
  const d = messages.Dashboard;
  return {
    locale,
    status: d.systemOnline,
    name: career.person.name,
    headline: `${d.headline} · ${career.person.location.city}`,
    stack: ["Java", "Spring Boot", d.archNames.microservices, "SOA", "React", "Angular"],
    chips: (Object.keys(ARCH_STYLE) as (keyof typeof ARCH_STYLE)[]).map((k) => ({ label: d.archNames[k].toLowerCase(), color: ARCH_STYLE[k].hex })),
  };
}

/** Fingerprint of the inputs, stored next to the images so a test notices when they are stale. */
export function ogFingerprint(inputs: ReturnType<typeof ogInputs>): string {
  return createHash("sha256").update(JSON.stringify(inputs)).digest("hex").slice(0, 16);
}
