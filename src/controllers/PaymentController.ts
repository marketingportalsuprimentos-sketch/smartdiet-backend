// src/controllers/PaymentController.ts

import { Request, Response } from 'express';
import { prisma } from '../server';
import { AsaasService } from '../services/AsaasService';

const PLAN_PRICES = {
  MONTHLY: 29.90,
  QUARTERLY: 79.90,
  ANNUAL: 199.90,
};

export class PaymentController {
  async createSubscription(req: Request, res: Response) {
    try {
      const { patientId, plan } = req.body;

      if (!['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(plan)) {
        return res.status(400).json({ error: 'Plano inválido.' });
      }

      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });

      const asaasService = new AsaasService();
      let customerId = patient.asaasCustomerId;

      if (!customerId) {
        const customer = await asaasService.createCustomer(patient.name, patient.email);
        customerId = customer.id;
        
        await prisma.patient.update({
          where: { id: patientId },
          data: { asaasCustomerId: customerId }
        });
      }

      const value = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
      const payment = await asaasService.createPayment(
        customerId as string, 
        value, 
        `Assinatura Smart Diet - ${plan}`
      );

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      await prisma.subscription.create({
        data: {
          patientId,
          asaasPaymentId: payment.id,
          plan,
          status: 'PENDING',
          dueDate
        }
      });

      return res.json({
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        pixPayload: payment.pixCopiaECola // Se você for usar copia e cola nativo no app futuramente
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message || 'Erro ao gerar pagamento.' });
    }
  }

  // Recebe o retorno instantâneo do Asaas quando o Pix é pago
  async webhook(req: Request, res: Response) {
    try {
      const { event, payment } = req.body;

      if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        const sub = await prisma.subscription.findUnique({
          where: { asaasPaymentId: payment.id }
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'RECEIVED' }
          });

          await prisma.patient.update({
            where: { id: sub.patientId },
            data: { isPremium: true }
          });
        }
      }

      return res.json({ received: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro no Webhook' });
    }
  }
}