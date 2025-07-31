/**
 * Generates a random 8-character verification code containing letters and numbers
 */
export function generateVerificationCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";

    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

/**
 * Creates an expiration date for verification code (24 hours from now)
 */
export function getVerificationExpiry(): Date {
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
}

/**
 * Checks if a verification code has expired
 */
export function isVerificationExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
}
