// src/controllers/DashboardController.ts

import { Request, Response } from 'express';
import { prisma } from '../server';
import { MetabolicCalculatorService } from '../services/MetabolicCalculatorService';

export class DashboardController {
  async getDailySummary(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) return res.status(400).json({ error: 'O patientId é obrigatório na URL.' });

      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });

      const calculator = new MetabolicCalculatorService();
      const targets = calculator.calculateGoal(patient);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const meals = await prisma.meal.findMany({
        where: { patientId, loggedAt: { gte: startOfDay, lte: endOfDay } },
      });

      const consumed = meals.reduce(
        (acc, meal) => {
          acc.calories += Number(meal.calories) || 0;
          acc.proteinG += Number(meal.proteinG) || 0;
          acc.carbsG += Number(meal.carbsG) || 0;
          acc.fatG += Number(meal.fatG) || 0;
          return acc;
        },
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
      );

      const loggedMealTypes = Array.from(new Set(meals.map(meal => meal.type)));

      const waterLogs = await prisma.waterLog.findMany({
        where: { patientId, loggedAt: { gte: startOfDay, lte: endOfDay } },
      });
      
      const waterConsumedMl = waterLogs.reduce((acc, log) => acc + (Number(log.amountMl) || 0), 0);

      return res.json({ consumed, targets, loggedMealTypes, waterConsumedMl });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao buscar o resumo diário.' });
    }
  }

  // NOVO MÉTODO: Agrupa histórico por dia
  async getHistory(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) return res.status(400).json({ error: 'O patientId é obrigatório.' });

      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });

      const calculator = new MetabolicCalculatorService();
      const targets = calculator.calculateGoal(patient);

      // Busca tudo
      const meals = await prisma.meal.findMany({ where: { patientId } });
      const waterLogs = await prisma.waterLog.findMany({ where: { patientId } });

      // Agrupa por data (YYYY-MM-DD)
      const historyMap: Record<string, { date: string, calories: number, waterMl: number }> = {};

      meals.forEach(m => {
        const d = m.loggedAt.toISOString().split('T')[0];
        if (!historyMap[d]) historyMap[d] = { date: d, calories: 0, waterMl: 0 };
        historyMap[d].calories += Number(m.calories) || 0;
      });

      waterLogs.forEach(w => {
        const d = w.loggedAt.toISOString().split('T')[0];
        if (!historyMap[d]) historyMap[d] = { date: d, calories: 0, waterMl: 0 };
        historyMap[d].waterMl += Number(w.amountMl) || 0;
      });

      // Converte mapa em array e ordena do mais recente pro mais antigo
      const historyArray = Object.values(historyMap).sort((a, b) => b.date.localeCompare(a.date));

      return res.json({ history: historyArray, targets });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar histórico de progresso.' });
    }
  }
}