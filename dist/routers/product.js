import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";
import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getSingleProduct, getlatestProducts, newProduct, updateProduct } from "../controllers/product.js";
const app = express.Router();
//Route -- /api/v1/product/new 
// to create a new product 
app.post('/new', singleUpload, newProduct);
// Route -- /api/v1/product/search
// to get all products using filters
app.get('/all', getAllProducts);
// Route -- /api/v1/product/latest 
// this route provides a latest 5 product on basis of created At
app.get('/latest', getlatestProducts);
// Route -- /api/v1/product/categories
// get all unique categories
app.get('/categories', getAllCategories);
// Route -- /api/v1/product/admin-products
// get all products 
app.get('/admin-products', isAdmin, getAdminProducts);
// Route -- /api/v1/product/DyamicId for products
// To get, update or delete products on basis of DyamicId
app.route('/:id')
    .get(getSingleProduct)
    .put(singleUpload, updateProduct)
    .delete(isAdmin, deleteProduct);
export default app;
