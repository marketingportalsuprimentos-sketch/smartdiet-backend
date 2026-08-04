// src/services/EmailService.ts

import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 465,
      secure: true, // Obrigatório true para a porta 465 (SSL)
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const mailOptions = {
      from: `"Smart Diet" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Recuperação de Senha - Smart Diet',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #10b981; text-align: center; font-size: 24px;">Smart<span style="color: #0f172a;">Diet</span></h2>
          <p style="color: #334155; font-size: 16px;">Olá,</p>
          <p style="color: #334155; font-size: 16px;">Você solicitou a recuperação de senha da sua conta. Aqui está o seu código de verificação de 6 dígitos:</p>
          <div style="background: #f1f5f9; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px;">
            <span style="letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #0f172a;">${token}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">Este código é válido por <strong>15 minutos</strong>.</p>
          <p style="color: #64748b; font-size: 14px;">Se você não solicitou essa alteração, por favor ignore este e-mail.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erro ao enviar e-mail via SMTP:', error);
      throw new Error('Falha no disparo do e-mail.');
    }
  }
}