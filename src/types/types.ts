import { Request, Response, NextFunction } from "express";

export interface NewUserRequestBody{  
       name: string;
       email: string;
       photo: string;
       gender: string;
       _id: string;
       dob: Date;
};



export interface UpdateUserRquestBody{
       name?: string;
       eamil?:string;
       photo?: string;
       gender?: string;
       dob: Date
}

export interface NewProductRequestBody{  
       name: string;
       price: number;
       stock: number;
       category: string;
};



export type ControllerType = (
       req: Request, 
       res: Response, 
       next: NextFunction
) => Promise< void |  Response<any, Record< string, any>>>;



export type SearchRequestQuery = {
       search?:string;
       price?:string;
       category?:string;
       sort?:string;
       page?:string;
}


export type BaseQuery = {
        name?:{
            $regex:string;
            $options:string;
        },

        price?:{
           $lte: number;
        }

        category?:string;
};


export type InvalidateCacheType = {
       product?:boolean;
       order?:boolean;
       admin?:boolean;
       userId?:string;
       orderId?:string;
       productId?:string[] | string;
};


export type ShippingInfo = {
        address:string;
        city:string;
        state:string;
        country:string;
        pincode:string;
};

export type OrderItem = {
       name:string;
       photo:string;
       price:number;
       quantity:number;
       productId:string;
}


export type NewOrderRequestBody = {
       shippingInfo: ShippingInfo;
       user:string;
       subtotal:number;
       tax:number;
       shippingCharges:number;
       discount:number;
       total:number;
       orderItems:OrderItem[];
}

export type NewCouponRequestBody = {
       coupon:string;
       amount:Number
}