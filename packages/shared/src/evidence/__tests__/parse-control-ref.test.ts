import { describe, it, expect } from "vitest";
import { parseControlRef } from "../adapter-collector";

describe("parseControlRef", () => {
  it("parses SOC2 control refs", () => {
    expect(parseControlRef("SOC2-CC6.1")).toEqual({
      framework: "SOC2",
      controlId: "CC6.1",
    });
    expect(parseControlRef("SOC2-CC8.1")).toEqual({
      framework: "SOC2",
      controlId: "CC8.1",
    });
  });

  it("parses ISO-27001 control refs (multi-segment prefix)", () => {
    expect(parseControlRef("ISO-27001-A.9.4.2")).toEqual({
      framework: "ISO27001",
      controlId: "A.9.4.2",
    });
    expect(parseControlRef("ISO-27001-A.12.6.1")).toEqual({
      framework: "ISO27001",
      controlId: "A.12.6.1",
    });
    expect(parseControlRef("ISO-27001-A.9.2.1")).toEqual({
      framework: "ISO27001",
      controlId: "A.9.2.1",
    });
  });

  it("parses NIST-CSF control refs (multi-segment prefix)", () => {
    expect(parseControlRef("NIST-CSF-PR.AC-1")).toEqual({
      framework: "NIST_CSF",
      controlId: "PR.AC-1",
    });
    expect(parseControlRef("NIST-CSF-DE.CM-1")).toEqual({
      framework: "NIST_CSF",
      controlId: "DE.CM-1",
    });
    expect(parseControlRef("NIST-CSF-RS.CO-2")).toEqual({
      framework: "NIST_CSF",
      controlId: "RS.CO-2",
    });
  });

  it("parses HIPAA control refs", () => {
    expect(parseControlRef("HIPAA-164.312(a)(1)")).toEqual({
      framework: "HIPAA",
      controlId: "164.312(a)(1)",
    });
    expect(parseControlRef("HIPAA-164.312(d)")).toEqual({
      framework: "HIPAA",
      controlId: "164.312(d)",
    });
  });

  it("parses GDPR control refs", () => {
    expect(parseControlRef("GDPR-Art.5(1)(f)")).toEqual({
      framework: "GDPR",
      controlId: "Art.5(1)(f)",
    });
    expect(parseControlRef("GDPR-Art.5(1)(e)")).toEqual({
      framework: "GDPR",
      controlId: "Art.5(1)(e)",
    });
  });

  it("falls back gracefully for unknown formats", () => {
    expect(parseControlRef("UNKNOWN")).toEqual({
      framework: "UNKNOWN",
      controlId: "UNKNOWN",
    });
  });
});
