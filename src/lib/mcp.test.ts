import { describe, expect, it } from "vitest";

import { careerFile } from "@/services/careerData";
import { handleMcpHttp } from "./mcp";

const post = (body: unknown) => handleMcpHttp(new Request("https://example.test/mcp", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }));
const rpc = async (method: string, params?: Record<string, unknown>, id: number | undefined = 1) => (await post({ jsonrpc: "2.0", id, method, params })).json();

describe("MCP endpoint", () => {
  it("negotiates the protocol version on initialize", async () => {
    const res = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } });
    expect(res.result.protocolVersion).toBe("2025-03-26");
    expect(res.result.capabilities.tools).toBeDefined();
    expect((await rpc("initialize", { protocolVersion: "1999-01-01" })).result.protocolVersion).toBe("2025-06-18");
  });

  it("acknowledges notifications with 202 and no body", async () => {
    const res = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(res.status).toBe(202);
  });

  it("lists read-only tools", async () => {
    const { result } = await rpc("tools/list");
    expect(result.tools.map((t: { name: string }) => t.name)).toEqual(["get_profile", "list_experience", "find_experience_by_technology"]);
    expect(result.tools.every((t: { annotations: { readOnlyHint: boolean } }) => t.annotations.readOnlyHint)).toBe(true);
  });

  it("returns the profile with structured content", async () => {
    const { result } = await rpc("tools/call", { name: "get_profile", arguments: { locale: "pt-br" } });
    expect(result.isError).toBe(false);
    expect(result.structuredContent).toMatchObject({ name: "Murillo Soares", headline: "Engenheiro Full Stack Sênior" });
    expect(JSON.parse(result.content[0].text).facts.companies).toBe(new Set(careerFile.positions.map((p) => p.company.toLowerCase())).size);
    expect(result.structuredContent.summary).toMatch(/anos de experiência/);
  });

  it("finds positions by technology ignoring versions", async () => {
    const { result } = await rpc("tools/call", { name: "find_experience_by_technology", arguments: { technology: "java" } });
    const ids = result.structuredContent.positions.map((p: { id: string }) => p.id);
    expect(ids).toEqual(expect.arrayContaining(["iefp", "ytech"]));
    expect(ids).not.toContain("atuarial");
  });

  it("reports tool errors in-band and protocol errors as JSON-RPC errors", async () => {
    expect((await rpc("tools/call", { name: "find_experience_by_technology", arguments: {} })).result.isError).toBe(true);
    expect((await rpc("tools/call", { name: "nope" })).error.code).toBe(-32602);
    expect((await rpc("does/not/exist")).error.code).toBe(-32601);
    const bad = await handleMcpHttp(new Request("https://example.test/mcp", { method: "POST", body: "{not json" }));
    expect(bad.status).toBe(400);
  });

  it("serves resources and handles batches", async () => {
    const res = await post([
      { jsonrpc: "2.0", id: 1, method: "resources/read", params: { uri: "portfolio://resume.json" } },
      { jsonrpc: "2.0", id: 2, method: "ping" },
    ]);
    const [read, ping] = await res.json();
    expect(JSON.parse(read.result.contents[0].text).basics.name).toBe("Murillo Soares");
    expect(ping.result).toEqual({});
  });

  it("answers null or non-object messages with -32600 instead of crashing", async () => {
    expect((await (await post(null)).json()).error.code).toBe(-32600);
    const [a, b] = await (await post([null, 42])).json();
    expect([a.error.code, b.error.code]).toEqual([-32600, -32600]);
  });

  it("answers CORS preflight so browser-based MCP clients can connect", async () => {
    const preflight = (headers: Record<string, string>) => handleMcpHttp(new Request("https://example.test/mcp", { method: "OPTIONS", headers }));
    const res = await preflight({ Origin: "https://inspector.example", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type,mcp-protocol-version,mcp-method,x-custom-auth-headers" });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
    expect(res.headers.get("access-control-max-age")).toBe("7200");
    const echoed = res.headers.get("access-control-allow-headers")!.toLowerCase();
    for (const h of ["content-type", "mcp-protocol-version", "mcp-method", "x-custom-auth-headers", "authorization"]) expect(echoed).toContain(h);
    expect(res.headers.get("access-control-allow-credentials")).toBeNull();

    const fallback = (await preflight({ Origin: "https://a.example" })).headers.get("access-control-allow-headers")!.toLowerCase();
    for (const h of ["content-type", "accept", "authorization", "mcp-protocol-version", "mcp-session-id", "mcp-method", "mcp-name"]) expect(fallback).toContain(h);
    // A malformed request-header list is never reflected.
    const odd = (await preflight({ "Access-Control-Request-Headers": "content-type; set-cookie=a, x y" })).headers.get("access-control-allow-headers")!;
    expect(odd).not.toMatch(/set-cookie|x y/i);
    expect(odd.toLowerCase()).toContain("content-type");
  });

  it("applies an explicit Origin policy: any well-formed origin is fine, a malformed one gets 403", async () => {
    const withOrigin = (origin: string, method = "POST") => handleMcpHttp(new Request("https://example.test/mcp", {
      method, headers: { Origin: origin, "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) : undefined,
    }));
    expect((await withOrigin("https://client.example.org")).status).toBe(200);
    expect((await withOrigin("null")).status).toBe(200);
    for (const client of ["chrome-extension://abcdefghijklmnop", "moz-extension://1234-5678", "vscode-webview://abc123", "tauri://localhost", "capacitor://localhost", "http://localhost:6274"]) {
      expect((await withOrigin(client)).status, client).toBe(200);
    }
    for (const bad of ["https://a.example/path", "https://a.example?x=1", "https://user@a.example"]) {
      expect((await withOrigin(bad)).status, bad).toBe(403);
    }
    const bad = await withOrigin("not a url");
    expect(bad.status).toBe(403);
    expect(bad.headers.get("access-control-allow-origin")).toBe("*");
    // Preflight always succeeds, even for an odd Origin.
    expect((await withOrigin("not a url", "OPTIONS")).status).toBe(204);
  });

  it("sends CORS headers on every response, errors included", async () => {
    const ok = await post({ jsonrpc: "2.0", id: 1, method: "ping" });
    const notification = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
    const parseError = await handleMcpHttp(new Request("https://example.test/mcp", { method: "POST", body: "{" }));
    const get = await handleMcpHttp(new Request("https://example.test/mcp"));
    for (const res of [ok, notification, parseError, get]) expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("enforces MCP-Protocol-Version on requests after initialize", async () => {
    const call = (version: string, method = "ping") => handleMcpHttp(new Request("https://example.test/mcp", {
      method: "POST", headers: { "Content-Type": "application/json", "MCP-Protocol-Version": version }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method }),
    }));
    expect((await call("2025-06-18")).status).toBe(200);
    expect((await call("2025-03-26")).status).toBe(200);
    const bad = await call("1999-01-01");
    expect(bad.status).toBe(400);
    const err = (await bad.json()).error;
    expect(err.message).toMatch(/Unsupported MCP-Protocol-Version/);
    expect(err.data.supported).toContain("2025-06-18");
    expect((await call("1999-01-01", "initialize")).status).toBe(200);
  });

  it("rejects GET because the server is stateless", async () => {
    expect((await handleMcpHttp(new Request("https://example.test/mcp"))).status).toBe(405);
  });
});
