import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";


// middleware for admin user is allowed
export const  isAdmin = TryCatch(async(req,res,next)=>{
       const {id} = req.query;

       if(!id) return next(new ErrorHandler("Id is not provided",401));

       const user = await User.findById({_id: id});
       if(!user) return next(new ErrorHandler("your id is not valid ", 401 ));

       if(user.role !== "admin") return next(new ErrorHandler("you are not a admin user",403));

       next();     
});