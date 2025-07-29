import React from "react";
import SingleName from "./SingleName";
// import { useRouter } from "next/navigation";

interface Name {
    id: number;
    value: string;
    votes: {
        id: number;
        voter: { id: string; name: string; studentId: string };
    }[];
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
    };
}

type Props = {
    poll: Poll;
    onAddName: (name: string) => Promise<void>;
    onVote: (nameId: number) => Promise<void>;
    onCancelVote: (nameId: number) => Promise<void>;
    onDeleteName?: (nameId: number) => Promise<void>;
    userVotes: { [nameId: number]: boolean };
    loading: {
        addingName: boolean;
        voting: number | null;
        cancellingVote: number | null;
        deletingName: number | null;
    };
    newName: string;
    setNewName: (name: string) => void;
    onClose: () => void;
    isAdmin?: boolean;
    currentUserId?: string;
};

const Card = ({
    poll,
    onAddName,
    onVote,
    onCancelVote,
    onDeleteName,
    userVotes,
    loading,
    newName,
    setNewName,
    onClose,
    isAdmin = false,
    currentUserId,
}: Props) => {
    // const router = useRouter();

    const handleAddName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        await onAddName(newName.trim());
    };

    return (
        <div className="p-4 border border-white shadow-xl rounded-lg h-full flex flex-col justify-between">
            <div className="text-black mb-4 flex justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-left">
                        {poll.permission.name}
                    </h2>
                    <div className="flex space-x-4">
                        <p>{poll.permission.email}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-2 mb-4 overflow-y-auto h-[calc(100vh-250px)]">
                {poll.names.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        No names have been added to this poll yet. Be the first
                        to add one!
                    </div>
                ) : (
                    poll.names.map((name) => (
                        <SingleName
                            key={name.id}
                            name={name}
                            onVote={() => onVote(name.id)}
                            onCancelVote={() => onCancelVote(name.id)}
                            onDeleteName={
                                onDeleteName
                                    ? () => onDeleteName(name.id)
                                    : undefined
                            }
                            hasUserVoted={userVotes[name.id] || false}
                            isVoting={loading.voting === name.id}
                            isCancellingVote={
                                loading.cancellingVote === name.id
                            }
                            isDeleting={loading.deletingName === name.id}
                            isAdmin={isAdmin}
                            currentUserId={currentUserId}
                        />
                    ))
                )}
            </div>

            <form
                onSubmit={handleAddName}
                className="py-2 border-t border-gray-300 flex space-x-2 space-y-2 md:space-y-0 flex-col md:flex-row"
            >
                <input
                    type="text"
                    name="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter a name."
                    className="border rounded-md px-2 border-gray-400 text-sm focus:outline-0 w-fill md:w-3/4 py-2"
                    disabled={loading.addingName}
                />
                <button
                    type="submit"
                    disabled={loading.addingName || !newName.trim()}
                    className="rounded-md bg-slate-800 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none cursor-pointer font-semibold w-full md:w-1/4"
                >
                    {loading.addingName ? "Adding..." : "Add Name"}
                </button>
            </form>
        </div>
    );
};

export default Card;
