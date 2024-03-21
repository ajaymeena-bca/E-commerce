import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { allCoupon, applyDiscount, createCoupon, createPaymentIntent, deleteCoupon } from "../controllers/payment.js";
const app = express.Router();
app.get('/', (req, res) => {
    res.status(201).json({
        message: "Bhai payment route chal gya",
    });
});
// Route /api/v1/payment/create ->  to create a new payment
app.post('/create', createPaymentIntent);
// Route /api/v1/payment/coupon/new -> to create a new coupon
app.post('/coupon/new', isAdmin, createCoupon);
// Route /api/v1/payment/discount  -> to get discount amount
app.get('/discount', applyDiscount);
// Route /api/v1/payment/coupon/all -> to get all coupon
app.get('/coupon/all', isAdmin, allCoupon);
// Route /api/v1/payment/coupon/dyamicId  -> to delete coupon with Dyamic Id
app.delete('/coupon/:id', isAdmin, deleteCoupon);
export default app;
