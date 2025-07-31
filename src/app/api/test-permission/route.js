// app/api/test-permission/route.js
import addPermission from "@/action/addPermission";

export async function POST() {
    try {
        const testData = [
            {
                name: "Test API User",
                studentId: "777777777",
                email: "test.api@iut-dhaka.edu",
            },
        ];

        console.log("Testing addPermission with:", testData);
        const result = await addPermission(testData);
        console.log("Result:", result);

        return Response.json({
            message: "Test completed",
            result,
        });
    } catch (error) {
        console.error("Error in test API:", error);
        return Response.json(
            {
                message: "Error testing permission",
                error: error.message,
                stack: error.stack,
            },
            { status: 500 }
        );
    }
}
