import { withAuth } from "next-auth/middleware";

export default withAuth(
    function middleware(req) {
        // Additional middleware logic can go here
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow access to login and register pages without authentication
                if (
                    req.nextUrl.pathname === "/login" ||
                    req.nextUrl.pathname === "/register"
                ) {
                    return true;
                }

                // For all other pages, require authentication
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (authentication endpoints)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|public|images).*)",
    ],
};
