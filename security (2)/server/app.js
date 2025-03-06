const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const authRouter = require('./routes/AuthRoute')
const adminRouter = require('./routes/AdminRoute')
const userRouter = require('./routes/UserRoute')
const sellerRouter = require('./routes/SellerRoute')

app.use("/auth", authRouter)
app.use("/admin", adminRouter)
app.use("/user", userRouter)
app.use("/seller", sellerRouter)

// Server Start
app.listen(3000, () => console.log('Server running on port 3000'));
