import { PrismaClient } from '@prisma/client';

export const dbConfigurada = Boolean(process.env.DATABASE_URL);
export const prisma = new PrismaClient();
