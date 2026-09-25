import { createLogger } from "@kan/logger";

const log = createLogger("outline");

interface OutlineDocument {
  id: string;
  url?: string;
}

export type ProjectWikiResult =
  | { status: "disabled" }
  | { status: "created"; documentId: string; url: string }
  | { status: "failed"; message: string };

const getConfig = () => {
  const baseUrl = process.env.OUTLINE_URL?.replace(/\/$/, "");
  const apiKey = process.env.OUTLINE_API_KEY;
  const collectionId = process.env.OUTLINE_COLLECTION_ID;

  if (!baseUrl || !apiKey || !collectionId) return null;

  // Client-facing URL used for wiki links embedded in Kan cards. Outline's
  // API returns document URLs as relative paths (e.g. "/doc/<id>"); they are
  // absolutized against this when OUTLINE_URL is not directly reachable by
  // clients (e.g. when it points at host.docker.internal). An unset *or empty*
  // OUTLINE_PUBLIC_URL falls back to OUTLINE_URL.
  const configuredPublicUrl = process.env.OUTLINE_PUBLIC_URL?.replace(
    /\/$/,
    "",
  );
  const publicUrl =
    configuredPublicUrl !== undefined && configuredPublicUrl !== ""
      ? configuredPublicUrl
      : baseUrl;

  return { baseUrl, publicUrl, apiKey, collectionId };
};

const toAbsoluteDocumentUrl = (
  url: string | undefined,
  documentId: string,
  publicUrl: string,
) => {
  if (!url) return `${publicUrl}/doc/${documentId}`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${publicUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

export const createProjectWiki = async (input: {
  boardName: string;
  boardUrl: string;
}): Promise<ProjectWikiResult> => {
  const config = getConfig();
  if (!config) return { status: "disabled" };

  try {
    const existingResponse = await fetch(
      `${config.baseUrl}/api/documents.list`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId: config.collectionId,
          limit: 100,
        }),
      },
    );

    if (existingResponse.ok) {
      const existingPayload = (await existingResponse.json()) as {
        data?: { id: string; title: string; url?: string }[];
      };
      const existing = existingPayload.data?.find(
        (document) => document.title === `${input.boardName} — Project Wiki`,
      );
      if (existing) {
        return {
          status: "created",
          documentId: existing.id,
          url: toAbsoluteDocumentUrl(
            existing.url,
            existing.id,
            config.publicUrl,
          ),
        };
      }
    }

    const response = await fetch(`${config.baseUrl}/api/documents.create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        collectionId: config.collectionId,
        title: `${input.boardName} — Project Wiki`,
        publish: true,
        text: [
          `# ${input.boardName}`,
          "",
          "## Overview",
          "",
          "## Decisions",
          "",
          "## Notes",
          "",
          "## References",
          "",
          `[Open this project in Kan](${input.boardUrl})`,
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      const message = `Outline returned ${response.status}`;
      log.warn(
        { status: response.status, boardName: input.boardName },
        message,
      );
      return { status: "failed", message };
    }

    const payload = (await response.json()) as { data?: OutlineDocument };
    const document = payload.data;
    if (!document?.id) {
      const message = "Outline returned no document ID";
      log.warn({ boardName: input.boardName }, message);
      return { status: "failed", message };
    }

    return {
      status: "created",
      documentId: document.id,
      url: toAbsoluteDocumentUrl(document.url, document.id, config.publicUrl),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.warn(
      { err: error, boardName: input.boardName },
      "Project Wiki creation failed",
    );
    return { status: "failed", message };
  }
};
