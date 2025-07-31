"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import logo from "@/images/logo.png";
import Link from "next/link";
import { FiCheck, FiAlertCircle } from "react-icons/fi";
import { useSession, signIn } from "next-auth/react";
import completeRegistration from "@/action/completeRegistration";

// Extend the session type to include needsRegistration
interface ExtendedUser {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    needsRegistration?: boolean;
}

interface ExtendedSession {
    user?: ExtendedUser;
}

const Register = () => {
    const { data: session, status } = useSession() as {
        data: ExtendedSession | null;
        status: string;
    };
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

    // Pre-fill email when user is authenticated with Google
    useEffect(() => {
        if (session?.user?.email && session?.user?.needsRegistration) {
            setFormData((prev) => ({
                ...prev,
                email: session.user!.email!,
            }));
        }
    }, [session]);

    // Redirect if user is already registered
    useEffect(() => {
        if (session?.user && !session?.user?.needsRegistration) {
            window.location.href = "/";
        }
    }, [session]);

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

        // Check if user is authenticated with Google
        if (!session?.user?.email) {
            setErrors({ submit: "Please sign in with Google first" });
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setSuccessMessage("");
        setServerErrors([]);
        setErrors({});

        try {
            // Call the completeRegistration server action
            const result = await completeRegistration({
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
                    email: session.user.email,
                    studentId: "",
                    password: "",
                    confirmPassword: "",
                });

                // Redirect to home page after successful registration
                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
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

    // Loading state
    if (status === "loading") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 p-4">
                <div className="backdrop-blur-md bg-white/40 border border-gray-300 w-full md:max-w-[35%] p-8 shadow-lg rounded-lg">
                    <div className="flex justify-center mb-6">
                        <Image
                            src={logo}
                            alt="Goru Party"
                            className="w-[40%]"
                        />
                    </div>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    // If user is not authenticated with Google, show Google sign-in
    if (!session?.user?.email || !session.user?.needsRegistration) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 p-4">
                <div className="backdrop-blur-md bg-white/40 border border-gray-300 w-full md:max-w-[35%] p-8 shadow-lg rounded-lg">
                    <div className="flex justify-center mb-6">
                        <Image
                            src={logo}
                            alt="Goru Party"
                            className="w-[40%]"
                        />
                    </div>
                    <h2 className="text-center font-semibold mb-6 text-xl">
                        Register with IUT Email
                    </h2>

                    <div className="text-center space-y-4">
                        <p className="text-gray-700 mb-6">
                            To register, you must first authenticate with your
                            IUT Google account.
                        </p>

                        <button
                            onClick={() => signIn("google")}
                            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Sign in with Google
                        </button>

                        <p className="text-xs text-gray-500 mt-4">
                            Only IUT (@iut-dhaka.edu) email addresses are
                            allowed
                        </p>
                    </div>

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
    }

    // User is authenticated with Google and needs to complete registration
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 p-4">
            <div className="backdrop-blur-md bg-white/40 border border-gray-300 w-full md:max-w-[35%] p-8 shadow-lg rounded-lg">
                <div className="flex justify-center mb-6">
                    <Image src={logo} alt="Goru Party" className="w-[40%]" />
                </div>
                <h2 className="text-center font-semibold mb-4 text-xl">
                    Complete Your Registration
                </h2>
                <p className="text-center text-sm text-gray-600 mb-6">
                    Authenticated as:{" "}
                    <span className="font-medium">{session.user.email}</span>
                </p>

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
                            disabled
                            className="border border-gray-300 w-full p-2 rounded-md bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                            placeholder="Email (verified with Google)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Email is verified through Google authentication
                        </p>
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
                            "Complete Registration"
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
                        <p className="text-sm text-green-600 mt-2">
                            Redirecting to home page...
                        </p>
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
