import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/product.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/utility-class.js';
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from '../types/types.js';
import { rm } from 'fs';
import { nodeCache } from '../app.js';

import { faker } from "@faker-js/faker";
import { invalidateCache } from '../utils/features.js';

export const getlatestProducts = TryCatch(
      async (req, res, next) => {
            
            let products = [];
            if (nodeCache.has("latestProducts")) {
                  products = JSON.parse(nodeCache.get("latestProducts") as string);
            }
            else {
                  products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
                  nodeCache.set("latestProducts", JSON.stringify(products));

            }

            return res.status(201).json({
                  success: true,
                  products,
            })

      });



export const getAllCategories = TryCatch(
      async (req, res, next) => {
            
            let categories;
            if(nodeCache.has("categories")){
                  categories = JSON.parse(nodeCache.get("category") as string);
            }
            else {       
                categories = await Product.distinct("category");
                nodeCache.set("categories", JSON.stringify(categories));
            }

            return res.status(201).json({
                  success: true,
                  categories,
            })

      });



export const getAdminProducts = TryCatch(
      async (req, res, next) => {
            let products;

            if(nodeCache.has("all-products")) {
                  products = JSON.parse(nodeCache.get("products") as string);
            }
            else{   
               products = await Product.find({});   
               nodeCache.set("all-products", products);
            }
             
            return res.status(201).json({
                  success: true,
                  products,
            })

      });

export const getSingleProduct = TryCatch(
      async (req, res, next) => {
            const { id } = req.params;
            let product;
            if(nodeCache.has(`product-${id}`))
                  product = JSON.parse(nodeCache.get(`product-${id}`) as string);
            else {    
                  product = await Product.findById(id);
                  if (!product) return next(new ErrorHandler("product is not founded", 400));
                  nodeCache.set(`product-${product.id}`, product);
            }

            return res.status(201).json({
                  success: true,
                  product,
            })

      });





 //                  ******************* below all funtion are manupulates data *****************    

export const newProduct = TryCatch(
      async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
            const { name, price, stock, category } = req.body;
            const photo = req.file;
            console.log("newProduct api called")
            if (!photo) return next(new ErrorHandler("Please add photo field", 400));

            if (!name || !price || !stock || !category || !photo) {

                  rm(photo.path, () => {
                        console.log("Deleted photo");
                  });
                  next(new ErrorHandler("Please provide all fiels", 400));
            }
            await Product.create({
                  name,
                  price,
                  stock,
                  category: category.toLowerCase(),
                  photo: photo.path,

            });

           invalidateCache({product: true, admin:true});

            return res.status(201).json({
                  success: true,
                  message: "Product created successfully",
            })

});


export const updateProduct = TryCatch(
      async (req, res, next) => {

            const { id } = req.params;
            const { name, price, stock, category } = req.body;
            const photo = req.file;

            const product = await Product.findById(id);

            if (!product) return next(new ErrorHandler("Id is not Invalid", 400));


            if (photo) {
                  rm(product.photo, () => {
                        console.log("photo is deleted..");
                  })
                  product.photo = photo?.path;
            }


            if (name) product.name = name;
            if (price) product.price = price;
            if (stock) product.stock = stock
            if (category) product.category = category;

            await product.save();
           invalidateCache({ product: true, productId: String(product._id), admin:true});
            return res.status(200).json({
                  success: true,
                  message: "Product updated successfully",
            })

      });


export const deleteProduct = TryCatch(
      async (req, res, next) => {
            const { id } = req.params;
            const product = await Product.findById(id);
            if (!product) return next(new ErrorHandler("product is not founded", 400));

            rm(product.photo, () => {
                  console.log("product Photo Deleted")
            });

            await Product.deleteOne();

           invalidateCache({product: true, productId:String(product._id), admin: true});

            return res.status(201).json({
                  success: true,
                  message: "Product deleted successfully",
            })

      });



export const getAllProducts = TryCatch(
      async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {

            const { search, price, category, sort } = req.query;

            const page = Number(req.query.page) || 1;
            const limit = Number(process.env.PRODUCT_PER_PAGE || 10);
            const skip = (page - 1) * limit;


            const baseQuery: BaseQuery = {};

            if (search) baseQuery.name = {
                  $regex: search,
                  $options: "i",
            };

            if (price) baseQuery.price = {
                  $lte: Number(price),
            };

            if (category) baseQuery.category = category;

            const productPromise = Product.find(baseQuery)
                  .sort(sort && { price: sort === "asc" ? 1 : -1 })
                  .limit(limit)
                  .skip(skip);

            const [products, filterProduct] = await Promise.all([
                  // to get faster performance
                  productPromise,
                  Product.find(baseQuery),
            ]);

            const totalPage = Math.ceil(filterProduct.length / limit);



            res.status(200).json({
                  success: true,
                  products,
                  totalPage,
            })

      });








































// const generateRandomProducts = async (count: number = 100) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\5ba9bd91-b89c-40c2-bb8a-66703408f986.png",
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({ succecss: true });
// };

// generateRandomProducts(100);
