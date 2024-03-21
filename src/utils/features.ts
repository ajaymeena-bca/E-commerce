import mongoose from "mongoose"
import { InvalidateCacheType, OrderItem } from "../types/types.js";
import { nodeCache } from "../app.js";
import { Product } from "../models/product.js";
import ErrorHandler from "./utility-class.js";
import { Order } from "../models/order.js";
import { User } from "../models/user.js";


export const connectDb = (uri:string)=>{
      
      mongoose.connect(uri,{
          dbName:"ecommerce",

      }).then((c)=>{
           console.log(`db connect to : ${c.connection.host}`);
      }).catch((err)=>{
            console.log("eroor is : "+ err)
      });
} 

export const invalidateCache = ({
      product,
      order,
      admin, 
      userId,
      orderId,
      productId,
}:InvalidateCacheType
) => {
          
      if(product){
            const productKey:string[] = 
                  [
                   "latestProduct",
                   "categories",
                   "all-products", 
                   
                  ];

            
            if(Array.isArray(productId))
               productId.forEach(i=>productKey.push(`product-${i}`))
            else 
               productKey.push(`product-${productId}`)
            
            
            nodeCache.del(productKey);

      };

      if(order){
            const orderKeys:string[] = ["admin-orders", `my-order${userId}`,`order-${orderId}`]
            nodeCache.del(orderKeys);
      };


      if(admin){
        nodeCache.del(["admin-stats", "pie-charts", "admin-bar-charts",  "admin-line-charts"])
      };

};





export const ReduceStock = async (orderItems: OrderItem[]) => {
    
    for(let i=0;i<orderItems.length;i++){
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product) {
             throw new Error('Product not found');
        }

        product.stock -= order.quantity;
        await product.save();
    }
        
    
};


export const returnStock = async (orderItems: any[]) => {
    
    for(let i=0;i<orderItems.length;i++){
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product) {
             throw new Error('Product not found');
        }

        product.stock += order.quantity;
        await product.save();
    }
    
};



export const calculatePercentage = (thisMonth:number, lastMonth:number) => {
       //  formula (lastMonth/thisMonth)/100
       let percent;
       if(lastMonth == 0) return (thisMonth)*100;

      percent = ((thisMonth - lastMonth)/lastMonth)*100;
      return Number(percent.toFixed(0));
}


export const getInventories = async ({categories,ProductsCount,}:{categories: string[];ProductsCount: number;}) => {


      const categoriesCountPromise = categories.map((category) =>
        Product.countDocuments({ category })
      );
    
      const categoriesCount = await Promise.all(categoriesCountPromise);
    
      const categoryCount: Record<string, number>[] = [];
    
      categories.forEach((category, i) => {
        categoryCount.push({
          [category]: Math.round((categoriesCount[i] / ProductsCount) * 100),
        });
      });
    
      return categoryCount;
    };
    

    
interface MyDocument extends Document {
      createdAt: Date;
      discount?: number;
      total?: number;
}

type FuncProps = {
      length: number;
      docArr: MyDocument[];
      today: Date;
      property?: "discount" | "total";
};
    
export const getChartData = ({
      length,
      docArr,
      today,
      property,
    }: FuncProps) => {
      const data: number[] = new Array(length).fill(0);
    
      docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
    
        if (monthDiff < length) {
          if (property) {
            data[length - monthDiff - 1] += i[property]!;
          } else {
            data[length - monthDiff - 1] += 1;
          }
        }
      });
    
      return data;
};