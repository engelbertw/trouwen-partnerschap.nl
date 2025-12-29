CREATE TABLE "ihw"."babs_blocked_date" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"babs_id" uuid NOT NULL,
	"blocked_date" date NOT NULL,
	"all_day" boolean DEFAULT true NOT NULL,
	"start_time" time,
	"end_time" time,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "ihw"."babs_recurring_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"babs_id" uuid NOT NULL,
	"rule_type" text NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"week_of_month" integer,
	"interval_weeks" integer,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"valid_from" date NOT NULL,
	"valid_until" date,
	"rrule_string" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ihw"."document_optie" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gemeente_oin" text NOT NULL,
	"code" text NOT NULL,
	"naam" text NOT NULL,
	"omschrijving" text,
	"papier_type" "papier_type" NOT NULL,
	"prijs_cents" integer DEFAULT 0 NOT NULL,
	"gratis" boolean DEFAULT false NOT NULL,
	"verplicht" boolean DEFAULT false NOT NULL,
	"actief" boolean DEFAULT true NOT NULL,
	"volgorde" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ihw"."papier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"gemeente_oin" text NOT NULL,
	"partner_id" uuid,
	"type" "papier_type" NOT NULL,
	"status" "papier_status" DEFAULT 'ontbreekt' NOT NULL,
	"omschrijving" text,
	"beoordeeld_door" text,
	"beoordeeld_op" timestamp with time zone,
	"opmerking" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ihw"."babs" ADD COLUMN "beschikbaarheid" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "ihw"."babs" ADD COLUMN "beschikbaar_vanaf" date;--> statement-breakpoint
ALTER TABLE "ihw"."babs" ADD COLUMN "beschikbaar_tot" date;--> statement-breakpoint
ALTER TABLE "ihw"."babs" ADD COLUMN "opmerking_beschikbaarheid" text;--> statement-breakpoint
ALTER TABLE "ihw"."locatie" ADD COLUMN "afbeelding_url" text;--> statement-breakpoint
ALTER TABLE "ihw"."babs_blocked_date" ADD CONSTRAINT "babs_blocked_date_babs_id_babs_id_fk" FOREIGN KEY ("babs_id") REFERENCES "ihw"."babs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."babs_recurring_rule" ADD CONSTRAINT "babs_recurring_rule_babs_id_babs_id_fk" FOREIGN KEY ("babs_id") REFERENCES "ihw"."babs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."document_optie" ADD CONSTRAINT "document_optie_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."papier" ADD CONSTRAINT "papier_dossier_id_dossier_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "ihw"."dossier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."papier" ADD CONSTRAINT "papier_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."papier" ADD CONSTRAINT "papier_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "ihw"."partner"("id") ON DELETE no action ON UPDATE no action;