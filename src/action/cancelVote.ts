"use server";

import { PrismaClient } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

interface CancelVoteResult {
    success: boolean;
    message: string;
    errors: string[];
}

const cancelVote = async (voteData: {
    nameId: number;
}): Promise<CancelVoteResult> => {
    try {
        const { nameId } = voteData;

        // Get current user session
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return {
                success: false,
                message: "Not authenticated",
                errors: ["You must be logged in to cancel vote"],
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
        });

        if (!name) {
            return {
                success: false,
                message: "Name not found",
                errors: ["The specified name does not exist"],
            };
        }

        // Check if user has voted for this name
        const existingVote = await prisma.vote.findUnique({
            where: {
                voterId_nameId: {
                    voterId: session.user.id,
                    nameId: nameId,
                },
            },
        });

        if (!existingVote) {
            return {
                success: false,
                message: "No vote to cancel",
                errors: ["You haven't voted for this name yet"],
            };
        }

        // Cancel vote (delete it)
        await prisma.vote.delete({
            where: {
                id: existingVote.id,
            },
        });

        return {
            success: true,
            message: `Vote cancelled successfully for "${name.value}"`,
            errors: [],
        };
    } catch (error) {
        console.error("Cancel vote error:", error);

        return {
            success: false,
            message: "Failed to cancel vote",
            errors: ["An unexpected error occurred. Please try again later."],
        };
    } finally {
        await prisma.$disconnect();
    }
};

export default cancelVote;
