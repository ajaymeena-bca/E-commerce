import { TryCatch } from '../middlewares/error.js';
import { nodeCache } from '../app.js';
import { Product } from '../models/product.js';
import { User } from '../models/user.js';
import { Order } from '../models/order.js';
import { calculatePercentage, getChartData, getInventories } from '../utils/features.js';
export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats = {};
    if (nodeCache.has('admin-stats'))
        stats = JSON.parse(nodeCache.get('admin-stats'));
    else {
        const today = new Date();
        const sixMonthAgo = new Date();
        sixMonthAgo.setMonth(today.getMonth() - 6);
        console.log("sixMonthAgo: " + sixMonthAgo);
        //   to get the current and last month dates
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today,
        };
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0),
        };
        //   get stats of current month and last month
        const thisMonthProductsPromise = Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            },
        });
        const lastMonthProductsPromise = Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            },
        });
        const thisMonthUsersPromise = User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            },
        });
        const lastMonthUsersPromise = User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            },
        });
        const thisMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            },
        });
        const lastMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end
            },
        });
        const lastSixMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            },
        });
        const latestTransactionsPromise = Order.find({}).select(["orderItems", "discount", "total", "status"]).limit(5);
        const [thisMonthProducts, thisMonthOrders, thisMonthUsers, lastMonthProducts, lastMonthOrders, lastMonthUsers, ProductsCount, UsersCount, orders, lastSixMonthOrders, femaleCount, categories, latestTransaction] = await Promise.all([
            thisMonthProductsPromise,
            thisMonthOrdersPromise,
            thisMonthUsersPromise,
            lastMonthProductsPromise,
            lastMonthOrdersPromise,
            lastMonthUsersPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}).select("total"),
            lastSixMonthOrdersPromise,
            User.countDocuments({ gender: "female" }),
            Product.distinct("category"),
            latestTransactionsPromise
        ]);
        const orderRevenue = orders.reduce((total, order) => (total + (order.total || 0)), 0);
        const count = {
            orderRevenue,
            product: ProductsCount,
            order: orders.length,
            user: UsersCount,
        };
        const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const changesPercentage = {
            products: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
            orders: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
            users: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
        };
        const orderMonthCount = new Array(6).fill(0);
        const orderMonthRevenue = new Array(6).fill(0);
        lastSixMonthOrders.forEach((order) => {
            const creationDate = order.createdAt;
            const dateDiff = today.getMonth() - creationDate.getMonth();
            if (dateDiff < 6) {
                orderMonthCount[6 - dateDiff - 1] += 1;
                orderMonthRevenue[6 - dateDiff - 1] += order.total;
            }
        });
        const userRatio = {
            male: Math.round(((UsersCount - femaleCount) / UsersCount) * 100),
            female: Math.round((femaleCount / UsersCount) * 100)
        };
        const categoryCount = await getInventories({
            categories,
            ProductsCount,
        });
        const modifedLastestTransactions = latestTransaction.map((i) => ({
            _id: i._id,
            discount: i.discount,
            amount: i.total,
            quantity: i.orderItems.length,
            status: i.status,
        }));
        stats = {
            changesPercentage,
            revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
            count,
            chart: {
                order: orderMonthCount,
                revenue: orderMonthRevenue,
            },
            userRatio,
            categoryCount,
            modifedLastestTransactions
        };
        nodeCache.set('admin-stats', JSON.stringify(stats));
    }
    return res.status(200).json({
        success: true,
        stats,
    });
});
export const getPieCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = `pie-charts`;
    if (nodeCache.has(key))
        charts = JSON.parse(nodeCache.get(key));
    else {
        const allOrderPromise = await Order.find({}).select(["total", "subtotal", "discount", "tax", "shippingCharges"]);
        const [processingOrder, shippedOrder, deliveredOrder, categories, ProductsCount, outOfStockProductsCount, allOrders, allUsers, adminUserCount, customerUserCount,] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            allOrderPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" })
        ]);
        const orderStatusCount = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        };
        const productCategories = await getInventories({
            categories,
            ProductsCount,
        });
        const stockAvailablity = {
            inStock: ProductsCount - outOfStockProductsCount,
            outOFStock: outOfStockProductsCount,
        };
        const grossIncome = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const discountCost = allOrders.reduce((total, order) => total + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((total, order) => total + (order.shippingCharges || 0), 0);
        const burntCost = allOrders.reduce((total, order) => total + (order.tax || 0), 0);
        // assuming 12% money of grossIncome spend on marketing
        const marketingCost = Math.round(grossIncome * (12 / 100));
        const netMargin = (grossIncome - discountCost - productionCost - burntCost - marketingCost);
        const revenueDistribution = {
            netMargin,
            grossIncome,
            discountCost,
            productionCost,
            burntCost,
            marketingCost,
        };
        const userAgeGroup = {
            teen: allUsers.filter((i) => i.age < 18).length,
            adult: allUsers.filter((i) => i.age >= 18 && i.age < 40).length,
            old: allUsers.filter((i) => i.age >= 40).length,
        };
        const adminCustomer = {
            admin: adminUserCount,
            customer: customerUserCount,
        };
        charts = {
            orderStatusCount,
            productCategories,
            stockAvailablity,
            revenueDistribution,
            userAgeGroup,
            adminCustomer,
        };
        nodeCache.set(key, JSON.stringify(charts));
        //  else blcok end  
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
export const getBarCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-bar-charts";
    if (nodeCache.has(key))
        charts = JSON.parse(nodeCache.get(key));
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const sixMonthProductPromise = Product.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");
        const sixMonthUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");
        const twelveMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");
        const [products, users, orders] = await Promise.all([
            sixMonthProductPromise,
            sixMonthUsersPromise,
            twelveMonthOrdersPromise,
        ]);
        const productCounts = getChartData({ length: 6, today, docArr: products });
        const usersCounts = getChartData({ length: 6, today, docArr: users });
        const ordersCounts = getChartData({ length: 12, today, docArr: orders });
        charts = {
            users: usersCounts,
            products: productCounts,
            orders: ordersCounts,
        };
        nodeCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
export const getLineCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-line-charts";
    if (nodeCache.has(key))
        charts = JSON.parse(nodeCache.get(key));
    else {
        const today = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const baseQuery = {
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today,
            },
        };
        const [products, users, orders] = await Promise.all([
            Product.find(baseQuery).select("createdAt"),
            User.find(baseQuery).select("createdAt"),
            Order.find(baseQuery).select(["createdAt", "discount", "total"]),
        ]);
        const productCounts = getChartData({ length: 12, today, docArr: products });
        const usersCounts = getChartData({ length: 12, today, docArr: users });
        const discount = getChartData({
            length: 12,
            today,
            docArr: orders,
            property: "discount",
        });
        const revenue = getChartData({
            length: 12,
            today,
            docArr: orders,
            property: "total",
        });
        charts = {
            users: usersCounts,
            products: productCounts,
            discount,
            revenue,
        };
        nodeCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
