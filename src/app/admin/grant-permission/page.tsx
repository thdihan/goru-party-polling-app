"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import addPermission from "@/action/addPermission";
import {
    FiUpload,
    FiArrowLeft,
    FiCheck,
    FiX,
    FiAlertCircle,
    FiEye,
    FiUser,
} from "react-icons/fi";

interface PermissionData {
    name: string;
    studentId: string;
    email: string;
}

export default function GrantPermissionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [manualEntry, setManualEntry] = useState("");
    const [previewData, setPreviewData] = useState<PermissionData[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        addedCount: number;
        skippedCount: number;
        errors: string[];
    } | null>(null);

    // Check if user is admin
    if (status === "loading") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-800"></div>
                    <p className="mt-4 text-lg font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session || session.user?.role !== "admin") {
        router.push("/");
        return null;
    }

    const parseCSV = (csvText: string): PermissionData[] => {
        const lines = csvText.trim().split("\n");
        if (lines.length < 2) {
            throw new Error(
                "CSV must have at least a header row and one data row"
            );
        }

        // Skip header row and parse data
        const dataLines = lines.slice(1);
        const permissions: PermissionData[] = [];

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

    const handleManualEntryChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setManualEntry(e.target.value);
        if (errors.manualEntry) {
            setErrors((prev) => ({
                ...prev,
                manualEntry: "",
            }));
        }
    };

    const parseManualEntry = () => {
        if (!manualEntry.trim()) {
            setErrors((prev) => ({
                ...prev,
                manualEntry: "Please enter a manual entry to parse",
            }));
            return;
        }

        // Parse the manual entry format: "Name, StudentId, Email"
        const parts = manualEntry.split(",").map((part) => part.trim());

        if (parts.length !== 3) {
            setErrors((prev) => ({
                ...prev,
                manualEntry:
                    "Please use the format: Name, StudentId, Email (separated by commas)",
            }));
            return;
        }

        const [name, studentId, email] = parts;

        // Validate student ID (must be 9 digits)
        if (!/^\d{9}$/.test(studentId)) {
            setErrors((prev) => ({
                ...prev,
                manualEntry: "Student ID must be exactly 9 digits",
            }));
            return;
        }

        // Validate email format
        if (!email.includes("@") || !email.endsWith("@iut-dhaka.edu")) {
            setErrors((prev) => ({
                ...prev,
                manualEntry: "Email must be a valid IUT email (@iut-dhaka.edu)",
            }));
            return;
        }

        // Check if entry already exists in preview data
        const existingEntry = previewData.find(
            (entry) => entry.email === email || entry.studentId === studentId
        );

        if (existingEntry) {
            setErrors((prev) => ({
                ...prev,
                manualEntry:
                    "Entry with this email or student ID already exists in the list",
            }));
            return;
        }

        // Add to preview data
        const newEntry: PermissionData = { name, studentId, email };
        setPreviewData((prev) => [...prev, newEntry]);
        setShowPreview(true);

        // Clear manual entry and any errors
        setManualEntry("");
        setErrors((prev) => ({
            ...prev,
            manualEntry: "",
        }));
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
                alert("Please select a CSV file");
                return;
            }
            setCsvFile(file);
            setResult(null); // Clear previous results
            setShowPreview(false);
            setPreviewData([]);

            // Parse CSV for preview
            try {
                const csvText = await file.text();
                const permissions = parseCSV(csvText);
                setPreviewData(permissions);
                setShowPreview(true);
            } catch (error) {
                alert(
                    error instanceof Error
                        ? error.message
                        : "Error parsing CSV file"
                );
                setCsvFile(null);
            }
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (previewData.length === 0) {
            alert("Please select a CSV file and review the preview");
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await addPermission(previewData);
            setResult(response);

            // Clear file input if successful
            if (response.success && response.addedCount > 0) {
                setCsvFile(null);
                setManualEntry("");
                setPreviewData([]);
                setShowPreview(false);
                setErrors({});
                const fileInput = document.getElementById(
                    "csv-file"
                ) as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            }
        } catch (error) {
            setResult({
                success: false,
                message: "Failed to process permissions",
                addedCount: 0,
                skippedCount: 0,
                errors: [
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
                ],
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen px-4 py-4 bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 rounded-md bg-slate-800 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none cursor-pointer font-semibold"
                >
                    <FiArrowLeft className="text-sm" />
                    Back to Home
                </button>
                <h1 className="text-2xl font-bold text-slate-800">
                    Grant Permissions
                </h1>
                <div></div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto">
                <div className="backdrop-blur-md bg-white/40 border border-white/30 shadow-xl p-8 rounded-xl">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">
                        Upload CSV File to Grant Permissions
                    </h2>

                    {/* Instructions */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-2">
                            CSV Format Requirements:
                        </h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>
                                • First row must be headers:{" "}
                                <code className="bg-blue-100 px-1 rounded">
                                    Name,StudentId,Email
                                </code>
                            </li>
                            <li>• Student ID must be exactly 9 digits</li>
                            <li>
                                • Email must be a valid IUT email
                                (@iut-dhaka.edu)
                            </li>
                            <li>
                                • Example:{" "}
                                <code className="bg-blue-100 px-1 rounded">
                                    John Doe,123456789,john@iut-dhaka.edu
                                </code>
                            </li>
                        </ul>
                    </div>

                    {/* Upload Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Manual Entry Section */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Manual Entry
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={manualEntry}
                                    onChange={handleManualEntryChange}
                                    className={`border ${
                                        errors.manualEntry
                                            ? "border-red-500"
                                            : "border-slate-300"
                                    } flex-1 p-2 rounded-md focus:outline-slate-400 text-sm`}
                                    placeholder="e.g., Tanvir Hossain Dihan, 200041144, tanvirhossain20@iut-dhaka.edu"
                                />
                                <button
                                    type="button"
                                    onClick={parseManualEntry}
                                    className="rounded-lg bg-slate-800 py-3 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none cursor-pointer font-semibold focus:ring-offset-2 "
                                >
                                    Parse
                                </button>
                            </div>
                            {errors.manualEntry && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.manualEntry}
                                </p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                                Format: Name, Student ID (9 digits), Email
                                (separated by commas)
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-2 text-sm text-slate-500">
                                <div className="h-px bg-slate-300 flex-1"></div>
                                <span className="px-2">OR</span>
                                <div className="h-px bg-slate-300 flex-1"></div>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="csv-file"
                                className="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Select CSV File
                            </label>
                            <div className="flex items-center justify-center w-full">
                                <label
                                    htmlFor="csv-file"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-white/20 hover:bg-white/30 transition-colors"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FiUpload className="w-8 h-8 mb-4 text-slate-500" />
                                        <p className="mb-2 text-sm text-slate-500">
                                            <span className="font-semibold">
                                                Click to upload
                                            </span>{" "}
                                            CSV file
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            CSV files only
                                        </p>
                                    </div>
                                    <input
                                        id="csv-file"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {csvFile && (
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-sm text-slate-600">
                                        Selected file:{" "}
                                        <span className="font-medium">
                                            {csvFile.name}
                                        </span>
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCsvFile(null);
                                            setManualEntry("");
                                            setPreviewData([]);
                                            setShowPreview(false);
                                            setResult(null);
                                            setErrors({});
                                            const fileInput =
                                                document.getElementById(
                                                    "csv-file"
                                                ) as HTMLInputElement;
                                            if (fileInput) fileInput.value = "";
                                        }}
                                        className="text-xs text-red-600 hover:text-red-700 underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Preview Section */}
                        {showPreview && previewData.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <FiEye className="text-slate-600" />
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        Preview ({previewData.length} entries)
                                    </h3>
                                </div>

                                <div className="bg-white/60 border border-white/40 rounded-lg p-4 max-h-60 overflow-y-auto">
                                    <div className="space-y-2">
                                        {previewData.map((entry, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 bg-white/40 rounded-lg border border-white/30"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                                                        <FiUser className="text-white text-sm" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                                        <div className="font-medium text-slate-800 truncate">
                                                            {entry.name}
                                                        </div>
                                                        <div className="text-sm text-slate-600">
                                                            ID:{" "}
                                                            {entry.studentId}
                                                        </div>
                                                        <div className="text-sm text-slate-600 truncate">
                                                            {entry.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-700">
                                        <span className="font-medium">
                                            Ready to grant permissions:
                                        </span>{" "}
                                        Review the above entries and click
                                        &quot;Grant Permissions&quot; to
                                        proceed.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                previewData.length === 0 ||
                                !showPreview ||
                                isLoading
                            }
                            className="w-full rounded-md bg-slate-800 py-3 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none cursor-pointer font-semibold"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Processing...
                                </div>
                            ) : showPreview && previewData.length > 0 ? (
                                `Grant Permissions (${previewData.length} entries)`
                            ) : (
                                "Please upload a CSV file first"
                            )}
                        </button>
                    </form>

                    {/* Results */}
                    {result && (
                        <div className="mt-6">
                            <div
                                className={`p-4 rounded-lg border ${
                                    result.success
                                        ? "bg-green-50 border-green-200"
                                        : "bg-red-50 border-red-200"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {result.success ? (
                                        <FiCheck className="text-green-600" />
                                    ) : (
                                        <FiX className="text-red-600" />
                                    )}
                                    <h3
                                        className={`font-semibold ${
                                            result.success
                                                ? "text-green-800"
                                                : "text-red-800"
                                        }`}
                                    >
                                        {result.success ? "Success!" : "Error"}
                                    </h3>
                                </div>

                                <p
                                    className={`text-sm mb-3 ${
                                        result.success
                                            ? "text-green-700"
                                            : "text-red-700"
                                    }`}
                                >
                                    {result.message}
                                </p>

                                {(result.addedCount > 0 ||
                                    result.skippedCount > 0) && (
                                    <div className="text-sm space-y-1">
                                        <p className="text-slate-700">
                                            <span className="font-medium">
                                                Added:
                                            </span>{" "}
                                            {result.addedCount} permissions
                                        </p>
                                        <p className="text-slate-700">
                                            <span className="font-medium">
                                                Skipped:
                                            </span>{" "}
                                            {result.skippedCount} (already
                                            existed)
                                        </p>
                                    </div>
                                )}

                                {result.errors.length > 0 && (
                                    <div className="mt-3">
                                        <div className="flex items-center gap-1 mb-2">
                                            <FiAlertCircle className="text-amber-500 text-sm" />
                                            <span className="text-sm font-medium text-amber-700">
                                                Issues:
                                            </span>
                                        </div>
                                        <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                                            {result.errors.map(
                                                (error, index) => (
                                                    <li
                                                        key={index}
                                                        className="list-disc list-inside"
                                                    >
                                                        {error}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
