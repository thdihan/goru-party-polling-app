"use client";
import Image from "next/image";
import logo from "@/images/logo.png";
import { FiLogOut, FiUsers } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import SmallCard from "@/components/SmallCard";

interface Poll {
    id: number;
    title: string;
    description: string;
    permission: {
        name: string;
        email: string;
        studentId: string;
    };
    names: {
        id: number;
        value: string;
        votes: { id: number }[];
    }[];
    createdAt: string;
}

export default function Home() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchPolls();
        }
    }, [status, router]);

    const fetchPolls = async () => {
        try {
            const response = await fetch("/api/polls");
            if (!response.ok) {
                throw new Error("Failed to fetch polls");
            }
            const data = await response.json();
            setPolls(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut({
            callbackUrl: "/login",
            redirect: true,
        });
    };

    if (status === "loading" || loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-800"></div>
                    <p className="mt-4 text-lg font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen px-4 py-4 bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200">
            {/* Header */}
            <div className="flex justify-end items-center">
                <div className="flex space-x-2 items-center border-2 border-slate-800 p-2 rounded-lg bg-white/30 text-sm">
                    <span className="font-semibold text-slate-800">
                        {session.user?.name || session.user?.email}
                    </span>
                    <FiLogOut
                        className="text-xl text-red-600 cursor-pointer hover:text-red-700 transition-colors"
                        onClick={handleLogout}
                        title="Logout"
                    />
                </div>
            </div>

            {/* Logo */}
            <div className="py-8 flex justify-center">
                <Image
                    src={logo}
                    alt="Goru Party"
                    className="w-full max-w-lg"
                />
            </div>

            {/* Admin Controls */}
            {session.user?.role === "admin" && (
                <div className="py-4 mb-8 flex justify-center gap-4">
                    <button
                        onClick={() => router.push("/admin/grant-permission")}
                        className="rounded-md bg-slate-800 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none cursor-pointer font-semibold"
                    >
                        Grant Permission
                    </button>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    Error: {error}
                    <button
                        onClick={fetchPolls}
                        className="ml-4 text-sm underline hover:no-underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Polls Grid */}
            <div className="max-w-6xl mx-auto">
                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
                    Available Polls
                </h2>

                {polls.length === 0 ? (
                    <div className="text-center py-12">
                        <FiUsers className="mx-auto text-6xl text-slate-400 mb-4" />
                        <p className="text-lg text-slate-600">
                            No polls available yet.
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            {session.user?.role === "admin"
                                ? "Create permissions to generate polls."
                                : "Check back later for new polls."}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-evenly gap-x-4 gap-y-8">
                        {polls
                            .filter((poll) => {
                                // Filter out user's own poll
                                return !(
                                    poll.permission.email ===
                                        session.user?.email ||
                                    poll.permission.studentId ===
                                        session.user?.studentId
                                );
                            })
                            .sort(
                                (a, b) =>
                                    Number(a.permission.studentId) -
                                    Number(b.permission.studentId)
                            )
                            .map((poll) => {
                                // const totalVotes = poll.names.reduce(
                                //     (sum, name) => sum + name.votes.length,
                                //     0
                                // );
                                const topName =
                                    poll.names.length > 0
                                        ? poll.names.reduce((prev, current) =>
                                              prev.votes.length >
                                              current.votes.length
                                                  ? prev
                                                  : current
                                          )
                                        : null;

                                return (
                                    <SmallCard
                                        key={poll.id}
                                        pollId={poll.id}
                                        studentName={poll.permission.name}
                                        studentId={poll.permission.studentId}
                                        topVotedName={topName?.value || null}
                                        totalVotes={topName?.votes?.length || 0}
                                        isAdmin={session.user.role === "admin"}
                                    />
                                );
                            })}
                    </div>
                )}
            </div>
        </div>
    );
}
