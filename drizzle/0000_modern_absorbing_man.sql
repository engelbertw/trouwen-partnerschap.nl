CREATE SCHEMA "ihw";
--> statement-breakpoint
CREATE TYPE "public"."babs_status" AS ENUM('beedigd', 'in_aanvraag', 'ongeldig');--> statement-breakpoint
CREATE TYPE "public"."block_code" AS ENUM('aankondiging', 'ceremonie', 'getuigen', 'papieren', 'betaling');--> statement-breakpoint
CREATE TYPE "public"."dossier_status" AS ENUM('draft', 'in_review', 'ready_for_payment', 'locked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."locatie_type" AS ENUM('stadhuis', 'stadsloket', 'buitenlocatie');--> statement-breakpoint
CREATE TYPE "public"."naamgebruik_keuze" AS ENUM('eigen', 'partner', 'eigen_partner', 'partner_eigen');--> statement-breakpoint
CREATE TYPE "public"."papier_status" AS ENUM('ontbreekt', 'ingeleverd', 'goedgekeurd', 'afgekeurd');--> statement-breakpoint
CREATE TYPE "public"."papier_type" AS ENUM('geboorteakte', 'nationaliteitsverklaring', 'identiteitsbewijs', 'scheidingsbeschikking', 'overlijdensakte', 'trouwboekje', 'anders');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded', 'waived');--> statement-breakpoint
CREATE TABLE "ihw"."aankondiging" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"gemeente_oin" text NOT NULL,
	"reeds_gehuwd" boolean DEFAULT false NOT NULL,
	"partnerschap" boolean DEFAULT false NOT NULL,
	"omzetting" boolean DEFAULT false NOT NULL,
	"beiden_niet_woonachtig" boolean DEFAULT false NOT NULL,
	"valid" boolean DEFAULT false NOT NULL,
	"invalid_reason" text,
	"aangemaakt_op" timestamp with time zone DEFAULT now() NOT NULL,
	"gevalideerd_op" timestamp with time zone,
	"gevalideerd_door" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "aankondiging_dossier_id_unique" UNIQUE("dossier_id")
);
--> statement-breakpoint
CREATE TABLE "ihw"."babs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"naam" text NOT NULL,
	"voornaam" text,
	"tussenvoegsel" text,
	"achternaam" text NOT NULL,
	"status" "babs_status" DEFAULT 'in_aanvraag' NOT NULL,
	"beedigd_vanaf" date,
	"beedigd_tot" date,
	"aanvraag_datum" date,
	"opmerkingen" text,
	"actief" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "babs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ihw"."ceremonie" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"gemeente_oin" text NOT NULL,
	"locatie_id" uuid NOT NULL,
	"babs_id" uuid,
	"datum" date NOT NULL,
	"start_tijd" time NOT NULL,
	"eind_tijd" time NOT NULL,
	"wensen" jsonb DEFAULT '{}'::jsonb,
	"taal" text DEFAULT 'nl',
	"trouwboekje" boolean DEFAULT false,
	"speech" boolean DEFAULT true,
	"wijzigbaar_tot" timestamp with time zone NOT NULL,
	"geboekt_op" timestamp with time zone DEFAULT now() NOT NULL,
	"laatste_wijziging" timestamp with time zone,
	"gewijzigd_door" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ceremonie_dossier_id_unique" UNIQUE("dossier_id")
);
--> statement-breakpoint
CREATE TABLE "ihw"."dossier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identificatie" text,
	"zaaktype_url" text,
	"gemeente_oin" text NOT NULL,
	"status" "dossier_status" DEFAULT 'draft' NOT NULL,
	"type_ceremonie_id" uuid,
	"municipality_code" text DEFAULT 'NL.IMBAG.Gemeente.0363' NOT NULL,
	"iburgerzaken_case_id" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ready_for_payment_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"ceremony_date" date,
	"is_test" boolean DEFAULT false NOT NULL,
	CONSTRAINT "dossier_identificatie_unique" UNIQUE("identificatie")
);
--> statement-breakpoint
CREATE TABLE "ihw"."dossier_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"gemeente_oin" text NOT NULL,
	"code" "block_code" NOT NULL,
	"complete" boolean DEFAULT false NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ihw"."gemeente" (
	"oin" text PRIMARY KEY NOT NULL,
	"naam" text NOT NULL,
	"gemeente_code" text NOT NULL,
	"actief" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gemeente_gemeente_code_unique" UNIQUE("gemeente_code")
);
--> statement-breakpoint
CREATE TABLE "ihw"."getuige" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"gemeente_oin" text NOT NULL,
	"is_gemeentelijke_getuige" boolean DEFAULT false NOT NULL,
	"voornamen" text NOT NULL,
	"voorvoegsel" text,
	"achternaam" text NOT NULL,
	"geboortedatum" date NOT NULL,
	"geboorteplaats" text,
	"document_upload_id" uuid,
	"document_status" "papier_status" DEFAULT 'ontbreekt',
	"volgorde" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ihw"."kind" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"gemeente_oin" text NOT NULL,
	"partner_id" uuid NOT NULL,
	"voornamen" text NOT NULL,
	"achternaam" text NOT NULL,
	"geboortedatum" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ihw"."locatie" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"naam" text NOT NULL,
	"type" "locatie_type" NOT NULL,
	"adres" jsonb,
	"capaciteit" integer DEFAULT 50,
	"actief" boolean DEFAULT true NOT NULL,
	"prijs_cents" integer DEFAULT 0 NOT NULL,
	"toelichting" text,
	"volgorde" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locatie_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ihw"."partner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"gemeente_oin" text NOT NULL,
	"sequence" integer NOT NULL,
	"bsn" text,
	"voornamen" text,
	"voorvoegsel" text,
	"geslachtsnaam" text NOT NULL,
	"geboortedatum" date NOT NULL,
	"geboorteplaats" text NOT NULL,
	"geboorteland" text DEFAULT 'Nederland' NOT NULL,
	"ouders_onbekend" boolean DEFAULT false NOT NULL,
	"naamgebruik_keuze" "naamgebruik_keuze",
	"email" text,
	"telefoon" text,
	"adres" text,
	"postcode" text,
	"plaats" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ihw"."payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"gemeente_oin" text NOT NULL,
	"provider" text DEFAULT 'worldonline' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"external_reference" text,
	"external_transaction_id" text,
	"redirect_url" text,
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"payment_method" text,
	"failure_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ihw"."type_ceremonie" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"naam" text NOT NULL,
	"omschrijving" text,
	"eigen_babs_toegestaan" boolean DEFAULT false NOT NULL,
	"gratis" boolean DEFAULT false NOT NULL,
	"budget" boolean DEFAULT false NOT NULL,
	"openstelling_weken" integer DEFAULT 6 NOT NULL,
	"lead_time_days" integer DEFAULT 14 NOT NULL,
	"wijzigbaar_tot_days" integer DEFAULT 7 NOT NULL,
	"max_getuigen" integer DEFAULT 4 NOT NULL,
	"actief" boolean DEFAULT true NOT NULL,
	"volgorde" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "type_ceremonie_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "ihw"."aankondiging" ADD CONSTRAINT "aankondiging_dossier_id_dossier_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "ihw"."dossier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."aankondiging" ADD CONSTRAINT "aankondiging_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."ceremonie" ADD CONSTRAINT "ceremonie_dossier_id_dossier_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "ihw"."dossier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."ceremonie" ADD CONSTRAINT "ceremonie_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."ceremonie" ADD CONSTRAINT "ceremonie_locatie_id_locatie_id_fk" FOREIGN KEY ("locatie_id") REFERENCES "ihw"."locatie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."ceremonie" ADD CONSTRAINT "ceremonie_babs_id_babs_id_fk" FOREIGN KEY ("babs_id") REFERENCES "ihw"."babs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."dossier" ADD CONSTRAINT "dossier_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."dossier" ADD CONSTRAINT "dossier_type_ceremonie_id_type_ceremonie_id_fk" FOREIGN KEY ("type_ceremonie_id") REFERENCES "ihw"."type_ceremonie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."dossier_block" ADD CONSTRAINT "dossier_block_dossier_id_dossier_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "ihw"."dossier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."dossier_block" ADD CONSTRAINT "dossier_block_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."getuige" ADD CONSTRAINT "getuige_dossier_id_dossier_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "ihw"."dossier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."getuige" ADD CONSTRAINT "getuige_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."kind" ADD CONSTRAINT "kind_dossier_id_dossier_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "ihw"."dossier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."kind" ADD CONSTRAINT "kind_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."kind" ADD CONSTRAINT "kind_partner_id_partner_id_fk" FOREIGN KEY ("partner_id") REFERENCES "ihw"."partner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."partner" ADD CONSTRAINT "partner_dossier_id_dossier_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "ihw"."dossier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."partner" ADD CONSTRAINT "partner_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."payment" ADD CONSTRAINT "payment_dossier_id_dossier_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "ihw"."dossier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ihw"."payment" ADD CONSTRAINT "payment_gemeente_oin_gemeente_oin_fk" FOREIGN KEY ("gemeente_oin") REFERENCES "ihw"."gemeente"("oin") ON DELETE no action ON UPDATE no action;