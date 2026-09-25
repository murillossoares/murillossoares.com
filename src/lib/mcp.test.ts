import { describe, expect, it } from "vitest";

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
    expect(JSON.parse(result.content[0].text).facts.companies).toBe(11);
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

  it("rejects GET because the server is stateless", async () => {
    expect((await handleMcpHttp(new Request("https://example.test/mcp"))).status).toBe(405);
  });
});
