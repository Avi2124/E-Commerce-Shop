import mongoose from "mongoose";
import { Batch } from "../models/Batch.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { sendBatchExpiryMail } from "../config/mailer.js";
import { sendPushToTokens } from "../config/firebase.js";

export const runExpiryJob = async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const now = new Date();

        const expiredBatches = await Batch.find({
            status: "ACTIVE",
            expiryDate: {$lte: now},
            quantity: {$gt: 0}
        }).session(session);

        for(const batch of expiredBatches){
            const expiredQty = batch.quantity;

            // Mark batch as expired & zero it's quantity
            batch.quantity = 0;
            batch.status = "EXPIRED";
            await batch.save({session});

            // This is reduce product stock
            const product = await Product.findById(batch.product).session(session);
            if(product){
                product.stock = Math.max(0, product.stock - expiredQty);
                await product.save({session});
            }

            // Shopkeeper + notifications
            const shopkeeper = await User.findById(batch.shopkeeper).session(session);
            if(shopkeeper && product){
                if(shopkeeper.email){
                    await sendBatchExpiryMail({
                    to: shopkeeper.email,
                    productName: product.name,
                    expiredQty,
                    expiryDate: batch.expiryDate,
                    remainingStock: product.stock
                });
            }    

            // Push notification
            if(Array.isArray(shopkeeper.fcmTokens) && shopkeeper.fcmTokens.length > 0){
                const title = "Batch Expired";
                const body = `${product.name}: ${expiredQty} units expired on ${batch.expiryDate.toDateString()}.\nRemaining stoock: ${product.stock}.`;

                await sendPushToTokens({
                    tokens: shopkeeper.fcmTokens,
                    title,
                    body,
                    data: {
                        type: "BATCH_EXPIRED",
                        productId: String(product._id),
                        expiredQty: String(expiredQty),
                        remainingStock: String(product.stock)
                    },
                });
            }
        }
    }

        await session.commitTransaction();
        session.endSession();

        return {expiredCount: expiredBatches.length};
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};