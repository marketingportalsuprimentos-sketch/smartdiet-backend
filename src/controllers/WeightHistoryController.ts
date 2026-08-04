// src/controllers/WeightHistoryController.ts

import { Request, Response } from 'express';
import { prisma } from '../server';

export class WeightHistoryController {
  async create(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const { weightKg } = req.body;

      if (!weightKg) {
        return res.status(400).json({ error: 'O peso é obrigatório.' });
      }

      // Salva o registro histórico
      const history = await prisma.weightHistory.create({
        data: {
          patientId,
          weightKg: Number(weightKg),
        }
      });

      // Atualiza o peso principal do paciente
      await prisma.patient.update({
        where: { id: patientId },
        data: { currentWeightKg: Number(weightKg) }
      });

      return res.status(201).json(history);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao registrar evolução de peso.' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      
      const history = await prisma.weightHistory.findMany({
        where: { patientId },
        orderBy: { loggedAt: 'asc' }, // Do mais antigo pro mais novo para formar o gráfico
      });

      return res.json(history);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar histórico de peso.' });
    }
  }
}