import express from "express";
import { newUser, getAllUsers, getUser, deleteUser } from "../controllers/user.js";
import { isAdmin } from "../middlewares/auth.js";
const app = express.Router();
//Route - /api/v1/user/new
app.post('/new', newUser);
//Route - /api/v1/user/all
app.get('/all', isAdmin, getAllUsers);
// Route - /api/v1/user/dyamicId  --- for get , update or delete user
app.route('/:id').get(isAdmin, getUser).delete(isAdmin, deleteUser);
// for update a user with specified properties 
// app.put('/:id',singleUpload, updateUser ) 
export default app;
