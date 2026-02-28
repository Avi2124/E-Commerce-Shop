import express from 'express';
import cors from "cors";
import userRouter from "./routes/user.routes.js"
import productRouter from './routes/product.routes.js';
import orderRouter from './routes/order.routes.js';
import { startExpiryCron } from './utils/expiry.cron.js';

const app = express()
startExpiryCron();

//Middleware
app.use(express.json());

//This is used for log print in console
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send('E-commerce shop is running');
});

app.use("/", userRouter);
app.use("/", productRouter);
app.use("/",orderRouter);

app.use((err, req, res, next) => {
    console.log('Inhandled error:', err);
    res.status(500).json({status: false, message: 'Something went wrong', data: null, error: {details: err.message}});
});

export default app;