import { describe, expect, it } from "vitest";
import {
  TRUST_FRAMEWORK_OPTIONS,
  normalizeTrustSettings,
  toggleFramework,
} from "../console-app/src/routes/console/settings/trust/model";

describe("trust settings model", () => {
  it("normalizes default settings", () => {
    expect(normalizeTrustSettings(undefined)).toEqual({
      isPublic: false,
      visibleFrameworks: [],
      controlVisibility: {},
    });
  });

  it("filters unknown frameworks and deduplicates", () => {
    const settings = normalizeTrustSettings({
      isPublic: true,
      visibleFrameworks: ["SOC 2", "SOC 2", "Unknown"],
    });

    expect(settings).toEqual({
      isPublic: true,
      visibleFrameworks: ["SOC 2"],
      controlVisibility: {},
    });
  });

  it("adds and removes framework selections", () => {
    let selected: string[] = [];
    selected = toggleFramework(selected, TRUST_FRAMEWORK_OPTIONS[0], true);
    expect(selected).toEqual([TRUST_FRAMEWORK_OPTIONS[0]]);

    selected = toggleFramework(selected, TRUST_FRAMEWORK_OPTIONS[1], true);
    expect(selected).toEqual([
      TRUST_FRAMEWORK_OPTIONS[0],
      TRUST_FRAMEWORK_OPTIONS[1],
    ]);

    selected = toggleFramework(selected, TRUST_FRAMEWORK_OPTIONS[0], false);
    expect(selected).toEqual([TRUST_FRAMEWORK_OPTIONS[1]]);
  });
});
