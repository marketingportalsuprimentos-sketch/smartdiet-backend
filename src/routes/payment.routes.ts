// src/routes/payment.routes.ts

import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';

const paymentRoutes = Router();
const paymentController = new PaymentController();

paymentRoutes.post('/subscribe', paymentController.createSubscription);
paymentRoutes.post('/webhook', paymentController.webhook);

export { paymentRoutes };