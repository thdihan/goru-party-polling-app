const XLSX = require("xlsx");
const { PrismaClient } = require("./src/generated/prisma");
const fs = require("fs");

const prisma = new PrismaClient();

async function testExportDirect() {
    try {
        console.log("Testing direct export functionality...");

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

        console.log(`Found ${polls.length} polls to export`);

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

        // Create detailed sheet for each poll that has data
        const pollsWithData = polls.filter((poll) => poll.names.length > 0);
        console.log(
            `Creating detailed sheets for ${pollsWithData.length} polls with data`
        );

        pollsWithData.slice(0, 5).forEach((poll) => {
            // Limit to first 5 polls with data for testing
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
            if (poll.names.length > 0) {
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
            }

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
        const allNames = [];
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

        // Generate Excel file
        const filename = `poll-results-${
            new Date().toISOString().split("T")[0]
        }.xlsx`;

        XLSX.writeFile(workbook, filename);

        console.log("✅ Excel file created successfully:", filename);

        // Check file size
        const stats = fs.statSync(filename);
        console.log("File size:", stats.size, "bytes");

        console.log("\nSummary of exported data:");
        console.log("- Total polls:", polls.length);
        console.log("- Polls with data:", pollsWithData.length);
        console.log(
            "- Total names submitted:",
            polls.reduce((sum, poll) => sum + poll.names.length, 0)
        );
        console.log(
            "- Total votes cast:",
            polls.reduce(
                (sum, poll) =>
                    sum +
                    poll.names.reduce(
                        (nameSum, name) => nameSum + name.votes.length,
                        0
                    ),
                0
            )
        );
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testExportDirect();
