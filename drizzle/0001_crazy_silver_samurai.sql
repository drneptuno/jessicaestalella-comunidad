CREATE TYPE "public"."intencion" AS ENUM('socias', 'clientas', 'proveedoras', 'mentoria');--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"rubro" text,
	"zona" text,
	"bio" text,
	"ofrezco" text,
	"busco" text,
	"intencion" "intencion",
	"instagram" text,
	"sitio_web" text,
	"avatar_url" text,
	"visible" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;