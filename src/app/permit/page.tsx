"use client";
import Image from "next/image";
import React, { useState, useRef } from "react";
import logo from "@/images/logo.png";
import {
    FiUpload,
    FiX,
    FiFileText,
    FiCheck,
    FiAlertCircle,
} from "react-icons/fi";
import addPermissionByEmail from "@/action/addPermissionByEmail";

const Permit = () => {
    const [emails, setEmails] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [uploadedFileName, setUploadedFileName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [resultDetails, setResultDetails] = useState<{
        addedCount: number;
        skippedCount: number;
        errors: string[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEmailChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEmails(e.target.value);
        if (errors.emails) {
            setErrors((prev) => ({
                ...prev,
                emails: "",
            }));
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            setErrors({
                ...errors,
                file: "Please upload a valid CSV file",
            });
            return;
        }

        setUploadedFileName(file.name);
        setErrors((prev) => ({
            ...prev,
            file: "",
        }));

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvContent = event.target?.result as string;
            const emailList = parseCsvEmails(csvContent);
            setEmails(emailList.join(", "));
        };
        reader.readAsText(file);
    };

    const parseCsvEmails = (csvContent: string): string[] => {
        const lines = csvContent.split("\n");
        const emails: string[] = [];

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                // Handle different CSV formats - could be single column or comma-separated
                const rowEmails = trimmedLine
                    .split(",")
                    .map((email) => email.trim().replace(/['"]/g, ""));
                rowEmails.forEach((email) => {
                    if (email && email.includes("@")) {
                        emails.push(email);
                    }
                });
            }
        });

        return emails;
    };

    const validateEmails = () => {
        const newErrors: { [key: string]: string } = {};

        if (!emails.trim()) {
            newErrors.emails =
                "Please enter at least one email or upload a CSV file";
            setErrors(newErrors);
            return false;
        }

        const emailList = emails
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email);
        const invalidEmails: string[] = [];

        emailList.forEach((email) => {
            if (!email.endsWith("@iut-dhaka.edu")) {
                invalidEmails.push(email);
            }
        });

        if (invalidEmails.length > 0) {
            newErrors.emails = `Invalid IUT emails: ${invalidEmails
                .slice(0, 3)
                .join(", ")}${invalidEmails.length > 3 ? "..." : ""}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmails()) {
            return;
        }

        setIsLoading(true);
        setSuccessMessage("");
        setResultDetails(null);
        setErrors({});

        try {
            const emailList = emails
                .split(",")
                .map((email) => email.trim())
                .filter((email) => email);

            // Call the addPermissionByEmail server action
            const result = await addPermissionByEmail(emailList);

            if (result.success) {
                setSuccessMessage(result.message);
                setResultDetails({
                    addedCount: result.addedCount,
                    skippedCount: result.skippedCount,
                    errors: result.errors,
                });

                // Reset form on success
                setEmails("");
                setUploadedFileName("");
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            } else {
                setErrors({
                    submit: result.message,
                });
                setResultDetails({
                    addedCount: result.addedCount,
                    skippedCount: result.skippedCount,
                    errors: result.errors,
                });
            }
        } catch (error) {
            console.error("Permit error:", error);
            setErrors({
                submit: "Failed to grant permits. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFile = () => {
        setUploadedFileName("");
        setEmails("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 p-4">
            <div className="backdrop-blur-md bg-white/40 border border-gray-300 w-full md:max-w-[40%] p-8 shadow-lg rounded-lg">
                <div className="flex justify-center mb-6">
                    <Image src={logo} alt="Goru Party" className="w-[40%]" />
                </div>
                <h2 className="text-center font-semibold mb-6 text-xl">
                    Grant Email Permits
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Addresses
                        </label>
                        <div className="relative">
                            <textarea
                                value={emails}
                                onChange={handleEmailChange}
                                rows={4}
                                className={`border ${
                                    errors.emails
                                        ? "border-red-500"
                                        : "border-gray-300"
                                } w-full p-2 rounded-md focus:outline-gray-400 text-sm resize-none`}
                                placeholder="Enter IUT email addresses separated by commas&#10;e.g., user1@iut-dhaka.edu, user2@iut-dhaka.edu"
                            />
                        </div>
                        {errors.emails && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.emails}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <div className="h-px bg-gray-300 flex-1"></div>
                            <span className="px-2">OR</span>
                            <div className="h-px bg-gray-300 flex-1"></div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload CSV File
                        </label>
                        <div className="space-y-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            {!uploadedFileName ? (
                                <button
                                    type="button"
                                    onClick={triggerFileInput}
                                    className="w-full border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors"
                                >
                                    <div className="flex flex-col items-center space-y-2">
                                        <FiUpload className="text-2xl text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            Click to upload CSV file
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            CSV should contain email addresses
                                        </span>
                                    </div>
                                </button>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-300 rounded-md">
                                    <div className="flex items-center space-x-2">
                                        <FiFileText className="text-party-orange" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {uploadedFileName}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <FiX className="text-lg" />
                                    </button>
                                </div>
                            )}
                        </div>
                        {errors.file && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.file}
                            </p>
                        )}
                    </div>

                    {emails && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <h4 className="text-sm font-medium text-blue-800 mb-1">
                                Email Preview (
                                {
                                    emails.split(",").filter((e) => e.trim())
                                        .length
                                }{" "}
                                emails)
                            </h4>
                            <p className="text-xs text-blue-600 break-words">
                                {emails
                                    .split(",")
                                    .slice(0, 5)
                                    .map((email) => email.trim())
                                    .join(", ")}
                                {emails.split(",").length > 5 && "..."}
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-md bg-slate-800 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none cursor-pointer mt-2 w-full font-semibold"
                    >
                        {isLoading ? (
                            <div className="flex justify-center">
                                <svg
                                    className="text-gray-300 animate-spin"
                                    viewBox="0 0 64 64"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                >
                                    <path
                                        d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                                        stroke="currentColor"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    ></path>
                                    <path
                                        d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                                        stroke="currentColor"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-gray-900"
                                    ></path>
                                </svg>
                            </div>
                        ) : (
                            "Grant Permits"
                        )}
                    </button>
                </form>

                {/* Success Message */}
                {successMessage && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center space-x-2">
                            <FiCheck className="text-green-600" />
                            <h4 className="text-sm font-medium text-green-800">
                                Success!
                            </h4>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                            {successMessage}
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {errors.submit && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-2">
                            <FiAlertCircle className="text-red-600" />
                            <h4 className="text-sm font-medium text-red-800">
                                Error
                            </h4>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                            {errors.submit}
                        </p>
                    </div>
                )}

                {/* Detailed Results */}
                {resultDetails &&
                    (resultDetails.errors.length > 0 ||
                        resultDetails.addedCount > 0 ||
                        resultDetails.skippedCount > 0) && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                            <h4 className="text-sm font-medium text-gray-800 mb-2">
                                Processing Details
                            </h4>

                            {(resultDetails.addedCount > 0 ||
                                resultDetails.skippedCount > 0) && (
                                <div className="space-y-1 text-sm">
                                    {resultDetails.addedCount > 0 && (
                                        <p className="text-green-700">
                                            ✓ Added permissions for{" "}
                                            {resultDetails.addedCount} email(s)
                                        </p>
                                    )}
                                    {resultDetails.skippedCount > 0 && (
                                        <p className="text-yellow-700">
                                            ⚠ Skipped{" "}
                                            {resultDetails.skippedCount}{" "}
                                            email(s) (already have permissions)
                                        </p>
                                    )}
                                </div>
                            )}

                            {resultDetails.errors.length > 0 && (
                                <div className="mt-3">
                                    <h5 className="text-xs font-medium text-gray-700 mb-1">
                                        Issues:
                                    </h5>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        {resultDetails.errors
                                            .slice(0, 5)
                                            .map((error, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-start space-x-1"
                                                >
                                                    <span className="text-red-500 mt-0.5">
                                                        •
                                                    </span>
                                                    <span>{error}</span>
                                                </li>
                                            ))}
                                        {resultDetails.errors.length > 5 && (
                                            <li className="text-gray-500 italic">
                                                ... and{" "}
                                                {resultDetails.errors.length -
                                                    5}{" "}
                                                more issues
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
            </div>
        </div>
    );
};

export default Permit;
