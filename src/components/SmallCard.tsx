"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

interface SmallCardProps {
    pollId: number;
    studentName: string;
    studentId: string;
    topVotedName: string | null;
    totalVotes: number;
    isAdmin: boolean;
}

const randomColor = ["#E25130", "#54963E", "#7F4D94", "#EFAD20", "#1387B9"];

const SmallCard = ({
    pollId,
    studentName,
    studentId,
    topVotedName,
    totalVotes,
    isAdmin,
}: SmallCardProps) => {
    const router = useRouter();
    const bgColor = useMemo(() => {
        return randomColor[Math.floor(Math.random() * randomColor.length)];
    }, []);

    // Get first letter of student name for avatar
    const avatarLetter = studentName.charAt(0).toUpperCase();

    return (
        <div className="size-[250px] backdrop-blur-md bg-white/40 border border-white/30 shadow-xl p-4 rounded-xl">
            <div className="flex flex-col h-full items-center justify-between">
                <div
                    className="rounded-full size-12 flex items-center justify-center"
                    style={{ backgroundColor: bgColor }}
                >
                    <h1 className="text-2xl font-bold text-white">
                        {avatarLetter}
                    </h1>
                </div>
                <div className="text-slate-800 text-center">
                    <h2 className="text-lg font-semibold">{studentName}</h2>
                    <p className="text-sm text-slate-600">{studentId}</p>
                </div>
                <div className="text-center">
                    <h3 className="my-2 font-bold text-xl text-[#1387B9]">
                        {isAdmin && topVotedName ? topVotedName : "***"}
                    </h3>
                    {totalVotes > 0 && (
                        <p className="text-xs text-slate-500">
                            {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => router.push(`/poll/${pollId}`)}
                    className="rounded-md bg-slate-800 py-1 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none cursor-pointer font-semibold w-full"
                >
                    View Poll
                </button>
            </div>
        </div>
    );
};

export default SmallCard;
