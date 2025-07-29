"use server";

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

interface PermissionData {
    name: string;
    studentId: string;
    email: string;
}

interface AddPermissionResult {
    success: boolean;
    message: string;
    addedCount: number;
    skippedCount: number;
    errors: string[];
}

const addPermission = async (
    permissionsData: PermissionData[]
): Promise<AddPermissionResult> => {
    try {
        // Validate input
        if (!permissionsData || permissionsData.length === 0) {
            return {
                success: false,
                message: "No permission data provided",
                addedCount: 0,
                skippedCount: 0,
                errors: ["No permission data provided"],
            };
        }

        // Filter and validate permission data
        const validPermissions: PermissionData[] = [];
        const invalidEntries: string[] = [];

        for (const entry of permissionsData) {
            const { name, studentId, email } = entry;
            const errors: string[] = [];

            // Validate required fields
            if (!name?.trim()) {
                errors.push("Name is required");
            }
            if (!studentId?.trim()) {
                errors.push("Student ID is required");
            }
            if (!email?.trim()) {
                errors.push("Email is required");
            }

            if (errors.length > 0) {
                invalidEntries.push(
                    `${email || "Unknown"}: ${errors.join(", ")}`
                );
                continue;
            }

            // Validate email format and IUT domain
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                invalidEntries.push(`${email} - Invalid email format`);
                continue;
            }

            if (!email.trim().endsWith("@iut-dhaka.edu")) {
                invalidEntries.push(`${email} - Must be an IUT email address`);
                continue;
            }

            // Validate student ID format (9 digits)
            const studentIdRegex = /^\d{9}$/;
            if (!studentIdRegex.test(studentId.trim())) {
                invalidEntries.push(
                    `${email} - Student ID must be exactly 9 digits`
                );
                continue;
            }

            validPermissions.push({
                name: name.trim(),
                studentId: studentId.trim(),
                email: email.trim().toLowerCase(),
            });
        }

        if (validPermissions.length === 0) {
            return {
                success: false,
                message: "No valid permission data to process",
                addedCount: 0,
                skippedCount: 0,
                errors: invalidEntries,
            };
        }

        // Check for existing permissions (by email or studentId)
        const emails = validPermissions.map((p) => p.email);
        const studentIds = validPermissions.map((p) => p.studentId);

        const existingPermissions = await prisma.permission.findMany({
            where: {
                OR: [
                    { email: { in: emails } },
                    { studentId: { in: studentIds } },
                ],
            },
            select: {
                email: true,
                studentId: true,
            },
        });

        const existingEmails = new Set(existingPermissions.map((p) => p.email));
        const existingStudentIds = new Set(
            existingPermissions.map((p) => p.studentId)
        );

        const newPermissions = validPermissions.filter(
            (permission) =>
                !existingEmails.has(permission.email) &&
                !existingStudentIds.has(permission.studentId)
        );

        // Track skipped entries
        const skippedEntries = validPermissions.filter(
            (permission) =>
                existingEmails.has(permission.email) ||
                existingStudentIds.has(permission.studentId)
        );

        let addedCount = 0;
        const addErrors: string[] = [];

        // Add new permissions and create polls
        if (newPermissions.length > 0) {
            try {
                // Create permissions and polls in a transaction
                await prisma.$transaction(async (tx) => {
                    for (const permissionData of newPermissions) {
                        // Create permission
                        const permission = await tx.permission.create({
                            data: {
                                name: permissionData.name,
                                email: permissionData.email,
                                studentId: permissionData.studentId,
                                granted: true,
                            },
                        });

                        // Create poll for this permission
                        await tx.poll.create({
                            data: {
                                permissionId: permission.id,
                                title: permissionData.name,
                                description: `Polling for ${permissionData.name}`,
                            },
                        });

                        addedCount++;
                    }
                });
            } catch (error) {
                console.error("Error creating permissions and polls:", error);
                addErrors.push(
                    "Failed to create some permissions and polls in database"
                );
            }
        }

        // Compile all errors
        const allErrors = [...invalidEntries, ...addErrors];

        // Add warnings for skipped entries
        if (skippedEntries.length > 0) {
            allErrors.push(
                `${
                    skippedEntries.length
                } entry(ies) already have permissions: ${skippedEntries
                    .slice(0, 3)
                    .map((p) => p.email)
                    .join(", ")}${skippedEntries.length > 3 ? "..." : ""}`
            );
        }

        const success =
            addedCount > 0 ||
            (skippedEntries.length > 0 && invalidEntries.length === 0);
        const message = success
            ? `Successfully processed ${
                  addedCount + skippedEntries.length
              } entry(ies). Added: ${addedCount}, Already existed: ${
                  skippedEntries.length
              }`
            : "Failed to add any permissions";

        return {
            success,
            message,
            addedCount,
            skippedCount: skippedEntries.length,
            errors: allErrors,
        };
    } catch (error) {
        console.error("Unexpected error in addPermission:", error);
        return {
            success: false,
            message: "An unexpected error occurred",
            addedCount: 0,
            skippedCount: 0,
            errors: [
                `Unexpected error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            ],
        };
    } finally {
        await prisma.$disconnect();
    }
};

export default addPermission;
