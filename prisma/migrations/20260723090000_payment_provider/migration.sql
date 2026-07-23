-- Betaalprovider-velden (Mollie + provider-aanduiding)
ALTER TABLE "Subscription" ADD COLUMN "provider" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "mollieCustomerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "mollieSubscriptionId" TEXT;
