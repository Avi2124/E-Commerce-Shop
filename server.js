import connectDB from './config/db.js'
import app from './app.js';
import 'dotenv/config';

const PORT = process.env.PORT || 1312;

connectDB();

app.listen(PORT, () => {
    console.log(`E-commerce Shop server is running on http://localhost:${PORT}`)
});