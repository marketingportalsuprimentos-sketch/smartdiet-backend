// src/routes/index.ts

import { Router } from 'express';
import { patientRoutes } from './patient.routes';
import { mealRoutes } from './meal.routes';
import { dashboardRoutes } from './dashboard.routes';
import { waterRoutes } from './water.routes'; 
import { paymentRoutes } from './payment.routes'; // NOVA IMPORTAÇÃO

const routes = Router();

routes.use('/patients', patientRoutes);
routes.use('/meals', mealRoutes);
routes.use('/dashboard', dashboardRoutes);
routes.use('/water', waterRoutes); 
routes.use('/payments', paymentRoutes); // INJEÇÃO DA ROTA

export { routes };