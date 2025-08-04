// app/api/export-polls/route.ts
import * as XLSX from "xlsx";
import { PrismaClient } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return Response.json(
                {
                    error: "Authentication required",
                },
                { status: 401 }
            );
        }

        if (session.user.role !== "admin") {
            return Response.json(
                {
                    error: "Admin access required",
                },
                { status: 403 }
            );
        }
        // Get all polls with their related data
        const polls = await prisma.poll.findMany({
            include: {
                permission: true,
                names: {
                    include: {
                        creator: {
                            select: {
                                name: true,
                                email: true,
                                studentId: true,
                            },
                        },
                        votes: {
                            include: {
                                voter: {
                                    select: {
                                        name: true,
                                        email: true,
                                        studentId: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Create summary sheet
        const summaryData = [
            ["Poll Summary Report"],
            ["Generated on:", new Date().toLocaleString()],
            ["Total Polls:", polls.length],
            [""],
            [
                "Poll ID",
                "Poll Title",
                "Permission Holder",
                "Total Names",
                "Total Votes",
                "Created Date",
            ],
        ];

        polls.forEach((poll) => {
            const totalNames = poll.names.length;
            const totalVotes = poll.names.reduce(
                (sum, name) => sum + name.votes.length,
                0
            );

            summaryData.push([
                poll.id,
                poll.title || "Untitled Poll",
                poll.permission.name,
                totalNames,
                totalVotes,
                poll.createdAt.toLocaleDateString(),
            ]);
        });

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        // Create detailed sheet for each poll
        polls.forEach((poll) => {
            const pollData = [
                [`Poll: ${poll.title || "Untitled Poll"}`],
                [
                    `Permission Holder: ${poll.permission.name} (${poll.permission.email})`,
                ],
                [`Created: ${poll.createdAt.toLocaleString()}`],
                [""],
                ["Name", "Vote Count", "Suggested By", "Voters List"],
            ];

            // Sort names by vote count (descending)
            const sortedNames = poll.names.sort(
                (a, b) => b.votes.length - a.votes.length
            );

            sortedNames.forEach((name) => {
                const votersList = name.votes
                    .map(
                        (vote) => `${vote.voter.name} (${vote.voter.studentId})`
                    )
                    .join("; ");

                pollData.push([
                    name.value,
                    name.votes.length.toString(),
                    `${name.creator.name} (${name.creator.studentId})`,
                    votersList || "No votes yet",
                ]);
            });

            // Add voter analysis
            pollData.push([""]);
            pollData.push(["Voter Analysis"]);
            pollData.push([
                "Voter Name",
                "Student ID",
                "Email",
                "Votes Cast",
                "Voted For",
            ]);

            // Get all unique voters for this poll
            const votersMap = new Map();
            poll.names.forEach((name) => {
                name.votes.forEach((vote) => {
                    if (!votersMap.has(vote.voter.studentId)) {
                        votersMap.set(vote.voter.studentId, {
                            name: vote.voter.name,
                            studentId: vote.voter.studentId,
                            email: vote.voter.email,
                            votedFor: [],
                        });
                    }
                    votersMap
                        .get(vote.voter.studentId)
                        .votedFor.push(name.value);
                });
            });

            // Add voter data
            votersMap.forEach((voter) => {
                pollData.push([
                    voter.name,
                    voter.studentId,
                    voter.email,
                    voter.votedFor.length.toString(),
                    voter.votedFor.join("; "),
                ]);
            });

            const pollSheet = XLSX.utils.aoa_to_sheet(pollData);

            // Set column widths
            pollSheet["!cols"] = [
                { width: 30 }, // Name
                { width: 12 }, // Vote Count
                { width: 30 }, // Suggested By
                { width: 50 }, // Voters List
            ];

            const sheetName =
                `Poll ${poll.id} - ${poll.permission.name}`.substring(0, 31);
            XLSX.utils.book_append_sheet(workbook, pollSheet, sheetName);
        });

        // Create overall statistics sheet
        const statsData = [
            ["Overall Statistics"],
            [""],
            ["Metric", "Value"],
            ["Total Polls", polls.length],
            [
                "Total Names Submitted",
                polls.reduce((sum, poll) => sum + poll.names.length, 0),
            ],
            [
                "Total Votes Cast",
                polls.reduce(
                    (sum, poll) =>
                        sum +
                        poll.names.reduce(
                            (nameSum, name) => nameSum + name.votes.length,
                            0
                        ),
                    0
                ),
            ],
            [""],
            ["Top 10 Most Voted Names (Across All Polls)"],
            ["Name", "Poll", "Vote Count", "Suggested By"],
        ];

        // Get all names from all polls and sort by vote count
        const allNames: Array<{
            value: string;
            voteCount: number;
            pollTitle: string;
            creator: string;
        }> = [];
        polls.forEach((poll) => {
            poll.names.forEach((name) => {
                allNames.push({
                    value: name.value,
                    voteCount: name.votes.length,
                    pollTitle: poll.title || "Untitled Poll",
                    creator: name.creator.name || "Unknown",
                });
            });
        });

        allNames.sort((a, b) => b.voteCount - a.voteCount);
        allNames.slice(0, 10).forEach((name) => {
            statsData.push([
                name.value,
                name.pollTitle,
                name.voteCount.toString(),
                name.creator,
            ]);
        });

        const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, statsSheet, "Statistics");

        // Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });

        // Create response with Excel file
        const response = new Response(excelBuffer, {
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="poll-results-${
                    new Date().toISOString().split("T")[0]
                }.xlsx"`,
            },
        });

        return response;
    } catch (error) {
        console.error("Error exporting polls:", error);
        return Response.json(
            {
                error: "Failed to export poll results",
                message:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
