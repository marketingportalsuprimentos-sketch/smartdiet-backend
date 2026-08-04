// src/routes/meal.routes.ts

import { Router } from 'express';
import multer from 'multer';
import { MealController } from '../controllers/MealController';

const mealRoutes = Router();
const mealController = new MealController();
const upload = multer({ storage: multer.memoryStorage() });

// Rota para analisar a foto (recebe a imagem em FormData)
mealRoutes.post('/analyze', upload.single('photo'), mealController.analyze);

// Rota para salvar no banco de dados (recebe JSON puro)
mealRoutes.post('/', mealController.create);

export { mealRoutes };