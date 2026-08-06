// src/services/GeminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  async analyzeMealImage(mimeType: string, imageBase64: string) {
    // A chave deve vir exclusivamente do ambiente (Render / .env)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Atualizado para a versão vigente identificada na documentação
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `Você é um nutricionista especialista. Analise a imagem desta refeição e identifique cada alimento individualmente.
    Responda OBRIGATORIAMENTE usando esta estrutura JSON exata (certifique-se de usar aspas duplas nas chaves):
    {
      "items": [
        {
          "name": "Nome do alimento (ex: Arroz Branco)",
          "calories": 100,
          "proteinG": 2,
          "carbsG": 20,
          "fatG": 1
        }
      ],
      "coachMessage": "Mensagem motivacional curta sobre o prato em português."
    }`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType
          }
        }
      ]);

      const responseText = result.response.text();
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error("Falha interna na comunicação com a API Gemini:", error);
      throw new Error("Erro na comunicação com a IA.");
    }
  }
}