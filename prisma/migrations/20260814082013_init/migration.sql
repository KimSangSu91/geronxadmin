-- CreateEnum
CREATE TYPE "customer_status" AS ENUM ('INQUIRY', 'IN_PROGRESS', 'COMPLETED', 'STOPPED', 'PENDING');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('CONTRACT', 'HANDOVER', 'AERIAL_VIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "document_status" AS ENUM ('DRAFT', 'FINALIZED');

-- CreateEnum
CREATE TYPE "device_status" AS ENUM ('IN_STOCK', 'MAPPING', 'RETURN_PENDING', 'RETRIEVED', 'DAMAGED', 'DISPOSED');

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "facility_scale" TEXT,
    "status" "customer_status" NOT NULL DEFAULT 'INQUIRY',
    "assigned_staff_id" TEXT,
    "contracted_device_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_action_logs" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "action_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "author_staff_id" TEXT,

    CONSTRAINT "customer_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_item_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_item_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_checklist_items" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "checked_at" TIMESTAMP(3),
    "checked_by_staff_id" TEXT,

    CONSTRAINT "customer_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_documents" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "doc_type" "document_type" NOT NULL,
    "draft_file_url" TEXT,
    "final_file_url" TEXT,
    "status" "document_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_type_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_type_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "device_type_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_uid" TEXT NOT NULL,
    "serial_number" TEXT,
    "received_date" TIMESTAMP(3),
    "registered_date" TIMESTAMP(3),
    "status" "device_status" NOT NULL DEFAULT 'IN_STOCK',

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_mappings" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "mapped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unmapped_at" TIMESTAMP(3),
    "mapped_by_staff_id" TEXT,

    CONSTRAINT "device_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_status_logs" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "from_status" "device_status",
    "to_status" "device_status" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by_staff_id" TEXT,
    "note" TEXT,

    CONSTRAINT "device_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sanitizations" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "sanitized_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sanitized_by_staff_id" TEXT,
    "result" TEXT,

    CONSTRAINT "device_sanitizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_as_histories" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issue_description" TEXT NOT NULL,
    "handled_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "device_as_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_item_masters_name_key" ON "checklist_item_masters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customer_checklist_items_customer_id_item_id_key" ON "customer_checklist_items"("customer_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_type_masters_name_key" ON "device_type_masters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "device_type_masters_code_key" ON "device_type_masters"("code");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_uid_key" ON "devices"("device_uid");

-- CreateIndex
CREATE UNIQUE INDEX "devices_serial_number_key" ON "devices"("serial_number");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_action_logs" ADD CONSTRAINT "customer_action_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_action_logs" ADD CONSTRAINT "customer_action_logs_author_staff_id_fkey" FOREIGN KEY ("author_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_checklist_items" ADD CONSTRAINT "customer_checklist_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_checklist_items" ADD CONSTRAINT "customer_checklist_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "checklist_item_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_checklist_items" ADD CONSTRAINT "customer_checklist_items_checked_by_staff_id_fkey" FOREIGN KEY ("checked_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_documents" ADD CONSTRAINT "customer_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_device_type_id_fkey" FOREIGN KEY ("device_type_id") REFERENCES "device_type_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_mappings" ADD CONSTRAINT "device_mappings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_mappings" ADD CONSTRAINT "device_mappings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_mappings" ADD CONSTRAINT "device_mappings_mapped_by_staff_id_fkey" FOREIGN KEY ("mapped_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_status_logs" ADD CONSTRAINT "device_status_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_status_logs" ADD CONSTRAINT "device_status_logs_changed_by_staff_id_fkey" FOREIGN KEY ("changed_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sanitizations" ADD CONSTRAINT "device_sanitizations_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sanitizations" ADD CONSTRAINT "device_sanitizations_sanitized_by_staff_id_fkey" FOREIGN KEY ("sanitized_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_as_histories" ADD CONSTRAINT "device_as_histories_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
