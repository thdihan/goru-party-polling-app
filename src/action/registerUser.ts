"use server";

import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";
import emailService from "@/lib/emailService";
import {
    generateVerificationCode,
    getVerificationExpiry,
} from "@/lib/emailVerification";

const prisma = new PrismaClient();

interface RegisterUserResult {
    success: boolean;
    message: string;
    errors: string[];
    requiresVerification?: boolean;
}

const registerUser = async (userData: {
    name: string;
    email: string;
    studentId: string;
    password: string;
}): Promise<RegisterUserResult> => {
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
                errors: ["Please use your IUT email address (@iut-dhaka.edu)"],
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
            if (existingUser.emailVerified) {
                // User exists and is verified
                if (existingUser.email === normalizedEmail) {
                    return {
                        success: false,
                        message: "User already exists",
                        errors: [
                            "An account with this email address already exists.",
                            "Please try logging in instead.",
                            "If you forgot your password, use the password reset feature.",
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
            } else {
                // User exists but not verified - update with new verification code
                const verificationCode = generateVerificationCode();
                const verificationExpiry = getVerificationExpiry();

                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        name: name.trim(), // Update name in case it changed
                        emailVerificationCode: verificationCode,
                        emailVerificationExpires: verificationExpiry,
                        password: await bcrypt.hash(password, 12), // Update password
                    },
                });

                // Send verification email
                console.log("EMAIL VERIFICATION CALLING  -> START");
                const emailSent = await emailService.sendVerificationEmail(
                    normalizedEmail,
                    verificationCode,
                    name.trim()
                );
                console.log("EMAIL VERIFICATION CALLING  -> DONE");

                if (!emailSent) {
                    return {
                        success: false,
                        message: "Failed to send verification email",
                        errors: ["Please try again later or contact support."],
                    };
                }

                return {
                    success: true,
                    message:
                        "Verification email sent! Please check your email and enter the verification code.",
                    errors: [],
                    requiresVerification: true,
                };
            }
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationExpiry = getVerificationExpiry();

        // Create user with verification code (not verified yet)
        const newUser = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                studentId: normalizedStudentId,
                password: hashedPassword,
                role: "user",
                emailVerificationCode: verificationCode,
                emailVerificationExpires: verificationExpiry,
                emailVerified: null, // Not verified yet
            },
            select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
                role: true,
            },
        });

        // Send verification email
        const emailSent = await emailService.sendVerificationEmail(
            normalizedEmail,
            verificationCode,
            name.trim()
        );

        if (!emailSent) {
            // If email sending fails, delete the user and return error
            await prisma.user.delete({ where: { id: newUser.id } });
            return {
                success: false,
                message: "Failed to send verification email",
                errors: ["Please try again later or contact support."],
            };
        }

        return {
            success: true,
            message: `Registration successful! A verification email has been sent to ${normalizedEmail}. Please check your email and enter the verification code to complete your registration.`,
            errors: [],
            requiresVerification: true,
        };
    } catch (error) {
        console.error("Registration error:", error);

        // Handle specific Prisma errors
        if (error instanceof Error) {
            if (error.message.includes("Unique constraint failed")) {
                return {
                    success: false,
                    message: "User already exists",
                    errors: ["An account with this email already exists"],
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

export default registerUser;
