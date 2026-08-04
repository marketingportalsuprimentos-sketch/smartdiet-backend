// src/services/AsaasService.ts

export class AsaasService {
  private readonly baseUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
  private readonly apiKey = process.env.ASAAS_API_KEY || '';

  async createCustomer(name: string, email: string) {
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey
      },
      body: JSON.stringify({ name, email })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
    
    return data;
  }

  async createPayment(customerId: string, value: number, description: string) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // Vencimento padrão de 3 dias para Pix
    
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: value,
        dueDate: dueDate.toISOString().split('T')[0],
        description: description
      })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas');
    
    return data;
  }
}