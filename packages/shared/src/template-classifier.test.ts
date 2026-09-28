import { describe, expect, it } from "vitest";

import { classifyTemplate } from "./template-classifier";

describe("classifyTemplate", () => {
  it("classifies a supported template by normalized name and exact list structure", () => {
    expect(
      classifyTemplate({
        name: "  Production / Shoot ",
        listNames: [" PLANNED ", "booked", "Captured", "Editing", "Delivered"],
      }),
    ).toEqual({ status: "classified", identity: "production" });
  });

  it("rejects a matching name with the wrong list structure", () => {
    expect(
      classifyTemplate({
        name: "Art",
        listNames: ["Backlog", "Doing", "Review", "Done"],
      }),
    ).toEqual({ status: "unclassified", reason: "wrong-list-structure" });
  });

  it("requires list order to match exactly", () => {
    expect(
      classifyTemplate({
        name: "Art",
        listNames: ["Blockout", "Sketch", "Render", "Review", "Done"],
      }),
    ).toEqual({ status: "unclassified", reason: "wrong-list-structure" });
  });

  it("rejects unsupported template names", () => {
    expect(
      classifyTemplate({
        name: "Marketing",
        listNames: ["Ideas"],
      }),
    ).toEqual({ status: "unclassified", reason: "unsupported-name" });
  });

  it("rejects an ambiguous match instead of choosing a priority", () => {
    expect(
      classifyTemplate({
        name: "Shared",
        listNames: ["One"],
        definitions: [
          { identity: "art", names: ["Shared"], listNames: ["One"] },
          {
            identity: "software",
            names: ["Shared"],
            listNames: ["One"],
          },
        ],
      }),
    ).toEqual({ status: "unclassified", reason: "ambiguous" });
  });
});
