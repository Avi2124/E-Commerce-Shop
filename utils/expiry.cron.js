import cron from "node-cron";
import { runExpiryJob } from "./expiry.js";

export const startExpiryCron = () => {
    // cron.schedule("5 0 * * *", async () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            const result = await runExpiryJob();
            console.log("Expiry job done:", result);
        } catch (error) {
            console.error("Expiry job failed:", error.message);
        }
    });
};