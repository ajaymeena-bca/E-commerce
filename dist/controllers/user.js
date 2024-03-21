import { User } from '../models/user.js';
import ErrorHandler from '../utils/utility-class.js';
import { TryCatch } from '../middlewares/error.js';
export const getAllUsers = TryCatch(async (req, res, next) => {
    const users = await User.find({});
    res.status(201).json({
        success: true,
        users,
    });
});
export const getUser = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    const user = await User.findById({ _id: id });
    if (!user)
        return next(new ErrorHandler("Invalid user", 400));
    res.status(200).json({
        success: true,
        user,
    });
});
//                       ******************* below all funtion are manupulates data *****************  
export const newUser = TryCatch(async (req, res, next) => {
    const { name, email, photo, gender, _id, dob } = req.body;
    let user = await User.findById(_id);
    if (user)
        return res.status(200).json({
            success: true,
            message: `Welcome ${user.name}`,
        });
    if (!_id || !name || !email || !photo || !gender || !dob) {
        return next(new ErrorHandler("Please add all fields ", 404));
    }
    user = await User.create({
        name,
        email,
        photo,
        gender,
        _id,
        dob: new Date(dob),
    });
    res.status(201).json({
        success: true,
        message: `Welcome ${user.name}`,
    });
});
export const deleteUser = TryCatch(async (req, res, next) => {
    const id = req.params.id;
    const user = await User.deleteOne({ _id: id });
    if (!user.deletedCount)
        return next(new ErrorHandler("Invalid user", 400));
    res.status(200).json({
        success: true,
        message: "user is delete successfully",
    });
});
export const updateUser = TryCatch(async (req, res, next) => {
    const { name, eamil, photo, gender, dob } = req.body;
    const { id } = req.query;
    const user = await User.findById(id);
    if (!user)
        return next(new ErrorHandler("Invalid user", 404));
});
