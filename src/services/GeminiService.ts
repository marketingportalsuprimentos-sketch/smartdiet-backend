// src/services/GeminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  async analyzeMealImage(mimeType: string, imageBase64: string) {
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDKe3zqtHGH9ZB-h3upD8z9JRkfe8DgPLM";
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não encontrada.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // SOLUÇÃO: Passamos a configuração 'responseMimeType' forçando a saída estrita em JSON
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // Prompt ajustado usando exemplos numéricos literais para a IA não se confundir
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
      
      // Como o modelo agora é obrigado a devolver um JSON válido nativamente,
      // não precisamos mais de regex ou replace para limpar blocos Markdown.
      return JSON.parse(responseText);
    } catch (error) {
      console.error("Falha interna na comunicação com a API Gemini:", error);
      throw new Error("Erro na comunicação com a IA.");
    }
  }
}