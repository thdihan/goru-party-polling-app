"use server";

import { PrismaClient } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

interface AddNameResult {
    success: boolean;
    message: string;
    errors: string[];
    nameId?: number;
}

const addNameToPoll = async (nameData: {
    pollId: number;
    name: string;
}): Promise<AddNameResult> => {
    try {
        const { pollId, name } = nameData;

        // Get current user session
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return {
                success: false,
                message: "Not authenticated",
                errors: ["You must be logged in to add names"],
            };
        }

        // Validate input
        if (!name?.trim()) {
            return {
                success: false,
                message: "Name is required",
                errors: ["Name cannot be empty"],
            };
        }

        if (!pollId || pollId <= 0) {
            return {
                success: false,
                message: "Invalid poll ID",
                errors: ["Poll ID must be a positive number"],
            };
        }

        const trimmedName = name.trim();

        // Check if poll exists
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: { names: true },
        });

        if (!poll) {
            return {
                success: false,
                message: "Poll not found",
                errors: ["The specified poll does not exist"],
            };
        }

        // Check if name already exists in this poll
        const existingName = poll.names.find(
            (n) => n.value.toLowerCase() === trimmedName.toLowerCase()
        );

        if (existingName) {
            return {
                success: false,
                message: "Name already exists",
                errors: ["This name is already in the poll"],
            };
        }

        // Add name to poll
        const newName = await prisma.name.create({
            data: {
                pollId: pollId,
                value: trimmedName,
                createdBy: session.user.id,
            },
        });

        return {
            success: true,
            message: `Name "${trimmedName}" added successfully to poll`,
            errors: [],
            nameId: newName.id,
        };
    } catch (error) {
        console.error("Add name error:", error);

        return {
            success: false,
            message: "Failed to add name",
            errors: ["An unexpected error occurred. Please try again later."],
        };
    } finally {
        await prisma.$disconnect();
    }
};

export default addNameToPoll;
