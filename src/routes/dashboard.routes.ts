// src/routes/dashboard.routes.ts

import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';

const dashboardRoutes = Router();
const dashboardController = new DashboardController();

// A rota final será: GET /dashboard/summary/:patientId
dashboardRoutes.get('/summary/:patientId', dashboardController.getDailySummary);

// NOVA ROTA: GET /dashboard/history/:patientId
dashboardRoutes.get('/history/:patientId', dashboardController.getHistory);

export { dashboardRoutes };