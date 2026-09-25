import { jsonResume } from "@/lib/agent-content";

export const dynamic = "force-static";

export function GET() {
  return Response.json(jsonResume("en"));
}
