export const SUPPORTED_TEMPLATE_IDENTITIES = [
  "art",
  "software",
  "production",
] as const;

export type SupportedTemplateIdentity =
  (typeof SUPPORTED_TEMPLATE_IDENTITIES)[number];

export type TemplateClassification =
  | {
      status: "classified";
      identity: SupportedTemplateIdentity;
    }
  | {
      status: "unclassified";
      reason: "ambiguous" | "unsupported-name" | "wrong-list-structure";
    };

export type TemplateDefinition = {
  identity: SupportedTemplateIdentity;
  names: string[];
  listNames: string[];
};

export const SUPPORTED_TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    identity: "art",
    names: ["Art"],
    listNames: ["Sketch", "Blockout", "Render", "Review", "Done"],
  },
  {
    identity: "software",
    names: ["Software", "Software Development"],
    listNames: ["Backlog", "Doing", "Review", "Done"],
  },
  {
    identity: "production",
    names: ["Production", "Production/Shoot"],
    listNames: ["Planned", "Booked", "Captured", "Editing", "Delivered"],
  },
];

const normalizeName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeListName = (value: string) => value.trim().toLowerCase();

const hasExactListStructure = (actual: string[], expected: string[]): boolean =>
  actual.length === expected.length &&
  actual.every((name, index) => {
    const expectedName = expected[index];
    return (
      expectedName !== undefined &&
      normalizeListName(name) === normalizeListName(expectedName)
    );
  });

export const classifyTemplate = ({
  name,
  listNames,
  definitions = SUPPORTED_TEMPLATE_DEFINITIONS,
}: {
  name: string;
  listNames: string[];
  definitions?: TemplateDefinition[];
}): TemplateClassification => {
  const normalizedName = normalizeName(name);
  const nameMatches = definitions.filter((definition) =>
    definition.names.some(
      (candidateName) => normalizeName(candidateName) === normalizedName,
    ),
  );

  if (nameMatches.length === 0)
    return { status: "unclassified", reason: "unsupported-name" };

  const matches = nameMatches.filter((definition) =>
    hasExactListStructure(listNames, definition.listNames),
  );

  if (matches.length > 1)
    return { status: "unclassified", reason: "ambiguous" };

  if (matches.length === 0)
    return { status: "unclassified", reason: "wrong-list-structure" };

  const [match] = matches;
  if (!match) return { status: "unclassified", reason: "wrong-list-structure" };

  return { status: "classified", identity: match.identity };
};
