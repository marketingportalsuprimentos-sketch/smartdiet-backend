// src/routes/water.routes.ts

import { Router } from 'express';
import { WaterController } from '../controllers/WaterController';

const waterRoutes = Router();
const waterController = new WaterController();

waterRoutes.post('/', waterController.logWater);

export { waterRoutes };