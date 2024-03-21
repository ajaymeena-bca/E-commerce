import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";
import { deleteOrder, getAdminOrders,  getSingleOrder,  myOrders, newOrder, processOrder } from "../controllers/order.js";

const app = express.Router();


// Route -- /api/v1/order/new   to create a new order 
app.post('/new', newOrder)

// Route --- /api/v1/order/my
app.get('/my', myOrders);


// Route --- /api/v1/order/admin-orders  || for get all orders
app.get('/all', isAdmin, getAdminOrders);




// Route --- /api/v1/order/DyamicId  to get , update or delete order
app.route('/:id')
      .get(getSingleOrder)
      .put(isAdmin,processOrder)
      .delete(isAdmin, deleteOrder)


export default app;