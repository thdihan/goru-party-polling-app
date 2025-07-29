import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const polls = await prisma.poll.findMany({
            include: {
                permission: {
                    select: {
                        name: true,
                        email: true,
                        studentId: true,
                    },
                },
                names: {
                    include: {
                        votes: {
                            select: { id: true },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(polls);
    } catch (error) {
        console.error("Fetch polls error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
