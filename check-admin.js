const { PrismaClient } = require("./src/generated/prisma");

const prisma = new PrismaClient();

async function checkAdminUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: "admin",
            },
        });

        console.log("Admin users found:", users.length);
        users.forEach((user) => {
            console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
        });

        if (users.length === 0) {
            console.log(
                "\nNo admin users found. Let me check if user exists and update role..."
            );

            // Check if the user exists
            const existingUser = await prisma.user.findUnique({
                where: {
                    email: "tanvirhossain20@iut-dhaka.edu",
                },
            });

            if (existingUser) {
                // Update existing user to admin
                const adminUser = await prisma.user.update({
                    where: {
                        email: "tanvirhossain20@iut-dhaka.edu",
                    },
                    data: {
                        role: "admin",
                    },
                });

                console.log(
                    "Updated existing user to admin:",
                    adminUser.name,
                    adminUser.email
                );
            } else {
                // Create an admin user
                const adminUser = await prisma.user.create({
                    data: {
                        name: "Admin User",
                        email: "tanvirhossain20@iut-dhaka.edu",
                        studentId: "200041144",
                        password:
                            "$2a$10$rQ8kPQ3pZ6xHfkO4dX7x6uGwJGv9F8xR8FyRj5YqO4XcxGjIzMdGy", // hashed "admin123"
                        role: "admin",
                    },
                });

                console.log(
                    "Created admin user:",
                    adminUser.name,
                    adminUser.email
                );
            }
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminUsers();
