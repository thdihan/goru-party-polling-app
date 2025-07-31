"use client";

import { ThemeProvider, Button } from "@material-tailwind/react";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export { ThemeProvider, Button };

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <SessionProvider>
            <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
    );
}
