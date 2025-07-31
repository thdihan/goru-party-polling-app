import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "openid email profile",
                    hd: "iut-dhaka.edu", // Restrict to IUT domain
                },
            },
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Please enter your email and password");
                }

                // Normalize email
                const normalizedEmail = credentials.email.toLowerCase().trim();

                // Check if email has permission
                const permission = await prisma.permission.findUnique({
                    where: { email: normalizedEmail },
                });

                if (!permission) {
                    throw new Error(
                        "Your email is not permitted to access this application"
                    );
                }

                // Find user
                const user = await prisma.user.findUnique({
                    where: { email: normalizedEmail },
                });

                if (!user || !user.password) {
                    throw new Error("Invalid email or password");
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isValidPassword) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name || "",
                    role: user.role,
                    studentId: user.studentId,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        signOut: "/login",
    },
    callbacks: {
        async signIn({ account, profile }) {
            // Allow credentials login (existing users)
            if (account?.provider === "credentials") {
                return true;
            }

            // Handle Google OAuth
            if (account?.provider === "google" && profile?.email) {
                // Check if email is from IUT domain
                if (!profile.email.endsWith("@iut-dhaka.edu")) {
                    return false;
                }

                // Check if email has permission
                const permission = await prisma.permission.findUnique({
                    where: { email: profile.email.toLowerCase().trim() },
                });

                if (!permission) {
                    return false; // No permission found
                }

                // Check if user already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email: profile.email.toLowerCase().trim() },
                });

                if (existingUser) {
                    // User exists, allow login
                    return true;
                } else {
                    // User doesn't exist, they need to complete registration
                    // We'll allow the sign in but handle registration in the session callback
                    return true;
                }
            }

            return false;
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
        async jwt({ token, user, account, profile }) {
            if (account?.provider === "google" && profile?.email) {
                // Store Google profile information
                token.email = profile.email.toLowerCase().trim();
                token.name = profile.name || "Unknown User";

                // Get profile picture from Google profile
                const googleProfile = profile as {
                    picture?: string;
                    image?: string;
                };
                token.picture =
                    googleProfile.picture || googleProfile.image || "";

                try {
                    // Check if user exists in our database
                    const dbUser = await prisma.user.findUnique({
                        where: { email: profile.email.toLowerCase().trim() },
                    });

                    if (dbUser) {
                        // User exists, add user info to token
                        token.id = dbUser.id;
                        token.role = dbUser.role;
                        token.studentId = dbUser.studentId;
                        token.needsRegistration = false;
                    } else {
                        // User doesn't exist, they need to complete registration
                        token.role = "user";
                        token.needsRegistration = true;
                        // Don't set token.id for new users to avoid confusion
                    }
                } catch (error) {
                    console.error("Error checking user in database:", error);
                    // In case of database error, assume they need registration
                    token.role = "user";
                    token.needsRegistration = true;
                }
            } else if (user) {
                // Credentials login - properly type the user object
                const userWithRole = user as {
                    id: string;
                    role: string;
                    studentId: string;
                };
                token.id = userWithRole.id;
                token.role = userWithRole.role;
                token.studentId = userWithRole.studentId;
                token.needsRegistration = false;
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                // Extend the session user object with our custom properties
                const extendedUser = session.user as {
                    id?: string;
                    role?: string;
                    studentId?: string;
                    needsRegistration?: boolean;
                    name?: string | null;
                    email?: string | null;
                    image?: string | null;
                };

                extendedUser.id = (token.id as string) || token.sub || "";
                extendedUser.role = (token.role as string) || "user";
                extendedUser.studentId = (token.studentId as string) || "";
                extendedUser.needsRegistration =
                    (token.needsRegistration as boolean) || false;

                // Set user profile information
                extendedUser.name = (token.name as string) || "Unknown User";
                extendedUser.email = (token.email as string) || "";
                extendedUser.image = (token.picture as string) || "";
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
