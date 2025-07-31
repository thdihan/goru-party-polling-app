"use server";

import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface CompleteRegistrationResult {
    success: boolean;
    message: string;
    errors: string[];
}

const completeRegistration = async (userData: {
    name: string;
    email: string;
    studentId: string;
    password: string;
}): Promise<CompleteRegistrationResult> => {
    try {
        const { name, email, studentId, password } = userData;

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

        if (!password) {
            return {
                success: false,
                message: "Password is required",
                errors: ["Password cannot be empty"],
            };
        }

        // Validate email format
        if (!email.endsWith("@iut-dhaka.edu")) {
            return {
                success: false,
                message: "Invalid email domain",
                errors: ["Only IUT email addresses are allowed"],
            };
        }

        // Validate student ID format (9 digits)
        if (!/^\d{9}$/.test(studentId.trim())) {
            return {
                success: false,
                message: "Invalid Student ID format",
                errors: ["Student ID must be exactly 9 digits"],
            };
        }

        // Validate password strength
        if (password.length < 6) {
            return {
                success: false,
                message: "Password too weak",
                errors: ["Password must be at least 6 characters long"],
            };
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedStudentId = studentId.trim();

        // Check if both email and studentId have permission to register
        const permission = await prisma.permission.findFirst({
            where: {
                AND: [
                    { email: normalizedEmail },
                    { studentId: normalizedStudentId },
                    { granted: true },
                ],
            },
        });

        if (!permission) {
            return {
                success: false,
                message: "Registration not permitted",
                errors: [
                    "Your email and student ID combination is not permitted to register.",
                    "Please contact the administrator to get permission.",
                    "Both email and student ID must be approved for registration.",
                ],
            };
        }

        // Check if user already exists (by email or student ID)
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { studentId: normalizedStudentId },
                ],
            },
        });

        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                return {
                    success: false,
                    message: "User already exists",
                    errors: [
                        "An account with this email address already exists.",
                        "Please try logging in instead.",
                    ],
                };
            } else {
                return {
                    success: false,
                    message: "Student ID already registered",
                    errors: [
                        "An account with this Student ID already exists.",
                        "Please check your Student ID or contact support.",
                    ],
                };
            }
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user (already verified since they used Google OAuth)
        const newUser = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                studentId: normalizedStudentId,
                password: hashedPassword,
                role: "user",
                emailVerified: new Date(), // Mark as verified since they used Google OAuth
            },
            select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
                role: true,
            },
        });

        return {
            success: true,
            message: `Registration completed successfully! Welcome ${newUser.name}.`,
            errors: [],
        };
    } catch (error) {
        console.error("Registration completion error:", error);

        // Handle specific Prisma errors
        if (error instanceof Error) {
            if (error.message.includes("Unique constraint failed")) {
                return {
                    success: false,
                    message: "User already exists",
                    errors: ["An account with this information already exists"],
                };
            }

            if (error.message.includes("Foreign key constraint failed")) {
                return {
                    success: false,
                    message: "Permission required",
                    errors: [
                        "Email permission not found. Contact administrator.",
                    ],
                };
            }
        }

        return {
            success: false,
            message: "Registration failed due to an unexpected error",
            errors: ["An unexpected error occurred. Please try again later."],
        };
    } finally {
        await prisma.$disconnect();
    }
};

export default completeRegistration;
