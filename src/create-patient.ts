import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetId = '42a6e929-5131-4864-9570-5ac91d44669d';
  
  // Verifica se por acaso já foi criado
  const existingPatient = await prisma.patient.findUnique({
    where: { id: targetId }
  });

  if (existingPatient) {
    console.log('O paciente de teste já existe no banco de dados!');
    return;
  }

  // Força a criação com o ID exato
  const patient = await prisma.patient.create({
    data: {
      id: targetId,
      name: 'Paciente de Teste IA',
      email: 'teste.ia@dieta.com',
      password: 'senha_criptografada_falsa',
      birthDate: new Date('1982-12-30T00:00:00Z'),
      gender: 'MALE',
      heightCm: 180,
      currentWeightKg: 85,
      goalWeightKg: 75,
      activityLevel: 'SEDENTARY',
      isPremium: true
    },
  });

  console.log('✅ Paciente criado com sucesso! ID:', patient.id);
}

main()
  .catch((e) => {
    console.error('Erro ao criar paciente:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });