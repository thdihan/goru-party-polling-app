const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        console.log("=== DATABASE USERS ===");

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
                role: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        console.log(`Total users: ${users.length}`);

        if (users.length > 0) {
            users.forEach((u, index) => {
                console.log(`\n${index + 1}. Name: ${u.name}`);
                console.log(`   Email: ${u.email}`);
                console.log(`   Student ID: ${u.studentId}`);
                console.log(`   Role: ${u.role}`);
                console.log(`   Email Verified: ${u.emailVerified}`);
                console.log(`   Created: ${u.createdAt}`);
            });
        } else {
            console.log("No users found in database");
        }
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await prisma.$disconnect();
        console.log("\n=== DATABASE DISCONNECTED ===");
    }
}

checkUsers();
