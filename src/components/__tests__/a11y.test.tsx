import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

describe("a11y", () => {
  it("jest-axe is configured", () => { expect(true).toBe(true); });
});
