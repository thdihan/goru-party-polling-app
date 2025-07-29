"use server";

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

interface AddPermissionByEmailResult {
    success: boolean;
    message: string;
    addedCount: number;
    skippedCount: number;
    errors: string[];
}

const addPermissionByEmail = async (
    emails: string[]
): Promise<AddPermissionByEmailResult> => {
    try {
        // Validate input
        if (!emails || emails.length === 0) {
            return {
                success: false,
                message: "No email addresses provided",
                addedCount: 0,
                skippedCount: 0,
                errors: ["No email addresses provided"],
            };
        }

        const validEmails: string[] = [];
        const invalidEntries: string[] = [];

        for (const email of emails) {
            if (!email?.trim()) {
                continue;
            }

            const trimmedEmail = email.trim().toLowerCase();

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                invalidEntries.push(`${email} - Invalid email format`);
                continue;
            }

            // Validate IUT domain
            if (!trimmedEmail.endsWith("@iut-dhaka.edu")) {
                invalidEntries.push(`${email} - Must be an IUT email address`);
                continue;
            }

            validEmails.push(trimmedEmail);
        }

        if (validEmails.length === 0) {
            return {
                success: false,
                message: "No valid email addresses to process",
                addedCount: 0,
                skippedCount: 0,
                errors: invalidEntries,
            };
        }

        // Check for existing permissions
        const existingPermissions = await prisma.permission.findMany({
            where: {
                email: {
                    in: validEmails,
                },
            },
        });

        const existingEmails = new Set(existingPermissions.map((p) => p.email));

        const newEmails = validEmails.filter(
            (email) => !existingEmails.has(email)
        );

        let addedCount = 0;
        const addErrors: string[] = [];

        // Add new permissions with placeholder data
        for (const email of newEmails) {
            try {
                // Extract name from email (part before @)
                const emailPrefix = email.split("@")[0];
                const displayName = emailPrefix.replace(/[.\-_]/g, " ").trim();

                await prisma.permission.create({
                    data: {
                        email: email,
                        name: displayName || "TBD", // To Be Determined
                        studentId: "000000000", // Placeholder student ID
                        granted: false,
                    },
                });
                addedCount++;
            } catch (error) {
                console.error(`Error adding permission for ${email}:`, error);
                addErrors.push(`${email} - Failed to add permission`);
            }
        }

        const skippedCount = existingEmails.size;
        const finalErrors = [...invalidEntries, ...addErrors];

        return {
            success: addedCount > 0,
            message: `Successfully added ${addedCount} permission(s). ${skippedCount} already existed.`,
            addedCount,
            skippedCount,
            errors: finalErrors,
        };
    } catch (error) {
        console.error("Add permission by email error:", error);

        return {
            success: false,
            message: "Failed to add permissions",
            addedCount: 0,
            skippedCount: 0,
            errors: ["An unexpected error occurred. Please try again later."],
        };
    } finally {
        await prisma.$disconnect();
    }
};

export default addPermissionByEmail;
