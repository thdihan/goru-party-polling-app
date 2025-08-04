const { PrismaClient } = require("./src/generated/prisma");

const prisma = new PrismaClient();

async function createTestData() {
    try {
        console.log("Creating test poll data...");

        // Find the admin user
        const adminUser = await prisma.user.findFirst({
            where: { role: "admin" },
        });

        if (!adminUser) {
            console.error("No admin user found!");
            return;
        }

        // Find a permission holder
        const permission = await prisma.permission.findFirst();

        if (!permission) {
            console.error("No permission found!");
            return;
        }

        // Find the poll associated with this permission
        let poll = await prisma.poll.findFirst({
            where: { permissionId: permission.id },
        });

        if (!poll) {
            console.log("Creating test poll...");
            poll = await prisma.poll.create({
                data: {
                    title: "Test Poll for Export",
                    permissionId: permission.id,
                },
            });
        }

        console.log(`Using poll: ${poll.title} (ID: ${poll.id})`);

        // Create some test names
        const testNames = [
            "Beautiful Sunset",
            "Ocean Breeze",
            "Mountain Peak",
            "City Lights",
            "Forest Path",
        ];

        for (const nameValue of testNames) {
            // Check if name already exists
            const existingName = await prisma.name.findFirst({
                where: {
                    value: nameValue,
                    pollId: poll.id,
                },
            });

            if (!existingName) {
                const name = await prisma.name.create({
                    data: {
                        value: nameValue,
                        pollId: poll.id,
                        createdBy: adminUser.id,
                    },
                });

                // Create one vote for this name from the admin user
                const existingVote = await prisma.vote.findUnique({
                    where: {
                        voterId_nameId: {
                            voterId: adminUser.id,
                            nameId: name.id,
                        },
                    },
                });

                if (!existingVote) {
                    await prisma.vote.create({
                        data: {
                            nameId: name.id,
                            voterId: adminUser.id,
                        },
                    });
                    console.log(`Created name "${nameValue}" with 1 vote`);
                } else {
                    console.log(
                        `Name "${nameValue}" already has vote from admin`
                    );
                }
            } else {
                console.log(`Name "${nameValue}" already exists`);
            }
        }

        console.log("Test data creation completed!");
    } catch (error) {
        console.error("Error creating test data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestData();
