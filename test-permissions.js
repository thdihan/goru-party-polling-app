// Test script to verify permission creation
const { PrismaClient } = require("./src/generated/prisma");

const prisma = new PrismaClient();

async function testPermissionCreation() {
    try {
        console.log("Testing permission creation...");

        // Test data
        const testPermission = {
            name: "Test User",
            email: "test@iut-dhaka.edu",
            studentId: "123456789",
            granted: true,
        };

        // Try to create a permission
        const permission = await prisma.permission.create({
            data: testPermission,
        });

        console.log("✅ Permission created successfully:", permission);

        // Clean up - delete the test permission
        await prisma.permission.delete({
            where: { id: permission.id },
        });

        console.log("✅ Test permission cleaned up");

        // Check existing permissions
        const allPermissions = await prisma.permission.findMany();
        console.log(
            "📊 Current permissions in database:",
            allPermissions.length
        );
        allPermissions.forEach((p) =>
            console.log(`  - ${p.name} (${p.email})`)
        );
    } catch (error) {
        console.error("❌ Error testing permission creation:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testPermissionCreation();
