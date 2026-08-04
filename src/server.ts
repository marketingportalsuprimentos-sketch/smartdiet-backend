// src/server.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { routes } from './routes';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

app.get('/health', (req, res) => {
  return res.json({ status: 'API Online', timestamp: new Date() });
});

const PORT = process.env.PORT || 3334;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});