/**
 * Email service for sending verification emails using Nodemailer with Gmail
 */

import nodemailer from "nodemailer";

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private isDevelopment = process.env.NODE_ENV === "development";

    constructor() {
        console.log("EMAIL TRANSPORTER INIT -> START");
        this.initializeTransporter();
        console.log("EMAIL TRANSPORTER INIT -> DONE");
    }

    private async initializeTransporter() {
        try {
            console.log("EMAIL TRANSPORTER INIT -> PROCESSING");
            if (this.isDevelopment) {
                // In development, we'll still log to console but also try to send if credentials are provided
                console.log(
                    "EmailService: Development mode - emails will be logged to console"
                );
            }

            // Check if Gmail credentials are provided
            const emailUser = process.env.GMAIL_USER;
            const emailPass = process.env.GMAIL_APP_PASSWORD;

            if (!emailUser || !emailPass) {
                if (!this.isDevelopment) {
                    console.warn(
                        "Gmail credentials not provided. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables."
                    );
                }
                return;
            }

            // Create transporter with Gmail configuration
            this.transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: emailUser,
                    pass: emailPass, // Use App Password, not regular password
                },
                // Additional security options
                secure: true,
                tls: {
                    rejectUnauthorized: false,
                },
            });

            // Verify connection configuration
            if (this.transporter) {
                await this.transporter.verify();
                console.log(
                    "EmailService: Gmail transporter configured successfully"
                );
            }
            console.log("EMAIL TRANSPORTER INIT -> PROCESSED");
        } catch (error) {
            console.error(
                "EmailService: Failed to initialize Gmail transporter:",
                error
            );
            this.transporter = null;
            console.log("EMAIL TRANSPORTER INIT -> ERROR");
        }
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            // Always log in development for debugging
            console.log("EMAIL SENDING  -> START");
            if (this.isDevelopment) {
                console.log("=== EMAIL SENT (Development Mode) ===");
                console.log("To:", options.to);
                console.log("Subject:", options.subject);
                console.log(
                    "Content:",
                    options.text || "HTML content (see full email below)"
                );
                console.log("=====================================");
            }

            // If no transporter is available, handle gracefully
            if (!this.transporter) {
                if (this.isDevelopment) {
                    console.log(
                        "No transporter available - email logged above for development"
                    );
                    return true; // Return true in development for testing
                } else {
                    console.error(
                        "No email transporter configured. Please check Gmail credentials."
                    );
                    return false;
                }
            }

            // Send email using Nodemailer
            const mailOptions = {
                from: {
                    name: "Goru Party 2025",
                    address: process.env.GMAIL_USER || "noreply@goruparty.com",
                },
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                // Additional options for better delivery
                priority: "high" as const,
                headers: {
                    "X-Mailer": "Goru Party 2025",
                    "X-Priority": "1",
                },
            };

            const info = await this.transporter.sendMail(mailOptions);

            console.log("Email sent successfully:", {
                messageId: info.messageId,
                to: options.to,
                subject: options.subject,
            });

            return true;
        } catch (error) {
            console.error("Failed to send email:", error);

            // In development, still return true to not block the flow
            if (this.isDevelopment) {
                console.log(
                    "Email sending failed but continuing in development mode"
                );
                return true;
            }

            return false;
        }
    }

    async sendVerificationEmail(
        email: string,
        code: string,
        name?: string
    ): Promise<boolean> {
        const subject = "Verify Your Goru Party Account";

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f472b6, #fbbf24, #60a5fa); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .code { background: #1e293b; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to Goru Party 2025!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello${name ? ` ${name}` : ""}!</h2>
                        <p>Thank you for registering for Goru Party 2025. To complete your registration, please verify your email address by entering the verification code below:</p>
                        
                        <div class="code">${code}</div>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This verification code will expire in 24 hours</li>
                            <li>Enter this code exactly as shown (case-sensitive)</li>
                            <li>If you didn't request this verification, please ignore this email</li>
                        </ul>
                        
                        <p>Once verified, you'll be able to access the Goru Party T-shirt name polling system and participate in the voting process.</p>
                        
                        <p>Best regards,<br>The Goru Party Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Welcome to Goru Party 2025!

Hello${name ? ` ${name}` : ""}!

Thank you for registering for Goru Party 2025. To complete your registration, please verify your email address by entering this verification code:

${code}

Important:
- This verification code will expire in 24 hours
- Enter this code exactly as shown (case-sensitive)
- If you didn't request this verification, please ignore this email

Once verified, you'll be able to access the Goru Party T-shirt name polling system and participate in the voting process.

Best regards,
The Goru Party Team

This is an automated email. Please do not reply to this message.
        `;

        return this.sendEmail({
            to: email,
            subject,
            html,
            text,
        });
    }
}

const emailService = new EmailService();
export default emailService;
