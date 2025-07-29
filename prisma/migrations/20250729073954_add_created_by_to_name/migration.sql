/*
  Warnings:

  - Added the required column `createdBy` to the `Name` table without a default value. This is not possible if the table is not empty.

*/

-- First, add the createdAt column with default value
ALTER TABLE "Name" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add the createdBy column as nullable first
ALTER TABLE "Name" ADD COLUMN "createdBy" TEXT;

-- Set all existing names to be created by the first admin user (if exists)
-- If no admin user exists, create a placeholder system user
DO $$
DECLARE
    admin_user_id TEXT;
    system_user_id TEXT;
BEGIN
    -- Try to find an admin user
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        -- If no admin exists, try to find any user
        SELECT id INTO admin_user_id FROM users LIMIT 1;
    END IF;
    
    IF admin_user_id IS NULL THEN
        -- If no users exist at all, create a system user
        INSERT INTO users (id, name, email, studentId, role) 
        VALUES ('system', 'System', 'system@goruparty.com', 'SYSTEM', 'admin')
        RETURNING id INTO system_user_id;
        admin_user_id := system_user_id;
    END IF;
    
    -- Update all existing names to have the admin/system user as creator
    UPDATE "Name" SET "createdBy" = admin_user_id WHERE "createdBy" IS NULL;
END $$;

-- Now make the createdBy column NOT NULL
ALTER TABLE "Name" ALTER COLUMN "createdBy" SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE "Name" ADD CONSTRAINT "Name_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
