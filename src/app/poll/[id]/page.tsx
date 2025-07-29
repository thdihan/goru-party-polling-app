"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import castVote from "@/action/castVote";
import cancelVote from "@/action/cancelVote";
import deleteName from "@/action/deleteName";
import addNameToPoll from "@/action/addNameToPoll";
import Card from "@/components/Card";

interface Vote {
    id: number;
    voter: {
        id: string;
        name: string;
        studentId: string;
    };
}

interface Name {
    id: number;
    value: string;
    votes: Vote[];
    creator: {
        id: string;
        name: string;
        studentId: string;
    };
}

interface Poll {
    id: number;
    title: string;
    description: string;
    names: Name[];
    permission: {
        name: string;
        email: string;
        studentId: string;
    };
}

interface Props {
    params: Promise<{ id: string }>;
}

export default function PollPage({ params }: Props) {
    const { data: session } = useSession();
    const router = useRouter();
    const [poll, setPoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [addingName, setAddingName] = useState(false);
    const [voting, setVoting] = useState<number | null>(null);
    const [cancellingVote, setCancellingVote] = useState<number | null>(null);
    const [deletingName, setDeletingName] = useState<number | null>(null);
    const [userVotes, setUserVotes] = useState<{ [nameId: number]: boolean }>(
        {}
    );
    const [pollId, setPollId] = useState<string | null>(null);

    useEffect(() => {
        const initializeParams = async () => {
            const resolvedParams = await params;
            setPollId(resolvedParams.id);
        };
        initializeParams();
    }, [params]);

    const fetchPoll = useCallback(async () => {
        if (!pollId) return;

        try {
            const response = await fetch(`/api/poll/${pollId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch poll");
            }
            const data = await response.json();
            setPoll(data);

            // Calculate user votes
            if (session?.user?.id) {
                const votes: { [nameId: number]: boolean } = {};
                data.names.forEach((name: Name) => {
                    votes[name.id] = name.votes.some(
                        (vote) => vote.voter.id === session.user.id
                    );
                });
                setUserVotes(votes);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [pollId, session?.user?.id]);

    useEffect(() => {
        if (!session) {
            router.push("/login");
            return;
        }
        if (pollId) {
            fetchPoll();
        }
    }, [session, pollId, router, fetchPoll]);

    const handleAddName = async (name: string) => {
        if (!poll) return;

        setAddingName(true);
        try {
            const result = await addNameToPoll({
                pollId: poll.id,
                name: name,
            });

            if (result.success) {
                setNewName("");
                await fetchPoll(); // Refresh poll data
            } else {
                setError(result.message);
            }
        } catch {
            setError("Failed to add name");
        } finally {
            setAddingName(false);
        }
    };

    const handleVote = async (nameId: number) => {
        setVoting(nameId);
        try {
            const result = await castVote({ nameId });

            if (result.success) {
                await fetchPoll(); // Refresh poll data
            } else {
                setError(result.message);
            }
        } catch {
            setError("Failed to cast vote");
        } finally {
            setVoting(null);
        }
    };

    const handleCancelVote = async (nameId: number) => {
        setCancellingVote(nameId);
        try {
            const result = await cancelVote({ nameId });

            if (result.success) {
                await fetchPoll(); // Refresh poll data
            } else {
                setError(result.message);
            }
        } catch {
            setError("Failed to cancel vote");
        } finally {
            setCancellingVote(null);
        }
    };

    const handleDeleteName = async (nameId: number) => {
        setDeletingName(nameId);
        try {
            const result = await deleteName({ nameId });

            if (result.success) {
                await fetchPoll(); // Refresh poll data
            } else {
                setError(result.message);
            }
        } catch {
            setError("Failed to delete name");
        } finally {
            setDeletingName(null);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-800"></div>
                    <p className="mt-4 text-lg font-semibold">
                        Loading poll...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 flex items-center justify-center p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
                    <h2 className="font-bold text-lg mb-2">Error</h2>
                    <p className="mb-4">{error}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!poll) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">
                        Poll not found
                    </h2>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200 p-4">
            <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)]">
                <div className="backdrop-blur-md bg-white/40 border border-white/30 rounded-2xl h-full">
                    <Card
                        poll={poll}
                        onAddName={handleAddName}
                        onVote={handleVote}
                        onCancelVote={handleCancelVote}
                        onDeleteName={
                            session?.user?.role === "admin"
                                ? handleDeleteName
                                : undefined
                        }
                        userVotes={userVotes}
                        loading={{
                            addingName,
                            voting,
                            cancellingVote,
                            deletingName,
                        }}
                        newName={newName}
                        setNewName={setNewName}
                        onClose={() => router.push("/")}
                        isAdmin={session?.user?.role === "admin"}
                        currentUserId={session?.user?.id}
                    />
                </div>
            </div>
        </div>
    );
}
