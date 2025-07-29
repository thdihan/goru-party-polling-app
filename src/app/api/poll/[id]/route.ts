import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const pollId = parseInt(id);

        if (isNaN(pollId)) {
            return NextResponse.json(
                { error: "Invalid poll ID" },
                { status: 400 }
            );
        }

        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                names: {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                studentId: true,
                            },
                        },
                        votes: {
                            include: {
                                voter: {
                                    select: {
                                        id: true,
                                        name: true,
                                        studentId: true,
                                    },
                                },
                            },
                        },
                    },
                },
                permission: {
                    select: {
                        name: true,
                        email: true,
                        studentId: true,
                    },
                },
            },
        });

        if (!poll) {
            return NextResponse.json(
                { error: "Poll not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(poll);
    } catch (error) {
        console.error("Fetch poll error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
