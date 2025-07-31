"use client";
import Image from "next/image";
import React, { useState } from "react";
import logo from "@/images/logo.png";
import Link from "next/link";
import { FiCheck, FiAlertCircle, FiMail } from "react-icons/fi";
import verifyEmail from "@/action/verifyEmail";

const VerifyEmail = () => {
    const [formData, setFormData] = useState({
        email: "",
        verificationCode: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [successMessage, setSuccessMessage] = useState("");
    const [serverErrors, setServerErrors] = useState<string[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
        // Clear server errors when user starts typing
        if (serverErrors.length > 0) {
            setServerErrors([]);
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!formData.email.endsWith("@iut-dhaka.edu")) {
            newErrors.email = "Please use your IUT email address";
        }

        if (!formData.verificationCode.trim()) {
            newErrors.verificationCode = "Verification code is required";
        } else if (formData.verificationCode.trim().length !== 8) {
            newErrors.verificationCode =
                "Verification code must be 8 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setSuccessMessage("");
        setServerErrors([]);

        try {
            const result = await verifyEmail(
                formData.email,
                formData.verificationCode
            );

            if (result.success) {
                setSuccessMessage(result.message);
                // Clear form
                setFormData({
                    email: "",
                    verificationCode: "",
                });
            } else {
                setServerErrors(result.errors);
            }
        } catch (error) {
            console.error("Verification error:", error);
            setServerErrors([
                "An unexpected error occurred. Please try again.",
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 p-4">
            <div className="backdrop-blur-md bg-white/40 border border-gray-300 w-full md:max-w-md p-8 shadow-lg rounded-lg">
                <div className="flex justify-center mb-6">
                    <Image src={logo} alt="Goru Party" className="w-[60%]" />
                </div>
                <h2 className="text-center font-semibold mb-6 text-xl">
                    Verify Your Email
                </h2>

                {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center">
                            <FiCheck className="text-green-600 mr-2" />
                            <p className="text-green-700 text-sm">
                                {successMessage}
                            </p>
                        </div>
                        <div className="mt-4">
                            <Link
                                href="/login"
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                            >
                                Continue to Login
                            </Link>
                        </div>
                    </div>
                )}

                {serverErrors.length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start">
                            <FiAlertCircle className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                                {serverErrors.map((error, index) => (
                                    <p
                                        key={index}
                                        className="text-red-700 text-sm"
                                    >
                                        {error}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start">
                        <FiMail className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-blue-700 text-sm">
                                Please check your email for an 8-character
                                verification code and enter it below to complete
                                your registration.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`border ${
                                errors.email
                                    ? "border-red-500"
                                    : "border-gray-300"
                            } w-full p-2 rounded-md focus:outline-gray-400`}
                            placeholder="your.email@iut-dhaka.edu"
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Verification Code
                        </label>
                        <input
                            type="text"
                            name="verificationCode"
                            value={formData.verificationCode}
                            onChange={handleInputChange}
                            className={`border ${
                                errors.verificationCode
                                    ? "border-red-500"
                                    : "border-gray-300"
                            } w-full p-2 rounded-md focus:outline-gray-400 text-center text-lg tracking-wider uppercase`}
                            placeholder="12345678"
                            maxLength={8}
                            disabled={isLoading}
                            style={{ letterSpacing: "0.2em" }}
                        />
                        {errors.verificationCode && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.verificationCode}
                            </p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            Enter the 8-character code exactly as shown in your
                            email
                        </p>
                    </div>

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
                            "Verify Email"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don&apos;t have a verification code?{" "}
                        <Link
                            href="/register"
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            Register again
                        </Link>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        Already verified?{" "}
                        <Link
                            href="/login"
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
