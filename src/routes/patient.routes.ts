// src/routes/patient.routes.ts

import { Router } from 'express';
import { PatientController } from '../controllers/PatientController';
import { WeightHistoryController } from '../controllers/WeightHistoryController';

const patientRoutes = Router();
const patientController = new PatientController();
const weightHistoryController = new WeightHistoryController();

patientRoutes.post('/', patientController.create);
patientRoutes.post('/login', patientController.login);

// ESTAS SÃO AS DUAS ROTAS QUE ESTÃO FALTANDO OU NÃO FORAM SALVAS:
patientRoutes.post('/forgot-password', patientController.forgotPassword); 
patientRoutes.post('/reset-password', patientController.resetPassword);   

patientRoutes.put('/:id', patientController.update);
patientRoutes.get('/:id', patientController.getById);
patientRoutes.get('/:id/meals', patientController.getMeals);

patientRoutes.post('/:patientId/weight', weightHistoryController.create);
patientRoutes.get('/:patientId/weight-history', weightHistoryController.list);

export { patientRoutes };