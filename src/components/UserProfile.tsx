"use client";
import { useSession } from "next-auth/react";

interface UserProfileProps {
    showStudentId?: boolean;
    className?: string;
}

export default function UserProfile({
    showStudentId = false,
    className = "",
}: UserProfileProps) {
    const { data: session } = useSession();

    if (!session?.user) {
        return null;
    }

    return (
        <div className={`user-profile ${className}`}>
            <div className="flex items-center space-x-2">
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                        {session.user.name || "Unknown User"}
                    </span>
                    <span className="text-xs text-gray-600">
                        {session.user.email}
                    </span>
                    {showStudentId && session.user.studentId && (
                        <span className="text-xs text-gray-500">
                            ID: {session.user.studentId}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
