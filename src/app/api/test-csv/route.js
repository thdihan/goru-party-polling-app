// app/api/test-csv/route.js
import addPermission from "@/action/addPermission";

export async function POST(request) {
    try {
        // Test the exact same logic as the admin page
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return Response.json(
                {
                    error: "No file uploaded",
                },
                { status: 400 }
            );
        }

        console.log("File received:", file.name, file.type, file.size);

        const csvText = await file.text();
        console.log("CSV content:", csvText);

        // Parse CSV using the same logic as the admin page
        const parseCSV = (csvText) => {
            const lines = csvText.trim().split("\n");
            if (lines.length < 2) {
                throw new Error(
                    "CSV must have at least a header row and one data row"
                );
            }

            // Skip header row and parse data
            const dataLines = lines.slice(1);
            const permissions = [];

            for (let i = 0; i < dataLines.length; i++) {
                const line = dataLines[i].trim();
                if (!line) continue; // Skip empty lines

                // Split by comma and handle quoted values
                const columns = line
                    .split(",")
                    .map((col) => col.trim().replace(/^"|"$/g, ""));

                if (columns.length !== 3) {
                    throw new Error(
                        `Line ${
                            i + 2
                        }: Expected 3 columns (Name, StudentId, Email), got ${
                            columns.length
                        }`
                    );
                }

                const [name, studentId, email] = columns;
                permissions.push({ name, studentId, email });
            }

            return permissions;
        };

        const parsedData = parseCSV(csvText);
        console.log("Parsed data:", parsedData);

        const result = await addPermission(parsedData);
        console.log("AddPermission result:", result);

        return Response.json({
            message: "CSV processing completed",
            parsedData,
            result,
        });
    } catch (error) {
        console.error("Error in CSV test API:", error);
        return Response.json(
            {
                message: "Error processing CSV",
                error: error.message,
                stack: error.stack,
            },
            { status: 500 }
        );
    }
}
