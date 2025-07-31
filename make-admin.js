const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function makeUserAdmin() {
    try {
        console.log("=== UPDATING USER TO ADMIN ===");

        const updatedUser = await prisma.user.update({
            where: {
                email: "tanvirhossain20@iut-dhaka.edu",
            },
            data: {
                role: "admin",
            },
        });

        console.log("✅ User updated to admin:", updatedUser);
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await prisma.$disconnect();
        console.log("\n=== DATABASE DISCONNECTED ===");
    }
}

makeUserAdmin();
