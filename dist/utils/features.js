import mongoose from "mongoose";
import { nodeCache } from "../app.js";
import { Product } from "../models/product.js";
export const connectDb = (uri) => {
    mongoose.connect(uri, {
        dbName: "ecommerce",
    }).then((c) => {
        console.log(`db connect to : ${c.connection.host}`);
    }).catch((err) => {
        console.log("eroor is : " + err);
    });
};
export const invalidateCache = ({ product, order, admin, userId, orderId, productId, }) => {
    if (product) {
        const productKey = [
            "latestProduct",
            "categories",
            "all-products",
        ];
        if (Array.isArray(productId))
            productId.forEach(i => productKey.push(`product-${i}`));
        else
            productKey.push(`product-${productId}`);
        nodeCache.del(productKey);
    }
    ;
    if (order) {
        const orderKeys = ["admin-orders", `my-order${userId}`, `order-${orderId}`];
        nodeCache.del(orderKeys);
    }
    ;
    if (admin) {
        nodeCache.del(["admin-stats", "pie-charts", "admin-bar-charts", "admin-line-charts"]);
    }
    ;
};
export const ReduceStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product) {
            throw new Error('Product not found');
        }
        product.stock -= order.quantity;
        await product.save();
    }
};
export const returnStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product) {
            throw new Error('Product not found');
        }
        product.stock += order.quantity;
        await product.save();
    }
};
export const calculatePercentage = (thisMonth, lastMonth) => {
    //  formula (lastMonth/thisMonth)/100
    let percent;
    if (lastMonth == 0)
        return (thisMonth) * 100;
    percent = ((thisMonth - lastMonth) / lastMonth) * 100;
    return Number(percent.toFixed(0));
};
export const getInventories = async ({ categories, ProductsCount, }) => {
    const categoriesCountPromise = categories.map((category) => Product.countDocuments({ category }));
    const categoriesCount = await Promise.all(categoriesCountPromise);
    const categoryCount = [];
    categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / ProductsCount) * 100),
        });
    });
    return categoryCount;
};
export const getChartData = ({ length, docArr, today, property, }) => {
    const data = new Array(length).fill(0);
    docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
        if (monthDiff < length) {
            if (property) {
                data[length - monthDiff - 1] += i[property];
            }
            else {
                data[length - monthDiff - 1] += 1;
            }
        }
    });
    return data;
};
