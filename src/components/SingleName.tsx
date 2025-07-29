"use client";
import React, { useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FiThumbsUp, FiTrash2, FiUserCheck } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";

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

type Props = {
    name: Name;
    onVote: () => Promise<void>;
    onCancelVote: () => Promise<void>;
    onDeleteName?: () => Promise<void>;
    hasUserVoted: boolean;
    isVoting: boolean;
    isCancellingVote: boolean;
    isDeleting?: boolean;
    isAdmin?: boolean;
    currentUserId?: string;
};

const randomColor = ["#E25130", "#54963E", "#7F4D94", "#EFAD20", "#1387B9"];

const SingleName = ({
    name,
    onVote,
    onCancelVote,
    onDeleteName,
    hasUserVoted,
    isVoting,
    isCancellingVote,
    isDeleting = false,
    isAdmin = false,
    currentUserId,
}: Props) => {
    const [showVoters, setShowVoters] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const totalVotes = name.votes.length;
    const votePercentage = Math.min((totalVotes / 10) * 100, 100); // Assuming max 10 votes for 100%

    // Get unique voters (in case of multiple votes from same user)
    const uniqueVoters = name.votes.reduce((acc, vote) => {
        if (!acc.find((v) => v.voter.id === vote.voter.id)) {
            acc.push(vote);
        }
        return acc;
    }, [] as Vote[]);

    const displayVoters = uniqueVoters.slice(0, 3);
    const remainingVoters = Math.max(0, uniqueVoters.length - 3);

    // console.log("Name Created By:", name?.createdBy?.name);

    return (
        <div className="backdrop-blur-sm bg-white/60 rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {name.value}
                        </h3>

                        {/* Admin info - only visible to admin */}
                        {isAdmin && name.creator && (
                            <div className="bg-blue-50/80 border border-blue-200/60 rounded-md px-2 py-1 mb-2">
                                <p className="text-xs text-blue-700 font-medium">
                                    👤 Added by: {name.creator.name} (
                                    {name.creator.studentId})
                                </p>
                            </div>
                        )}

                        {/* Vote count and voters preview */}
                        <div className="flex items-center space-x-2 mb-2">
                            {totalVotes > 0 && (
                                <>
                                    <div className="flex items-center space-x-1">
                                        <div className="flex -space-x-1">
                                            {displayVoters.map(
                                                (vote, index) => (
                                                    <div
                                                        key={vote.id}
                                                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white shadow-sm"
                                                        style={{
                                                            backgroundColor:
                                                                randomColor[
                                                                    index %
                                                                        randomColor.length
                                                                ],
                                                        }}
                                                        title={`${vote.voter.name} (${vote.voter.studentId})`}
                                                    >
                                                        {vote.voter.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                )
                                            )}
                                            {remainingVoters > 0 && (
                                                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-medium text-white shadow-sm">
                                                    +{remainingVoters}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-600 ml-2">
                                            {totalVotes} vote
                                            {totalVotes !== 1 ? "s" : ""}
                                        </span>
                                    </div>

                                    {totalVotes > 0 && (
                                        <button
                                            onClick={() =>
                                                setShowVoters(!showVoters)
                                            }
                                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                        >
                                            <span>See all</span>
                                            {showVoters ? (
                                                <IoIosArrowUp className="w-3 h-3" />
                                            ) : (
                                                <IoIosArrowDown className="w-3 h-3" />
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Menu button for admin actions */}
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <BsThreeDots className="w-4 h-4 text-gray-500" />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                    {onDeleteName && (
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                onDeleteName();
                                            }}
                                            disabled={isDeleting}
                                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            <span>
                                                {isDeleting
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                {totalVotes > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${votePercentage}%` }}
                        ></div>
                    </div>
                )}
            </div>

            {/* Vote button */}
            <div className="px-4 pb-3">
                {hasUserVoted ? (
                    <button
                        onClick={onCancelVote}
                        disabled={isCancellingVote}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiUserCheck className="w-4 h-4" />
                        <span className="font-medium">
                            {isCancellingVote ? "Removing vote..." : "Voted"}
                        </span>
                    </button>
                ) : (
                    <button
                        onClick={onVote}
                        disabled={isVoting}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiThumbsUp className="w-4 h-4" />
                        <span className="font-medium">
                            {isVoting ? "Voting..." : "Vote"}
                        </span>
                    </button>
                )}
            </div>

            {/* Expanded voters list */}
            {showVoters && totalVotes > 0 && (
                <div className="border-t border-white/40 bg-white/30 px-4 py-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Voted by ({uniqueVoters.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {uniqueVoters.map((vote) => (
                            <div
                                key={vote.id}
                                className="flex items-center space-x-3"
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                                    style={{
                                        backgroundColor:
                                            randomColor[
                                                Math.floor(
                                                    Math.random() *
                                                        randomColor.length
                                                )
                                            ],
                                    }}
                                >
                                    {vote.voter.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {vote.voter.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {vote.voter.studentId}
                                    </p>
                                </div>
                                {vote.voter.id === currentUserId && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                        You
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SingleName;
