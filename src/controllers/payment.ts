import { TryCatch } from "../middlewares/error.js";
import { Request } from "express";
import { NewCouponRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { Coupon } from "../models/coupon.js";
import { stripe } from "../app.js";




export const createPaymentIntent = TryCatch(
  async(req,res,next)=>{
       
    const {amount} = req.body;


    if(!amount) return next(new ErrorHandler("amount must be provided", 404));

    const paymentIntent = await stripe.paymentIntents.create({
         amount:Number(amount)*100,
         currency: "inr"
    });



    res.status(200).json({
         success: true,
         ClientSecret: paymentIntent.client_secret,
    });


});



export const createCoupon = TryCatch(
    async(req:Request<{},{},NewCouponRequestBody>,res,next)=>{

        const { coupon, amount } = req.body;

        if (!coupon || !amount)
          return next(new ErrorHandler("Please enter both coupon and amount", 400));

         
        // const couponExist = await Coupon.find({code: coupon});
        // console.log(couponExist);
        // if(!couponExist) return next(new ErrorHandler("Coupon is already exist", 400));


        await Coupon.create({ code: coupon, amount });
        return res.status(201).json({
          success: true,
          message: `Coupon ${coupon} Created Successfully`,
        });

});

export const  allCoupon = TryCatch(async(req,res,next)=>{
    const coupons  = await Coupon.find({});
    if(!coupons) return next(new ErrorHandler("No Coupons exits",400));

    res.status(200).json({
         success: true,
         message: "Coupon accessed successfully",
         coupons,
    });
});


export const applyDiscount = TryCatch(async(req,res,next)=>{
      const {id} = req.query;

      const coupon = await Coupon.findById(id);

      if(!coupon) return next(new ErrorHandler("coupon not exits", 400));

      res.status(200).json({
           success: true,
           amount: coupon.amount,
      });

})

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} Deleted Successfully`,
  });
});

