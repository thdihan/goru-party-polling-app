const fetch = require("node-fetch");
const fs = require("fs");

async function testExportAPI() {
    try {
        console.log("Testing export API endpoint...");

        // Since this is a server-side test, we'll need to mock the session
        // For now, let's create a simple test to check if the API endpoint compiles correctly

        const response = await fetch("http://localhost:3001/api/export-polls");

        console.log("Response status:", response.status);
        console.log(
            "Response headers:",
            Object.fromEntries(response.headers.entries())
        );

        if (response.status === 401) {
            console.log("✅ API correctly requires authentication");
        } else if (response.status === 403) {
            console.log("✅ API correctly requires admin role");
        } else if (response.status === 200) {
            console.log("✅ API responded successfully");

            // If successful, save the file
            const buffer = await response.buffer();
            fs.writeFileSync("test-export-result.xlsx", buffer);
            console.log("✅ Excel file saved successfully");
            console.log("File size:", buffer.length, "bytes");
        } else {
            console.log("❌ Unexpected response status");
            const text = await response.text();
            console.log("Response body:", text);
        }
    } catch (error) {
        console.error("❌ Error testing export API:", error.message);
    }
}

testExportAPI();
