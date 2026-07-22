-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('GRATIS', 'WAKER', 'WAKER_PLUS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "WoningType" AS ENUM ('APPARTEMENT', 'EENGEZINSWONING', 'STUDIO', 'KAMER', 'BENEDENWONING', 'BOVENWONING', 'SENIORENWONING', 'ONBEKEND');

-- CreateEnum
CREATE TYPE "Verdeelmodel" AS ENUM ('INSCHRIJFDUUR', 'LOTING', 'DIRECT_KANS', 'EERSTE_PASSENDE', 'JONGERENWONING', 'SENIORENWONING', 'LOKALE_VOORRANG', 'DOORSTROMING', 'TIJDELIJKE_HUUR', 'ONBEKEND');

-- CreateEnum
CREATE TYPE "GeschiktheidStatus" AS ENUM ('WAARSCHIJNLIJK_GESCHIKT', 'HANDMATIGE_CONTROLE', 'WAARSCHIJNLIJK_NIET_GESCHIKT');

-- CreateEnum
CREATE TYPE "Kansindicatie" AS ENUM ('ZEER_LAAG', 'LAAG', 'GEMIDDELD', 'HOOG', 'ONBEKEND');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('VOORBEREID', 'GEREAGEERD', 'UITGENODIGD', 'BEZICHTIGING', 'AANBOD', 'AFGEWEZEN', 'INGETROKKEN', 'VERLOPEN');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'TELEGRAM', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NIEUWE_MATCH', 'BIJNA_SLUITEN', 'ZOEKPUNTEN', 'INSCHRIJVING_VERLOOPT', 'DOCUMENT_VERLOOPT', 'BETALING', 'SYSTEEM');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INKOMENSVERKLARING', 'LOONSTROOK', 'JAAROPGAVE', 'BRP_UITTREKSEL', 'VERHUURDERSVERKLARING', 'IDENTITEITSBEWIJS', 'MEDEAANVRAGER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ONTBREEKT', 'AANGEVRAAGD', 'AANWEZIG', 'VERLOPEN');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIEF', 'INACTIEF', 'ACTIE_NODIG');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "plan" "Plan" NOT NULL DEFAULT 'GRATIS',
    "locale" TEXT NOT NULL DEFAULT 'nl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "telegramChatId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brutoJaarinkomen" INTEGER,
    "huishoudgrootte" INTEGER,
    "leeftijd" INTEGER,
    "huidigeWoonplaats" TEXT,
    "gewensteRegios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gewensteGemeenten" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxHuurprijs" INTEGER,
    "minKamers" INTEGER,
    "woningtypes" "WoningType"[] DEFAULT ARRAY[]::"WoningType"[],
    "liftVereist" BOOLEAN NOT NULL DEFAULT false,
    "beganeGrondVereist" BOOLEAN NOT NULL DEFAULT false,
    "maxReisafstandKm" INTEGER,
    "lokaleBinding" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "voorrangsredenen" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "studerend" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "regios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gemeenten" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxHuurprijs" INTEGER,
    "minHuurprijs" INTEGER,
    "minKamers" INTEGER,
    "minOppervlakte" INTEGER,
    "woningtypes" "WoningType"[] DEFAULT ARRAY[]::"WoningType"[],
    "verdeelmodellen" "Verdeelmodel"[] DEFAULT ARRAY[]::"Verdeelmodel"[],
    "alleenGeschikt" BOOLEAN NOT NULL DEFAULT false,
    "liftVereist" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformSlug" TEXT NOT NULL,
    "platformNaam" TEXT NOT NULL,
    "regio" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'ACTIEF',
    "inschrijfdatum" TIMESTAMP(3),
    "verlengdatum" TIMESTAMP(3),
    "inschrijfnummer" TEXT,
    "actieNodig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "platformSlug" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "bronUrl" TEXT NOT NULL,
    "plaats" TEXT NOT NULL,
    "wijk" TEXT,
    "gemeente" TEXT,
    "regio" TEXT,
    "corporatie" TEXT,
    "huurprijs" INTEGER NOT NULL,
    "servicekosten" INTEGER NOT NULL DEFAULT 0,
    "oppervlakte" INTEGER,
    "kamers" INTEGER,
    "slaapkamers" INTEGER,
    "woningtype" "WoningType" NOT NULL DEFAULT 'ONBEKEND',
    "verdeelmodel" "Verdeelmodel" NOT NULL DEFAULT 'ONBEKEND',
    "verdiepingen" INTEGER,
    "heeftLift" BOOLEAN,
    "beganeGrond" BOOLEAN,
    "minLeeftijd" INTEGER,
    "maxLeeftijd" INTEGER,
    "maxInkomen" INTEGER,
    "minInkomen" INTEGER,
    "maxHuishoudgrootte" INTEGER,
    "minHuishoudgrootte" INTEGER,
    "lokaleBindingGemeente" TEXT,
    "doelgroep" TEXT,
    "gepubliceerdOp" TIMESTAMP(3) NOT NULL,
    "sluitDatum" TIMESTAMP(3),
    "titel" TEXT,
    "omschrijving" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "geschiktheidScore" INTEGER NOT NULL,
    "geschiktheidStatus" "GeschiktheidStatus" NOT NULL,
    "woonwensScore" INTEGER NOT NULL,
    "kansindicatie" "Kansindicatie" NOT NULL,
    "geschiktheidRedenen" JSONB NOT NULL,
    "woonwensRedenen" JSONB NOT NULL,
    "kansRedenen" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiddenListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "woningTitel" TEXT NOT NULL,
    "platformSlug" TEXT NOT NULL,
    "regio" TEXT,
    "verdeelmodel" "Verdeelmodel" NOT NULL DEFAULT 'ONBEKEND',
    "geschiktheidScore" INTEGER,
    "woonwensScore" INTEGER,
    "kansindicatie" "Kansindicatie",
    "status" "ApplicationStatus" NOT NULL DEFAULT 'VOORBEREID',
    "gevondenOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gereageerdOp" TIMESTAMP(3),
    "positie" INTEGER,
    "uitnodiging" BOOLEAN NOT NULL DEFAULT false,
    "bezichtiging" BOOLEAN NOT NULL DEFAULT false,
    "aanbod" BOOLEAN NOT NULL DEFAULT false,
    "afwijzing" BOOLEAN NOT NULL DEFAULT false,
    "notities" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchPointRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "regio" TEXT NOT NULL,
    "reactiesPerMaand" INTEGER NOT NULL DEFAULT 1,
    "tellendeModellen" "Verdeelmodel"[] DEFAULT ARRAY[]::"Verdeelmodel"[],
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchPointRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchPointPeriod" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jaar" INTEGER NOT NULL,
    "maand" INTEGER NOT NULL,
    "doel" INTEGER NOT NULL,
    "behaald" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchPointPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChecklistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ONTBREEKT',
    "verloopt" TIMESTAMP(3),
    "notitie" TEXT,
    "voorMedeaanvrager" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "titel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "gelezen" BOOLEAN NOT NULL DEFAULT false,
    "channels" "NotificationChannel"[] DEFAULT ARRAY[]::"NotificationChannel"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'GRATIS',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actie" TEXT NOT NULL,
    "entiteit" TEXT,
    "entiteitId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorStatus" (
    "id" TEXT NOT NULL,
    "platformSlug" TEXT NOT NULL,
    "platformNaam" TEXT NOT NULL,
    "gezond" BOOLEAN NOT NULL DEFAULT true,
    "laatsteSync" TIMESTAMP(3),
    "laatsteFout" TEXT,
    "aantalWoningen" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "SearchProfile_userId_idx" ON "SearchProfile"("userId");

-- CreateIndex
CREATE INDEX "PlatformRegistration_userId_idx" ON "PlatformRegistration"("userId");

-- CreateIndex
CREATE INDEX "Listing_regio_idx" ON "Listing"("regio");

-- CreateIndex
CREATE INDEX "Listing_sluitDatum_idx" ON "Listing"("sluitDatum");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_platformSlug_externalId_key" ON "Listing"("platformSlug", "externalId");

-- CreateIndex
CREATE INDEX "ListingMatch_userId_idx" ON "ListingMatch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingMatch_userId_listingId_key" ON "ListingMatch"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "Favorite"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenListing_userId_listingId_key" ON "HiddenListing"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingNote_userId_listingId_key" ON "ListingNote"("userId", "listingId");

-- CreateIndex
CREATE INDEX "ApplicationLog_userId_idx" ON "ApplicationLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchPointRule_userId_regio_key" ON "SearchPointRule"("userId", "regio");

-- CreateIndex
CREATE INDEX "SearchPointPeriod_userId_idx" ON "SearchPointPeriod"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchPointPeriod_ruleId_jaar_maand_key" ON "SearchPointPeriod"("ruleId", "jaar", "maand");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChecklistItem_userId_type_voorMedeaanvrager_key" ON "DocumentChecklistItem"("userId", "type", "voorMedeaanvrager");

-- CreateIndex
CREATE INDEX "Notification_userId_gelezen_idx" ON "Notification"("userId", "gelezen");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_channel_key" ON "NotificationPreference"("userId", "type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_actie_idx" ON "AuditLog"("actie");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorStatus_platformSlug_key" ON "ConnectorStatus"("platformSlug");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchProfile" ADD CONSTRAINT "SearchProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRegistration" ADD CONSTRAINT "PlatformRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingMatch" ADD CONSTRAINT "ListingMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingMatch" ADD CONSTRAINT "ListingMatch_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenListing" ADD CONSTRAINT "HiddenListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenListing" ADD CONSTRAINT "HiddenListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingNote" ADD CONSTRAINT "ListingNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingNote" ADD CONSTRAINT "ListingNote_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLog" ADD CONSTRAINT "ApplicationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLog" ADD CONSTRAINT "ApplicationLog_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchPointRule" ADD CONSTRAINT "SearchPointRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchPointPeriod" ADD CONSTRAINT "SearchPointPeriod_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "SearchPointRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchPointPeriod" ADD CONSTRAINT "SearchPointPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChecklistItem" ADD CONSTRAINT "DocumentChecklistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

