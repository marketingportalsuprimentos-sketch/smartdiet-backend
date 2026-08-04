// src/controllers/PatientController.ts

import { Request, Response } from 'express';
import { prisma } from '../server';
import { MetabolicCalculatorService } from '../services/MetabolicCalculatorService';
import { EmailService } from '../services/EmailService';

type GoalPace = 'SLOW' | 'NORMAL' | 'FAST';
type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
type Gender = 'MALE' | 'FEMALE';

export class PatientController {
  async create(req: Request, res: Response) {
    try {
      const { 
        name, email, password, birthDate, gender, 
        heightCm, currentWeightKg, goalWeightKg, goalPace 
      } = req.body;

      const patientExists = await prisma.patient.findUnique({ where: { email } });

      if (patientExists) {
        return res.status(400).json({ error: 'E-mail já cadastrado.' });
      }

      const parsedBirthDate = new Date(birthDate);

      const patient = await prisma.patient.create({
        data: {
          name, email, password, birthDate: parsedBirthDate, gender,
          heightCm, currentWeightKg, goalWeightKg, 
          goalPace: goalPace || 'NORMAL',
          activityLevel: 'SEDENTARY',
        }
      });

      const calculator = new MetabolicCalculatorService();
      const goals = calculator.calculateGoal({
        birthDate: patient.birthDate,
        gender: patient.gender as Gender,
        heightCm: patient.heightCm,
        currentWeightKg: patient.currentWeightKg,
        goalWeightKg: patient.goalWeightKg,
        goalPace: patient.goalPace as GoalPace,
        activityLevel: patient.activityLevel as ActivityLevel
      });

      return res.status(201).json({ patient, goals });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao criar paciente.' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const patient = await prisma.patient.findUnique({
        where: { email }
      });

      if (!patient) {
        return res.status(404).json({ error: 'E-mail não encontrado.' });
      }

      if (patient.password !== password) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }

      // LÓGICA DO PAYWALL (7 DIAS)
      const trialDays = 7;
      const now = new Date();
      const trialEnd = new Date(patient.trialStartDate);
      trialEnd.setDate(trialEnd.getDate() + trialDays);

      const isTrialExpired = now > trialEnd;
      const requiresPayment = !patient.isPremium && isTrialExpired;

      return res.json({ 
        id: patient.id, 
        name: patient.name,
        requiresPayment 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    console.log("\n=========================================");
    console.log("🔍 INICIANDO RECUPERAÇÃO DE SENHA");
    console.log("📥 Dados recebidos no body:", req.body);
    
    try {
      const { email } = req.body;
      if (!email) {
        console.log("❌ Erro: E-mail não enviado na requisição.");
        return res.status(400).json({ error: 'E-mail obrigatório.' });
      }

      console.log(`🔎 Buscando paciente com e-mail: ${email}`);
      const patient = await prisma.patient.findUnique({ where: { email } });
      
      if (!patient) {
        console.log("❌ Erro: Paciente não encontrado no banco de dados.");
        return res.status(404).json({ error: 'E-mail não cadastrado em nosso sistema.' });
      }

      console.log("✅ Paciente encontrado. Gerando token numérico...");
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 15);

      console.log(`💾 Salvando token ${code} no banco de dados...`);
      await prisma.patient.update({
        where: { email },
        data: { resetToken: code, resetTokenExpires: expires }
      });
      console.log("✅ Token salvo com sucesso!");

      console.log("📧 Tentando disparar e-mail via SMTP...");
      try {
        const emailService = new EmailService();
        await emailService.sendPasswordResetEmail(email, code);
        console.log("✅ E-mail enviado com sucesso pelo SMTP!");
      } catch (emailError) {
        console.error("❌ ERRO GRAVE NO SMTP:", emailError);
        return res.status(500).json({ error: 'Falha no servidor de e-mail. Verifique o terminal.' });
      }

      console.log("🚀 Processo finalizado com sucesso. Retornando 200 OK.");
      console.log("=========================================\n");
      return res.json({ message: 'Código enviado com sucesso.' });
    } catch (error) {
      console.error("❌ ERRO INTERNO NO SERVIDOR (CATCH GERAL):", error);
      return res.status(500).json({ error: 'Erro crítico ao processar solicitação.' });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'E-mail, código e nova senha são obrigatórios.' });
      }

      const patient = await prisma.patient.findUnique({ where: { email } });
      if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });

      if (patient.resetToken !== code) {
        return res.status(400).json({ error: 'Código inválido ou incorreto.' });
      }

      if (!patient.resetTokenExpires || patient.resetTokenExpires < new Date()) {
        return res.status(400).json({ error: 'Este código expirou. Solicite um novo.' });
      }

      await prisma.patient.update({
        where: { email },
        data: {
          password: newPassword,
          resetToken: null,
          resetTokenExpires: null
        }
      });

      return res.json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao redefinir a senha.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { heightCm, currentWeightKg, goalWeightKg, goalPace } = req.body;

      const patient = await prisma.patient.update({
        where: { id },
        data: {
          heightCm: Number(heightCm),
          currentWeightKg: Number(currentWeightKg),
          goalWeightKg: Number(goalWeightKg),
          goalPace: goalPace || 'NORMAL'
        }
      });

      const calculator = new MetabolicCalculatorService();
      const goals = calculator.calculateGoal({
        birthDate: patient.birthDate,
        gender: patient.gender as Gender,
        heightCm: patient.heightCm,
        currentWeightKg: patient.currentWeightKg,
        goalWeightKg: patient.goalWeightKg,
        goalPace: patient.goalPace as GoalPace,
        activityLevel: patient.activityLevel as ActivityLevel
      });

      return res.json({ patient, goals });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao atualizar paciente.' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const patient = await prisma.patient.findUnique({
        where: { id }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Paciente não encontrado.' });
      }

      const calculator = new MetabolicCalculatorService();
      const goals = calculator.calculateGoal({
        birthDate: patient.birthDate,
        gender: patient.gender as Gender,
        heightCm: patient.heightCm,
        currentWeightKg: patient.currentWeightKg,
        goalWeightKg: patient.goalWeightKg,
        goalPace: patient.goalPace as GoalPace,
        activityLevel: patient.activityLevel as ActivityLevel
      });

      return res.json({ patient, goals });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao buscar paciente.' });
    }
  }

  async getMeals(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const meals = await prisma.meal.findMany({
        where: { patientId: id },
        orderBy: { loggedAt: 'desc' }, 
      });
      return res.json(meals);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao buscar histórico de refeições.' });
    }
  }
}