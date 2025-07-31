// pages/api/test-permission.js
import addPermission from "@/action/addPermission";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

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

        return res.status(200).json({
            message: "Test completed",
            result,
        });
    } catch (error) {
        console.error("Error in test API:", error);
        return res.status(500).json({
            message: "Error testing permission",
            error: error.message,
            stack: error.stack,
        });
    }
}
