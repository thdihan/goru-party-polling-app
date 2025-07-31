const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log("=== DATABASE CONNECTION TEST ===");

        // Test connection
        await prisma.$connect();
        console.log("✅ Database connected successfully");

        // Check permissions
        const permissions = await prisma.permission.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
                granted: true,
                createdAt: true,
            },
        });

        console.log("\n=== CURRENT PERMISSIONS ===");
        console.log(`Total permissions: ${permissions.length}`);

        if (permissions.length > 0) {
            permissions.forEach((p, index) => {
                console.log(`\n${index + 1}. Name: ${p.name}`);
                console.log(`   Email: ${p.email}`);
                console.log(`   Student ID: ${p.studentId}`);
                console.log(`   Granted: ${p.granted}`);
                console.log(`   Created: ${p.createdAt}`);
            });
        } else {
            console.log("No permissions found in database");
        }

        // Check polls
        const polls = await prisma.poll.findMany({
            select: {
                id: true,
                title: true,
                permissionId: true,
                createdAt: true,
            },
        });

        console.log("\n=== CURRENT POLLS ===");
        console.log(`Total polls: ${polls.length}`);

        if (polls.length > 0) {
            polls.forEach((p, index) => {
                console.log(`\n${index + 1}. Title: ${p.title}`);
                console.log(`   Permission ID: ${p.permissionId}`);
                console.log(`   Created: ${p.createdAt}`);
            });
        } else {
            console.log("No polls found in database");
        }

        // Test adding a new permission to verify the addPermission function works
        console.log("\n=== TESTING PERMISSION CREATION ===");

        const testEmail = "test-permission@iut-dhaka.edu";
        const testStudentId = "123456789";

        // Check if test permission already exists
        const existingTest = await prisma.permission.findFirst({
            where: {
                OR: [{ email: testEmail }, { studentId: testStudentId }],
            },
        });

        if (existingTest) {
            console.log("Test permission already exists, skipping creation");
        } else {
            console.log("Creating test permission...");

            const newPermission = await prisma.permission.create({
                data: {
                    name: "Test User",
                    email: testEmail,
                    studentId: testStudentId,
                    granted: true,
                },
            });

            console.log("✅ Test permission created:", newPermission);

            // Create associated poll
            const newPoll = await prisma.poll.create({
                data: {
                    permissionId: newPermission.id,
                    title: "Test User",
                    description: "Polling for Test User",
                },
            });

            console.log("✅ Test poll created:", newPoll);
        }
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await prisma.$disconnect();
        console.log("\n=== DATABASE DISCONNECTED ===");
    }
}

checkDatabase();
