CREATE TYPE "public"."board_template_identity" AS ENUM('art', 'software', 'production');--> statement-breakpoint
CREATE TYPE "public"."template_identity_migration_outcome" AS ENUM('classified', 'skipped', 'rejected');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "board_template_identity_migration_report" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"boardPublicId" varchar(12) NOT NULL,
	"boardName" varchar(255) NOT NULL,
	"outcome" "template_identity_migration_outcome" NOT NULL,
	"identity" "board_template_identity",
	"reason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board" ADD COLUMN "templateIdentity" "board_template_identity";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "board_template_identity_report_outcome_idx" ON "board_template_identity_migration_report" USING btree ("outcome");
--> statement-breakpoint
WITH list_structures AS (
	SELECT
		b."id",
		COALESCE(
			array_agg(lower(btrim(l."name")) ORDER BY l."index", l."id")
				FILTER (WHERE l."id" IS NOT NULL),
			ARRAY[]::text[]
		) AS list_names
	FROM "board" b
	LEFT JOIN "list" l
		ON l."boardId" = b."id"
		AND l."deletedAt" IS NULL
	GROUP BY b."id"
), named_templates AS (
	SELECT
		b."id",
		b."publicId",
		b."name",
		b."createdAt",
		CASE regexp_replace(lower(btrim(b."name")), '[^a-zA-Z0-9]', '', 'g')
			WHEN 'art' THEN 'art'::"board_template_identity"
			WHEN 'software' THEN 'software'::"board_template_identity"
			WHEN 'softwaredevelopment' THEN 'software'::"board_template_identity"
			WHEN 'production' THEN 'production'::"board_template_identity"
			WHEN 'productionshoot' THEN 'production'::"board_template_identity"
			ELSE NULL
		END AS candidate_identity,
		ls.list_names
	FROM "board" b
	JOIN list_structures ls ON ls."id" = b."id"
	WHERE b."type" = 'template'::"board_type"
		AND b."deletedAt" IS NULL
), evaluated AS (
	SELECT
		*,
		CASE candidate_identity
			WHEN 'art'::"board_template_identity" THEN list_names = ARRAY['sketch', 'blockout', 'render', 'review', 'done']::text[]
			WHEN 'software'::"board_template_identity" THEN list_names = ARRAY['backlog', 'doing', 'review', 'done']::text[]
			WHEN 'production'::"board_template_identity" THEN list_names = ARRAY['planned', 'booked', 'captured', 'editing', 'delivered']::text[]
			ELSE false
		END AS structure_matches
	FROM named_templates
), ranked AS (
	SELECT
		*,
		row_number() OVER (
			PARTITION BY candidate_identity
			ORDER BY "createdAt", "id"
		) AS candidate_rank
	FROM evaluated
	WHERE candidate_identity IS NOT NULL AND structure_matches
), classified AS (
	SELECT
		e."id",
		e."publicId",
		e."name",
		e.candidate_identity,
		CASE
			WHEN e.candidate_identity IS NULL THEN 'skipped'::"template_identity_migration_outcome"
			WHEN NOT e.structure_matches THEN 'rejected'::"template_identity_migration_outcome"
			WHEN r.candidate_rank = 1 THEN 'classified'::"template_identity_migration_outcome"
			ELSE 'rejected'::"template_identity_migration_outcome"
		END AS outcome,
		CASE
			WHEN e.candidate_identity IS NULL THEN 'unsupported-name'
			WHEN NOT e.structure_matches THEN 'wrong-list-structure'
			WHEN r.candidate_rank > 1 THEN 'duplicate'
			ELSE NULL
		END AS reason
	FROM evaluated e
	LEFT JOIN ranked r ON r."id" = e."id"
), updated AS (
	UPDATE "board" b
	SET "templateIdentity" = c.candidate_identity
	FROM classified c
	WHERE b."id" = c."id" AND c.outcome = 'classified'::"template_identity_migration_outcome"
	RETURNING b."id"
), reported AS (
	INSERT INTO "board_template_identity_migration_report"
		("boardPublicId", "boardName", "outcome", "identity", "reason")
	SELECT "publicId", "name", outcome, candidate_identity, reason
	FROM classified
	RETURNING "id"
)
SELECT 1;
