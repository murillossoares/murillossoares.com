import { describe, expect, it } from "vitest";

import { googleVerificationTokens } from "./site";

describe("Search Console verification tokens", () => {
  it("reads one or several tokens from the environment", () => {
    expect(googleVerificationTokens({ GOOGLE_SITE_VERIFICATION: "abcDEF123_-xyz" })).toEqual(["abcDEF123_-xyz"]);
    expect(googleVerificationTokens({ GOOGLE_SITE_VERIFICATION: "tokenAAAAAAA1, tokenBBBBBBB2" })).toEqual(["tokenAAAAAAA1", "tokenBBBBBBB2"]);
  });

  it("emits nothing when unset and drops values that could break out of the attribute", () => {
    expect(googleVerificationTokens({})).toEqual([]);
    expect(googleVerificationTokens({ GOOGLE_SITE_VERIFICATION: '"><script>alert(1)</script>' })).toEqual([]);
    expect(googleVerificationTokens({ GOOGLE_SITE_VERIFICATION: "short" })).toEqual([]);
  });
});
