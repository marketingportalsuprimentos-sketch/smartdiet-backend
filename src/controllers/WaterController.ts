// src/controllers/WaterController.ts

import { Request, Response } from 'express';
import { prisma } from '../server';

export class WaterController {
  async logWater(req: Request, res: Response) {
    try {
      const { patientId, amountMl } = req.body;
      
      if (!patientId || amountMl === undefined) {
        return res.status(400).json({ error: 'patientId e amountMl são obrigatórios.' });
      }

      const water = await prisma.waterLog.create({
        data: { 
          patientId, 
          amountMl: Number(amountMl) 
        }
      });

      return res.status(201).json(water);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao registrar consumo de água.' });
    }
  }
}