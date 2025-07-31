// Quick script to add permission for testing
const { PrismaClient } = require("./src/generated/prisma");

const prisma = new PrismaClient();

async function addPermission() {
    try {
        const permission = await prisma.permission.upsert({
            where: {
                email: "tanvirhossain20@iut-dhaka.edu",
            },
            update: {},
            create: {
                name: "Tanvir Hossain Dihan",
                email: "tanvirhossain20@iut-dhaka.edu",
                studentId: "200041144", // Based on the name in the error
                granted: true,
            },
        });

        console.log("Permission created/updated:", permission);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

addPermission();
