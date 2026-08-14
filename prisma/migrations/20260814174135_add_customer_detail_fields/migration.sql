-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "business_registration_number" TEXT,
ADD COLUMN     "contact_department" TEXT,
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "corporate_registration_number" TEXT,
ADD COLUMN     "domain_key" TEXT,
ADD COLUMN     "remaining_usage_period" TEXT,
ADD COLUMN     "representative_email" TEXT,
ADD COLUMN     "tax_invoice_email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_domain_key_key" ON "customers"("domain_key");

