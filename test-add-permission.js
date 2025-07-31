// Test the addPermission function directly
const addPermission = require("./src/action/addPermission").default;

async function testAddPermission() {
    console.log("=== TESTING ADD PERMISSION FUNCTION ===\n");

    // Test data that should work
    const testData = [
        {
            name: "Alice Cooper",
            studentId: "444444444",
            email: "alice.cooper@iut-dhaka.edu",
        },
        {
            name: "Bob Wilson",
            studentId: "555555555",
            email: "bob.wilson@iut-dhaka.edu",
        },
    ];

    try {
        console.log("Calling addPermission with test data...");
        console.log("Test data:", JSON.stringify(testData, null, 2));

        const result = await addPermission(testData);

        console.log("\n=== RESULT ===");
        console.log("Success:", result.success);
        console.log("Message:", result.message);
        console.log("Added Count:", result.addedCount);
        console.log("Skipped Count:", result.skippedCount);
        console.log("Errors:", result.errors);

        if (result.success) {
            console.log("\n✅ addPermission function is working correctly!");
        } else {
            console.log("\n❌ addPermission function failed");
        }
    } catch (error) {
        console.error("\n❌ Error calling addPermission:", error);
        console.error("Stack trace:", error.stack);
    }
}

testAddPermission();
