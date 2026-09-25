import type { Config } from "@netlify/functions";

import { handleMcpHttp } from "../../src/lib/mcp";

// Read-only MCP endpoint over the public career data (see src/lib/mcp.ts). No secrets, no state.
export default async (req: Request) => handleMcpHttp(req);

export const config: Config = {
  path: "/mcp",
};
