const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function addTestPermission() {
    try {
        console.log("=== ADDING TEST PERMISSION FOR NEW USER ===");

        const testEmail = "newuser@iut-dhaka.edu";
        const testStudentId = "888888888";

        // Check if permission already exists
        const existing = await prisma.permission.findFirst({
            where: {
                OR: [{ email: testEmail }, { studentId: testStudentId }],
            },
        });

        if (existing) {
            console.log("Permission already exists:", existing);
            return;
        }

        // Create new permission
        const newPermission = await prisma.permission.create({
            data: {
                name: "New Test User",
                email: testEmail,
                studentId: testStudentId,
                granted: true,
            },
        });

        console.log("✅ New test permission created:", newPermission);

        // Create associated poll
        const newPoll = await prisma.poll.create({
            data: {
                permissionId: newPermission.id,
                title: "New Test User",
                description: "Polling for New Test User",
            },
        });

        console.log("✅ Associated poll created:", newPoll);
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await prisma.$disconnect();
        console.log("\n=== DATABASE DISCONNECTED ===");
    }
}

addTestPermission();
