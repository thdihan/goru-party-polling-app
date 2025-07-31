"use client";
import Image from "next/image";
import React, { useState } from "react";
import logo from "@/images/logo.png";
import Link from "next/link";
import { FiCheck, FiAlertCircle } from "react-icons/fi";
import registerUser from "@/action/registerUser";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        studentId: "",
        password: "",
        confirmPassword: "",
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
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!formData.email.endsWith("@iut-dhaka.edu")) {
            newErrors.email = "Please use your IUT email address";
        }

        if (!formData.studentId.trim()) {
            newErrors.studentId = "Student ID is required";
        } else if (!/^\d{9}$/.test(formData.studentId.trim())) {
            newErrors.studentId = "Student ID must be exactly 9 digits";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
        setErrors({});

        try {
            // Call the registerUser server action
            const result = await registerUser({
                name: formData.name,
                email: formData.email,
                studentId: formData.studentId,
                password: formData.password,
            });

            if (result.success) {
                setSuccessMessage(result.message);
                setServerErrors([]);

                // Reset form on success
                setFormData({
                    name: "",
                    email: "",
                    studentId: "",
                    password: "",
                    confirmPassword: "",
                });

                // If verification is required, redirect to verification page after a short delay
                if (result.requiresVerification) {
                    setTimeout(() => {
                        window.location.href = "/verify-email";
                    }, 3000);
                }
            } else {
                setSuccessMessage("");
                setServerErrors(result.errors);
                setErrors({
                    submit: result.message,
                });
            }
        } catch (error) {
            console.error("Registration error:", error);
            setErrors({
                submit: "Registration failed. Please try again.",
            });
            setServerErrors([
                "An unexpected error occurred. Please try again later.",
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 p-4">
            <div className="backdrop-blur-md bg-white/40 border border-gray-300 w-full md:max-w-[35%] p-8 shadow-lg rounded-lg">
                <div className="flex justify-center mb-6">
                    <Image src={logo} alt="Goru Party" className="w-[40%]" />
                </div>
                <h2 className="text-center font-semibold mb-6 text-xl">
                    Register with IUT Email
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`border ${
                                errors.name
                                    ? "border-red-500"
                                    : "border-gray-300"
                            } w-full p-2 rounded-md focus:outline-gray-400 text-sm`}
                            placeholder="Full Name"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`border ${
                                errors.email
                                    ? "border-red-500"
                                    : "border-gray-300"
                            } w-full p-2 rounded-md focus:outline-gray-400 text-sm`}
                            placeholder="your-email@iut-dhaka.edu"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <input
                            type="text"
                            name="studentId"
                            value={formData.studentId}
                            onChange={handleInputChange}
                            className={`border ${
                                errors.studentId
                                    ? "border-red-500"
                                    : "border-gray-300"
                            } w-full p-2 rounded-md focus:outline-gray-400 text-sm`}
                            placeholder="Student ID (9 digits)"
                            maxLength={9}
                        />
                        {errors.studentId && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.studentId}
                            </p>
                        )}
                    </div>

                    <div>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`border ${
                                errors.password
                                    ? "border-red-500"
                                    : "border-gray-300"
                            } w-full p-2 rounded-md focus:outline-gray-400 text-sm`}
                            placeholder="Password"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`border ${
                                errors.confirmPassword
                                    ? "border-red-500"
                                    : "border-gray-300"
                            } w-full p-2 rounded-md focus:outline-gray-400 text-sm`}
                            placeholder="Confirm Password"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.confirmPassword}
                            </p>
                        )}
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
                            "Register"
                        )}
                    </button>
                </form>

                {/* Success Message */}
                {successMessage && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center space-x-2">
                            <FiCheck className="text-green-600" />
                            <h4 className="text-sm font-medium text-green-800">
                                Registration Successful!
                            </h4>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                            {successMessage}
                        </p>
                        <div className="mt-3 space-y-2">
                            <Link
                                href="/verify-email"
                                className="inline-flex items-center text-sm text-green-700 hover:text-green-800 underline font-medium"
                            >
                                Verify Email Now →
                            </Link>
                            <br />
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 underline"
                            >
                                Go to Login Page
                            </Link>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {errors.submit && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-2">
                            <FiAlertCircle className="text-red-600" />
                            <h4 className="text-sm font-medium text-red-800">
                                Registration Failed
                            </h4>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                            {errors.submit}
                        </p>

                        {/* Server Error Details */}
                        {serverErrors.length > 0 && (
                            <div className="mt-3">
                                <h5 className="text-xs font-medium text-red-700 mb-1">
                                    Details:
                                </h5>
                                <ul className="text-xs text-red-600 space-y-1">
                                    {serverErrors.map((error, index) => (
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
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-party-orange hover:underline font-semibold"
                        >
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
