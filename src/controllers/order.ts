import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Request } from "express";
import { Order } from "../models/order.js";
import { ReduceStock, invalidateCache, returnStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { nodeCache } from "../app.js";
import { Product } from "../models/product.js";



export const myOrders = TryCatch(async(req,res,next)=>{
         
       const {id:user} = req.query;
       let orders=[]
       const key = `my-orders-${user}`;
          
       if(nodeCache.has(key)){
            orders = JSON.parse(nodeCache.get(key) as string)
       }
       else {
            orders = await Order.find({user: user});
            nodeCache.set(key, JSON.stringify(orders));
       }

       res.status(200).json({
            success: true,
            orders,
       });
});


export const getAdminOrders = TryCatch(async(req,res,next)=>{
       
     let orders=[];
     const key = `admin-orders`
     if(nodeCache.has(key)){
          orders = JSON.parse(nodeCache.get(key) as string)
          
     }
     else {
          orders = await Order.find({}).populate("user", "name email",);
          nodeCache.set(key, JSON.stringify(orders));
     }

     res.status(200).json({
          success: true,
          orders,
     });
});


export const getSingleOrder = TryCatch(async(req,res,next)=>{
     
     const {id} = req.params;
     const key = `order-${id}`;
     let order;
     
     if(nodeCache.has(key)) 
          order = JSON.parse(nodeCache.get(key) as string);          
     else {
          order = await Order.findById(id).populate("user", "name");
          if(!order){
             return next(new ErrorHandler("Order not found",400));  
          }
          nodeCache.set(key, JSON.stringify(order));     
     }

     res.status(200).json({
          success: true,
          order,
     });
});





//  ******************* below all funtion are manupulates data *****************  


export const newOrder = TryCatch(
     async(req:Request<{},{},NewOrderRequestBody>,res,next)=>{
   
       const {
              shippingInfo, orderItems,
              user, subtotal, tax, shippingCharges,
              discount, total
       } = req.body;
   
       if(  !shippingInfo ||
            !orderItems ||
            !user ||
            !subtotal ||
            !tax ||
            !total
        ) return next(new ErrorHandler("Please Enter all Fields", 400));
   
            
            await Order.create({
                 shippingInfo,
                 orderItems,
                 user,
                 subtotal,
                 total,
                 tax,
                 shippingCharges,
                 discount
             });
             
             
             
              ReduceStock(orderItems);
             invalidateCache({
                    product:true,
                    order:true, 
                    userId: user,
                    productId: orderItems.map(i=> String(i.productId)),
                    admin: true, 
               })
   
       res.status(201).json({
             success: true,
             message: "Product Order Successfully"
       })
   
   
});
   


export const processOrder = TryCatch(async(req,res,next)=>{
     
     const {id} = req.params;

     let order = await Order.findById(id);

     if(!order) return next(new ErrorHandler("Order not found",404));

     switch(order.status){

          case 'Processing':
               order.status = "Shipped";
               break;

          case "Shipped":
                order.status = "Delivered";
          
          default:
                order.status = "Delivered";
     }
     
     await order.save();

     invalidateCache({order: true, userId:order.user, orderId:id, admin:true})

     res.status(200).json({
          success: true,
          message: "order process successfully",
     });

});

export const deleteOrder = TryCatch(async(req,res,next)=>{
     
     const {id} = req.params;

     let order = await Order.findById(id);
     
     if(!order) return next(new ErrorHandler("Order not found",404));
     
     console.log(order)
     
     await order.deleteOne();
     
     returnStock(order.orderItems);

     // yethi system me order cancel hote he stock add karna ho product tak liye ye fxn h
          // yethi return sucessfully hone baad karna ho tabhi bhi ye fxn hi kaam kareka ye fxn features modoele me h
     // const productIds:string[] = order.orderItems.map(i=>String(i.productId));


     invalidateCache({product:true,order: true, userId:order.user, orderId:String(order._id), admin:true})


     res.status(200).json({
          success: true,
          message: "order delete successfully",
     });
});






