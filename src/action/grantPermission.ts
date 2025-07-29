"use server";

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

interface GrantPermissionResult {
    success: boolean;
    message: string;
    errors: string[];
    pollId?: number;
}

const grantPermission = async (permissionData: {
    name: string;
    email: string;
    studentId: string;
}): Promise<GrantPermissionResult> => {
    try {
        const { name, email, studentId } = permissionData;

        // Validate input
        if (!name?.trim()) {
            return {
                success: false,
                message: "Name is required",
                errors: ["Name cannot be empty"],
            };
        }

        if (!email?.trim()) {
            return {
                success: false,
                message: "Email is required",
                errors: ["Email cannot be empty"],
            };
        }

        if (!studentId?.trim()) {
            return {
                success: false,
                message: "Student ID is required",
                errors: ["Student ID cannot be empty"],
            };
        }

        // Validate email format and domain
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                message: "Invalid email format",
                errors: ["Please enter a valid email address"],
            };
        }

        if (!email.endsWith("@iut-dhaka.edu")) {
            return {
                success: false,
                message: "Invalid email domain",
                errors: ["Please use an IUT email address (@iut-dhaka.edu)"],
            };
        }

        // Validate student ID format
        const studentIdRegex = /^\d{9}$/;
        if (!studentIdRegex.test(studentId.trim())) {
            return {
                success: false,
                message: "Invalid Student ID format",
                errors: ["Student ID must be exactly 9 digits"],
            };
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedStudentId = studentId.trim();

        // Check if permission already exists
        const existingPermission = await prisma.permission.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { studentId: normalizedStudentId },
                ],
            },
        });

        if (existingPermission) {
            if (existingPermission.email === normalizedEmail) {
                return {
                    success: false,
                    message: "Email already has permission",
                    errors: [
                        "This email address already has a permission record",
                    ],
                };
            } else {
                return {
                    success: false,
                    message: "Student ID already has permission",
                    errors: ["This Student ID already has a permission record"],
                };
            }
        }

        // Create permission and poll in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create permission
            const permission = await tx.permission.create({
                data: {
                    name: name.trim(),
                    email: normalizedEmail,
                    studentId: normalizedStudentId,
                    granted: true,
                },
            });

            // Create poll for this permission
            const poll = await tx.poll.create({
                data: {
                    permissionId: permission.id,
                    title: name.trim(),
                    description: `Polling for ${name.trim()}`,
                },
            });

            return { permission, poll };
        });

        return {
            success: true,
            message: `Permission granted successfully for ${name}! Poll created with ID: ${result.poll.id}`,
            errors: [],
            pollId: result.poll.id,
        };
    } catch (error) {
        console.error("Grant permission error:", error);

        // Handle specific Prisma errors
        if (error instanceof Error) {
            if (error.message.includes("Unique constraint failed")) {
                return {
                    success: false,
                    message: "Permission already exists",
                    errors: [
                        "Permission for this email or student ID already exists",
                    ],
                };
            }
        }

        return {
            success: false,
            message: "Failed to grant permission",
            errors: ["An unexpected error occurred. Please try again later."],
        };
    } finally {
        await prisma.$disconnect();
    }
};

export default grantPermission;
