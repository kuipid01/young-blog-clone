/**
 * Brevo (formerly Sendinblue) API Integration
 * Used for transactional emails - Jemil Marketplace
 * Documentation: https://developers.brevo.com/
 */

const BREVO_BASE_URL = "https://api.brevo.com/v3";
const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const DEFAULT_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "support@jemilmarketplace.com";
const DEFAULT_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Jemil Marketplace";

export interface EmailRecipient {
    email: string;
    name?: string;
}

export interface SendEmailOptions {
    to: EmailRecipient[];
    subject: string;
    htmlContent?: string;
    textContent?: string;
    templateId?: number;
    params?: Record<string, unknown>;
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    replyTo?: EmailRecipient;
    attachments?: Array<{
        name: string;
        content: string;
        contentType?: string;
    }>;
    tags?: string[];
}

interface BrevoResponse {
    messageId?: string;
    error?: {
        code: string;
        message: string;
    };
}

export interface ContactOptions {
    email: string;
    attributes?: Record<string, unknown>;
    listIds?: number[];
    updateEnabled?: boolean;
}

class BrevoService {
    private headers: HeadersInit;
    private senderEmail: string;
    private senderName: string;

    constructor() {
        this.headers = {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
        };
        this.senderEmail = DEFAULT_SENDER_EMAIL;
        this.senderName = DEFAULT_SENDER_NAME;
    }

    async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const payload: Record<string, unknown> = {
                sender: {
                    email: this.senderEmail,
                    name: this.senderName,
                },
                to: options.to,
                subject: options.subject,
            };

            if (options.templateId) {
                payload.templateId = options.templateId;
                if (options.params) {
                    payload.params = options.params;
                }
            } else {
                if (options.htmlContent) payload.htmlContent = options.htmlContent;
                if (options.textContent) payload.textContent = options.textContent;
            }

            if (options.cc) payload.cc = options.cc;
            if (options.bcc) payload.bcc = options.bcc;
            if (options.replyTo) payload.replyTo = options.replyTo;
            if (options.attachments) payload.attachment = options.attachments;
            if (options.tags) payload.tags = options.tags;

            const response = await fetch(`${BREVO_BASE_URL}/smtp/email`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify(payload),
            });

            const result: BrevoResponse = await response.json();

            if (!response.ok || result.error) {
                return { success: false, error: result.error?.message || "Failed to send email" };
            }

            return { success: true, messageId: result.messageId };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to send email";
            console.error("Brevo email error:", error);
            return { success: false, error: message };
        }
    }


    async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 50px 40px; border-radius: 24px 24px 0 0; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">Jemil Marketplace</h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px;">Your One-Stop Shop</p>
                    </div>
                    <div style="background: white; padding: 40px; border-radius: 0 0 24px 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 700; text-align: center;">Reset Your Password</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                            Hello ${name || 'there'},<br><br>
                            We received a request to reset the password for your <strong>Jemil Marketplace</strong> account. To get back into your account, click the button below:
                        </p>
                        <div style="text-align: center; margin-bottom: 35px;">
                            <a href="${resetLink}" style="background-color: #4f46e5; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                            This link will remain active for <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your account is still secure.
                        </p>
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; margin-top: 25px;">
                            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
                                If you're having trouble with the button, copy and paste this link into your browser:
                                <br>
                                <span style="word-break: break-all; color: #4f46e5; text-decoration: underline;">${resetLink}</span>
                            </p>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 30px 20px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            &copy; ${new Date().getFullYear()} Jemil Marketplace. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: [{ email, name }],
            subject: "Reset your Jemil Marketplace password",
            htmlContent,
            tags: ["auth", "forgot-password"],
        });
    }

    async sendOTPEmail(email: string, otp: string, name?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px; border-radius: 20px 20px 0 0; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Jemil Marketplace</h1>
                        <p style="color: rgba(255, 255, 255, 0.8); margin: 10px 0 0 0; font-size: 14px;">Secure Your Account</p>
                    </div>
                    <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Verification Code</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                            Hello${name ? ` ${name}` : ''},<br>
                            Use the following code to complete your verification process:
                        </p>
                        <div style="background: #f5f3ff; border: 2px dashed #4f46e5; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                            This code will expire in <strong>10 minutes</strong>. For your security, do not share this code with anyone.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                            If you didn't request this code, please ignore this email or contact our support team.
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            &copy; ${new Date().getFullYear()} Jemil Marketplace. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: [{ email, name }],
            subject: `${otp} is your Jemil Marketplace verification code`,
            htmlContent,
            tags: ["otp", "verification"],
        });
    }

    async sendOrderConfirmation(
        email: string,
        name: string,
        orderTotal: number,
        itemsCount: number,
        orderId: string
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: #4f46e5; padding: 40px; border-radius: 20px 20px 0 0; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Jemil Marketplace</h1>
                    </div>
                    <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="width: 60px; height: 60px; background: #ecfdf5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                <span style="font-size: 30px; color: #10b981;">✓</span>
                            </div>
                        </div>
                        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Order Confirmed!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                            Hi ${name},<br><br>
                            Thank you for your purchase! We've received your order and are processing it now.
                        </p>
                        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Order Number</td>
                                    <td style="padding: 10px 0; color: #111827; font-weight: bold; text-align: right;">#${orderId.toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Items</td>
                                    <td style="padding: 10px 0; color: #111827; font-weight: bold; text-align: right; border-top: 1px solid #e5e7eb;">${itemsCount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Total Amount</td>
                                    <td style="padding: 10px 0; color: #4f46e5; font-weight: bold; text-align: right; border-top: 1px solid #e5e7eb; font-size: 18px;">₦${orderTotal.toLocaleString()}</td>
                                </tr>
                            </table>
                        </div>
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/orders/${orderId}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Order Status</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: [{ email, name }],
            subject: `Order Confirmed: #${orderId.toUpperCase()}`,
            htmlContent,
            tags: ["order", "confirmation"],
        });
    }

    async upsertContact(options: ContactOptions): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${BREVO_BASE_URL}/contacts`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    email: options.email,
                    attributes: options.attributes || {},
                    listIds: options.listIds || [],
                    updateEnabled: options.updateEnabled !== false,
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                return { success: false, error: result.message || "Failed to create contact" };
            }

            return { success: true };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to create contact";
            console.error("Brevo contact error:", error);
            return { success: false, error: message };
        }
    }

    generateOTP(length: number = 6): string {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        return Math.floor(min + Math.random() * (max - min + 1)).toString();
    }
}

export const brevo = new BrevoService();

