import { afterEach, describe, expect, it, vi } from "vitest";

import { createProjectWiki } from "./outline";

describe("createProjectWiki", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("is disabled when Outline is not configured", async () => {
    expect(
      await createProjectWiki({
        boardName: "Art",
        boardUrl: "http://localhost:3000/workspace/art",
      }),
    ).toEqual({ status: "disabled" });
  });

  it("creates a document and returns its URL", async () => {
    vi.stubEnv("OUTLINE_URL", "http://outline.local");
    vi.stubEnv("OUTLINE_API_KEY", "secret");
    vi.stubEnv("OUTLINE_COLLECTION_ID", "collection");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              data: { id: "doc-1", url: "http://outline.local/doc/doc-1" },
            }),
            { status: 200 },
          ),
        ),
    );

    await expect(
      createProjectWiki({
        boardName: "Art",
        boardUrl: "http://localhost:3000/workspace/art",
      }),
    ).resolves.toEqual({
      status: "created",
      documentId: "doc-1",
      url: "http://outline.local/doc/doc-1",
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://outline.local/api/documents.create",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer secret",
        }),
      }),
    );
  });
});
