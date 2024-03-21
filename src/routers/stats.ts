import express from "express";
import { isAdmin } from "../middlewares/auth.js";
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from "../controllers/stats.js";

const app = express.Router();


//Route - /api/v1/dashboard/stats
app.get('/stats',isAdmin,getDashboardStats);


//Route - /api/v1/dashboard/pie
app.get('/pie',isAdmin, getPieCharts);

//Route - /api/v1/dashboard/line
app.get('/line', isAdmin, getLineCharts);


//Route - /api/v1/dashboard/bar
app.get('/bar',isAdmin, getBarCharts);


console.log();


export default app;