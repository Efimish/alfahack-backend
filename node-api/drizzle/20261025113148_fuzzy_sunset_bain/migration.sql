CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"companyName" text NOT NULL,
	"companyInn" text NOT NULL,
	"companyOgrn" text NOT NULL,
	"companyActivity" text NOT NULL,
	"annualRevenue" numeric(14,2) NOT NULL,
	"netProfit" numeric(14,2) NOT NULL,
	"workingCapital" numeric(14,2) NOT NULL,
	"debtBurden" numeric(14,2) NOT NULL,
	"financingPurpose" text NOT NULL,
	"requestedAmount" numeric(14,2) NOT NULL,
	"termMonths" integer NOT NULL,
	"comment" text,
	"status" text DEFAULT 'Подана' NOT NULL,
	"assessment" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
