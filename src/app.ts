import express, {Request, Response, NextFunction} from 'express';
import { connectDb } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
import NodeCache from 'node-cache';
import { config } from 'dotenv';
import morgan from 'morgan';
import cors from 'cors'
import Stripe from 'stripe';



export const nodeCache = new NodeCache();

config({
    
    path:  "./.env",
});

const mongoURI = process.env.URI as string | "";
const port =   process.env.PORT as string | 3000;
const stripeKey =   process.env.STRIPE_KEY as string | "";

connectDb(mongoURI);

export const stripe = new Stripe(stripeKey);




// import sub Routes
import userRoute from './routers/user.js';
import productRoute from './routers/product.js';
import orderRoute from './routers/order.js';
import paymentRoute from './routers/payment.js';
import dashboardRoute from './routers/stats.js';



const app = express();
app.use(express.json())
app.use(morgan("dev"));

app.use(cors());

app.get('/',(req,res)=>{
    return res.json({
        joker: "joker",
        mes: 23
    })
});



// using Routes for apis
app.use('/api/v1/user', userRoute);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/order', orderRoute);
app.use('/api/v1/payment', paymentRoute);
app.use('/api/v1/dashboard', dashboardRoute);



app.use('/uploads', express.static("uploads"));
app.use(errorMiddleware);

app.listen(port,()=>{
      console.log(`servser is working on http://localhost:${port}`)
});