import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASS},
});

export const sendMail = async ({to, subject, html}) => {
    return transporter.sendMail({
        from: `E-commerce Shop <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
};

export const sendOtpMail = async ({to, otp}) => {
    try {
        const html = `<div style="font-family: Arial, sans-serif;">
          <h2>E-commerce Shop</h2>
          <p>Your login OTP is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in <b>10 minutes</b>.</p>
          <p>If you did not request this, please ignore this email.</p></div>`;
        return sendMail({to, subject: "Your login OTP - E-commerce Shop", html});
    } catch (error) {
        console.error("Mail sending failed:", error.message);
        throw new Error("Failed to send email");
    }
}; 

export const sendBatchExpiryMail = async ({
    to,
    productName,
    expiredQty,
    expiryDate,
    remainingStock
}) => {
    try {
        const html = `
        <div style = "font-family: Arial, sans-serif;">
            <h2>Batch Expired Notification</h2>
            <p>A batch has expired in your inventory</p>

            <table style = "border-collapse: collapse;">
                <tr>
                    <td style="padding: 6px;"><b>Product:</b></td>
                    <td style="padding: 6px;">${productName}</td>
                </tr>
                <tr>
                    <td style="padding: 6px;"><b>Expired Quantity:</b></td>
                    <td style="padding: 6px;">${expiredQty}</td>
                </tr>
                <tr>
                    <td style="padding: 6px;"><b>Expiry Date:</b></td>
                    <td style="padding: 6px;">${new Date(expiryDate).toDateString()}</td>
                </tr>
                <tr>
                    <td style="padding: 6px;"><b>Remaining Stock:</b></td>
                    <td style="padding: 6px;">${remainingStock}</td>
                </tr>
            </table>
            <p>Please review your inventory.</p>
        </div>
        `;
        return sendMail({
            to,
            subject: `Batch Expired - ${productName}`,
            html
        });
    } catch (error) {
        console.error("Expiry mail failed:", error.message);
    }
};