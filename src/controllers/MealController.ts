// src/controllers/MealController.ts

import { Request, Response } from 'express';
import { prisma } from '../server';
import { GeminiService } from '../services/GeminiService';

export class MealController {
  
  // 1. Apenas analisa a foto via IA e devolve os dados para o celular (Sem salvar)
  async analyze(req: Request, res: Response) {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'A foto da refeição é obrigatória.' });
      }

      const base64Image = file.buffer.toString('base64');
      const mimeType = file.mimetype;
      const geminiService = new GeminiService();
      
      let aiAnalysis;
      try {
        aiAnalysis = await geminiService.analyzeMealImage(mimeType, base64Image);
      } catch (aiError) {
        console.error('Erro na análise da IA:', aiError);
        return res.status(502).json({ error: 'Falha ao analisar a imagem com a Inteligência Artificial.' });
      }

      return res.status(200).json({ analysis: aiAnalysis });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao analisar a refeição.' });
    }
  }

  // 2. Salva a refeição no banco após o paciente ajustar as quantidades no app
  async create(req: Request, res: Response) {
    try {
      const { patientId, type, calories, proteinG, carbsG, fatG, foodDetails, coachMessage } = req.body;

      if (!patientId || !type) {
        return res.status(400).json({ error: 'patientId e type são obrigatórios.' });
      }

      const meal = await prisma.meal.create({
        data: {
          patientId,
          type,
          photoUrl: null, 
          calories,
          proteinG,
          carbsG,
          fatG,
          foodDetails,
          coachMessage
        }
      });

      return res.status(201).json({ meal });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao registrar refeição.' });
    }
  }
}