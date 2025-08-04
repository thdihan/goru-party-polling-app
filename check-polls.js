const { PrismaClient } = require("./src/generated/prisma");

const prisma = new PrismaClient();

async function checkPolls() {
    try {
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

        console.log("Found polls:", polls.length);
        polls.forEach((poll, index) => {
            console.log(`\nPoll ${index + 1}:`);
            console.log(`  ID: ${poll.id}`);
            console.log(`  Title: ${poll.title || "Untitled"}`);
            console.log(
                `  Permission Holder: ${poll.permission.name} (${poll.permission.email})`
            );
            console.log(`  Names: ${poll.names.length}`);
            console.log(
                `  Total Votes: ${poll.names.reduce(
                    (sum, name) => sum + name.votes.length,
                    0
                )}`
            );

            if (poll.names.length > 0) {
                console.log("  Names details:");
                poll.names.forEach((name) => {
                    console.log(
                        `    - ${name.value}: ${name.votes.length} votes`
                    );
                    console.log(
                        `      Suggested by: ${name.creator.name} (${name.creator.studentId})`
                    );
                    if (name.votes.length > 0) {
                        console.log(
                            `      Voters: ${name.votes
                                .map(
                                    (v) =>
                                        `${v.voter.name} (${v.voter.studentId})`
                                )
                                .join(", ")}`
                        );
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPolls();
