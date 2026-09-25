import { afterEach, describe, expect, it, vi } from "vitest";

import { createProjectWiki } from "./outline";

const parseRequestBody = (body: unknown): Record<string, unknown> => {
  if (typeof body !== "string") return {};
  return JSON.parse(body) as Record<string, unknown>;
};

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

    const createCall = vi.mocked(fetch).mock.calls[1];
    expect(createCall?.[0]).toBe("http://outline.local/api/documents.create");

    const init = createCall?.[1];
    expect(init?.method).toBe("POST");

    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBe("Bearer secret");

    const body = parseRequestBody(init?.body);
    expect(body.title).toBe("Art — Project Wiki");
  });

  it("creates the document with a title and publishes it", async () => {
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
            JSON.stringify({ data: { id: "doc-1", url: "/doc/doc-1" } }),
            { status: 200 },
          ),
        ),
    );

    await createProjectWiki({
      boardName: "Art",
      boardUrl: "http://localhost:3000/workspace/art",
    });

    const createCall = vi.mocked(fetch).mock.calls[1];
    const body = parseRequestBody(createCall?.[1]?.body);
    expect(body.title).toBe("Art — Project Wiki");
    expect(body.publish).toBe(true);
    expect(body.name).toBeUndefined();
  });

  it("absolutizes a relative document URL against OUTLINE_PUBLIC_URL", async () => {
    vi.stubEnv("OUTLINE_URL", "http://outline.local");
    vi.stubEnv("OUTLINE_PUBLIC_URL", "http://public.example");
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
            JSON.stringify({ data: { id: "doc-1", url: "/doc/doc-1" } }),
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
      url: "http://public.example/doc/doc-1",
    });
  });

  it("finds an existing document by title and returns its absolute URL", async () => {
    vi.stubEnv("OUTLINE_URL", "http://outline.local");
    vi.stubEnv("OUTLINE_API_KEY", "secret");
    vi.stubEnv("OUTLINE_COLLECTION_ID", "collection");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "doc-1",
                title: "Art — Project Wiki",
                url: "/doc/doc-1",
              },
            ],
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

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });
});
