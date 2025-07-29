"use server";

import { PrismaClient } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

interface VoteResult {
    success: boolean;
    message: string;
    errors: string[];
}

const castVote = async (voteData: { nameId: number }): Promise<VoteResult> => {
    try {
        const { nameId } = voteData;

        // Get current user session
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return {
                success: false,
                message: "Not authenticated",
                errors: ["You must be logged in to vote"],
            };
        }

        // Validate input
        if (!nameId || nameId <= 0) {
            return {
                success: false,
                message: "Invalid name ID",
                errors: ["Name ID must be a positive number"],
            };
        }

        // Check if name exists
        const name = await prisma.name.findUnique({
            where: { id: nameId },
            include: { poll: true },
        });

        if (!name) {
            return {
                success: false,
                message: "Name not found",
                errors: ["The specified name does not exist"],
            };
        }

        // Check if user has already voted for this name
        const existingVote = await prisma.vote.findUnique({
            where: {
                voterId_nameId: {
                    voterId: session.user.id,
                    nameId: nameId,
                },
            },
        });

        if (existingVote) {
            return {
                success: false,
                message: "Already voted",
                errors: ["You have already voted for this name"],
            };
        }

        // Cast vote
        await prisma.vote.create({
            data: {
                voterId: session.user.id,
                nameId: nameId,
            },
        });

        return {
            success: true,
            message: `Vote cast successfully for "${name.value}"`,
            errors: [],
        };
    } catch (error) {
        console.error("Vote error:", error);

        // Handle specific Prisma errors
        if (error instanceof Error) {
            if (error.message.includes("Unique constraint failed")) {
                return {
                    success: false,
                    message: "Already voted",
                    errors: ["You have already voted for this name"],
                };
            }
        }

        return {
            success: false,
            message: "Failed to cast vote",
            errors: ["An unexpected error occurred. Please try again later."],
        };
    } finally {
        await prisma.$disconnect();
    }
};

export default castVote;
