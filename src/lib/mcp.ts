// Minimal, stateless Model Context Protocol server (Streamable HTTP transport, JSON responses only).
// Read-only by design: it exposes the same public career data as the website — no secrets, no writes.
// Relative imports only: bundled by Netlify Functions.
import { careerFacts } from "../models/metrics";
import { careerFile, getCareerHistory, getHeadline } from "../services/careerData";
import { jsonResume, llmsFullTxt, skills, summary } from "./agent-content";
import { LOCALES } from "./site";
import { resolveTech } from "./tech";

const SUPPORTED_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "murillo-soares-portfolio", title: "Murillo Soares — career data", version: "1.0.0" };

type Json = null | boolean | number | string | Json[] | { [key: string]: Json | undefined };
interface RpcRequest { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown>; }
interface RpcResponse { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string }; }

class RpcError extends Error {
  code: number;
  constructor(code: number, message: string) { super(message); this.code = code; }
}

const localeSchema = { type: "string", enum: [...LOCALES], description: "Language of the texts. Defaults to en." };
const readOnly = { readOnlyHint: true, openWorldHint: false, idempotentHint: true };

export const TOOLS = [
  {
    name: "get_profile",
    title: "Get profile",
    description: "Summary of Murillo Soares: headline, location, contact links, career facts (years, companies, technologies) and skills grouped by category.",
    inputSchema: { type: "object", properties: { locale: localeSchema }, additionalProperties: false },
    annotations: readOnly,
  },
  {
    name: "list_experience",
    title: "List experience",
    description: "Professional positions, newest first, with role, company, period, summary, architecture style and technology stack.",
    inputSchema: {
      type: "object",
      properties: { locale: localeSchema, since_year: { type: "integer", description: "Only positions active in or after this year." } },
      additionalProperties: false,
    },
    annotations: readOnly,
  },
  {
    name: "find_experience_by_technology",
    title: "Find experience by technology",
    description: "Positions where a given technology was used (versions ignored: \"Java\" matches Java 8 and Java 17).",
    inputSchema: {
      type: "object",
      properties: { technology: { type: "string", description: "e.g. Java, Spring Boot, React, Oracle, Docker" }, locale: localeSchema },
      required: ["technology"],
      additionalProperties: false,
    },
    annotations: readOnly,
  },
] as const;

const RESOURCES = [
  { uri: "portfolio://resume.json", name: "resume.json", title: "JSON Resume", mimeType: "application/json", description: "Career data in the jsonresume.org schema (English)." },
  { uri: "portfolio://profile.md", name: "profile.md", title: "Full profile", mimeType: "text/markdown", description: "Complete career history as Markdown (English and Portuguese)." },
];

function locale(params: Record<string, unknown> | undefined): string {
  const l = params?.locale;
  return typeof l === "string" && (LOCALES as readonly string[]).includes(l) ? l : "en";
}

function experience(loc: string) {
  return getCareerHistory(loc).map((e) => ({
    id: e.id, role: e.role, company: e.company, start: e.start, end: e.current ? null : e.end, current: e.current,
    kind: e.kind, architecture: e.archType, summary: e.desc, stack: e.stack,
  }));
}

export function callTool(name: string, args: Record<string, unknown> = {}): { structured: Json; text: string } {
  const loc = locale(args);
  if (name === "get_profile") {
    const facts = careerFacts(getCareerHistory(loc));
    const data = {
      name: careerFile.person.name, headline: getHeadline(loc), location: careerFile.person.location,
      summary: summary(loc), links: careerFile.person.links, facts: { ...facts }, skills: skills(),
      lastSynced: careerFile.sync.syncedAt,
    } as unknown as Json;
    return { structured: data, text: JSON.stringify(data, null, 2) };
  }
  if (name === "list_experience") {
    const since = Number(args.since_year) || 0;
    const items = experience(loc).filter((e) => !since || e.current || Number(String(e.end ?? e.start).slice(0, 4)) >= since);
    const data = { positions: items } as unknown as Json;
    return { structured: data, text: JSON.stringify(data, null, 2) };
  }
  if (name === "find_experience_by_technology") {
    const wanted = String(args.technology ?? "").trim();
    if (!wanted) throw new RpcError(-32602, "technology is required");
    const target = (resolveTech(wanted)[0]?.canonical ?? wanted).toLowerCase();
    const items = experience(loc).filter((e) => e.stack.flatMap(resolveTech).some((r) => r.canonical.toLowerCase() === target || r.label.toLowerCase() === wanted.toLowerCase()));
    const data = { technology: wanted, matches: items.length, positions: items } as unknown as Json;
    return { structured: data, text: JSON.stringify(data, null, 2) };
  }
  throw new RpcError(-32602, `Unknown tool: ${name}`);
}

function dispatch(req: RpcRequest): unknown {
  switch (req.method) {
    case "initialize": {
      const requested = String(req.params?.protocolVersion ?? "");
      return {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: "Read-only career data for Murillo Soares (senior full stack engineer, Lisbon). Start with get_profile.",
      };
    }
    case "ping":
      return {};
    case "tools/list":
      return { tools: TOOLS };
    case "tools/call": {
      const name = String(req.params?.name ?? "");
      try {
        const { structured, text } = callTool(name, (req.params?.arguments as Record<string, unknown>) ?? {});
        return { content: [{ type: "text", text }], structuredContent: structured, isError: false };
      } catch (error) {
        if (error instanceof RpcError && error.message.startsWith("Unknown tool")) throw error;
        return { content: [{ type: "text", text: (error as Error).message }], isError: true };
      }
    }
    case "resources/list":
      return { resources: RESOURCES };
    case "resources/read": {
      const uri = String(req.params?.uri ?? "");
      if (uri === RESOURCES[0].uri) return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(jsonResume("en"), null, 2) }] };
      if (uri === RESOURCES[1].uri) return { contents: [{ uri, mimeType: "text/markdown", text: llmsFullTxt() }] };
      throw new RpcError(-32002, `Resource not found: ${uri}`);
    }
    default:
      throw new RpcError(-32601, `Method not found: ${req.method}`);
  }
}

function handleOne(req: RpcRequest): RpcResponse | null {
  const isNotification = req.id === undefined;
  if (req?.jsonrpc !== "2.0" || typeof req.method !== "string") {
    return { jsonrpc: "2.0", id: req?.id ?? null, error: { code: -32600, message: "Invalid Request" } };
  }
  try {
    const result = dispatch(req);
    return isNotification ? null : { jsonrpc: "2.0", id: req.id ?? null, result };
  } catch (error) {
    if (isNotification) return null;
    const code = error instanceof RpcError ? error.code : -32603;
    return { jsonrpc: "2.0", id: req.id ?? null, error: { code, message: error instanceof RpcError ? error.message : "Internal error" } };
  }
}

/** Transport-level handler: Web Request in, Web Response out. */
export async function handleMcpHttp(request: Request): Promise<Response> {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (request.method === "GET") {
    // No server-initiated stream: this server is stateless.
    return new Response(JSON.stringify({ name: SERVER_INFO.name, transport: "streamable-http", endpoint: "/mcp", methods: ["POST"] }), { status: 405, headers: { ...headers, Allow: "POST" } });
  }
  if (request.method === "DELETE") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 64_000) return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Request too large" } }), { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }), { status: 400, headers });
  }

  const batch = Array.isArray(body);
  const messages = (batch ? body : [body]) as RpcRequest[];
  if (messages.length === 0 || messages.length > 20) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } }), { status: 400, headers });
  }
  const responses = messages.map(handleOne).filter((r): r is RpcResponse => r !== null);
  if (responses.length === 0) return new Response(null, { status: 202 });
  return new Response(JSON.stringify(batch ? responses : responses[0]), { status: 200, headers });
}
