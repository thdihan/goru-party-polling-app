"use server";

import { PrismaClient } from "@/generated/prisma";
import { isVerificationExpired } from "@/lib/emailVerification";

const prisma = new PrismaClient();

interface VerifyEmailResult {
    success: boolean;
    message: string;
    errors: string[];
}

const verifyEmail = async (
    email: string,
    code: string
): Promise<VerifyEmailResult> => {
    try {
        // Validate input
        if (!email?.trim()) {
            return {
                success: false,
                message: "Email is required",
                errors: ["Please provide your email address"],
            };
        }

        if (!code?.trim()) {
            return {
                success: false,
                message: "Verification code is required",
                errors: ["Please enter the verification code"],
            };
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedCode = code.trim().toUpperCase();

        // Find user with matching email and verification code
        const user = await prisma.user.findFirst({
            where: {
                email: normalizedEmail,
                emailVerificationCode: normalizedCode,
            },
        });

        if (!user) {
            return {
                success: false,
                message: "Invalid verification code",
                errors: [
                    "The verification code is incorrect or has expired.",
                    "Please check the code and try again.",
                    "If you need a new code, please register again.",
                ],
            };
        }

        // Check if user is already verified
        if (user.emailVerified) {
            return {
                success: false,
                message: "Email already verified",
                errors: [
                    "Your email has already been verified.",
                    "You can now log in with your credentials.",
                ],
            };
        }

        // Check if verification code has expired
        if (
            !user.emailVerificationExpires ||
            isVerificationExpired(user.emailVerificationExpires)
        ) {
            return {
                success: false,
                message: "Verification code expired",
                errors: [
                    "The verification code has expired.",
                    "Please register again to receive a new verification code.",
                ],
            };
        }

        // Verify the user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                emailVerificationCode: null,
                emailVerificationExpires: null,
            },
        });

        return {
            success: true,
            message: `Email verification successful! Welcome ${user.name}. You can now log in with your credentials.`,
            errors: [],
        };
    } catch (error) {
        console.error("Email verification error:", error);

        return {
            success: false,
            message: "Verification failed due to an unexpected error",
            errors: ["An unexpected error occurred. Please try again later."],
        };
    } finally {
        await prisma.$disconnect();
    }
};

export default verifyEmail;
