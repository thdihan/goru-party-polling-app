"use server";

import { PrismaClient } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

interface DeleteNameResult {
    success: boolean;
    message: string;
    errors: string[];
}

const deleteName = async (nameData: {
    nameId: number;
}): Promise<DeleteNameResult> => {
    try {
        const { nameId } = nameData;

        // Get current user session
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return {
                success: false,
                message: "Not authenticated",
                errors: ["You must be logged in to delete names"],
            };
        }

        // Check if user is admin
        if (session.user.role !== "admin") {
            return {
                success: false,
                message: "Unauthorized",
                errors: ["Only admins can delete names"],
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
            include: {
                votes: true,
            },
        });

        if (!name) {
            return {
                success: false,
                message: "Name not found",
                errors: ["The specified name does not exist"],
            };
        }

        // Delete all votes for this name first, then delete the name
        await prisma.$transaction(async (tx) => {
            // Delete all votes for this name
            await tx.vote.deleteMany({
                where: {
                    nameId: nameId,
                },
            });

            // Delete the name
            await tx.name.delete({
                where: {
                    id: nameId,
                },
            });
        });

        return {
            success: true,
            message: `Name "${name.value}" deleted successfully`,
            errors: [],
        };
    } catch (error) {
        console.error("Delete name error:", error);

        return {
            success: false,
            message: "Failed to delete name",
            errors: ["An unexpected error occurred. Please try again later."],
        };
    } finally {
        await prisma.$disconnect();
    }
};

export default deleteName;
