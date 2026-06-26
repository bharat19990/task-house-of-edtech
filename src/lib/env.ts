import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/collab-editor'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
});

const serverEnvSchema = z.object({
  WS_SERVER_URL: z.string().default('ws://localhost:1234'),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_WS_SERVER_URL: z.string().default('ws://localhost:1234'),
});

export function getServerEnv() {
  const parsed = envSchema.merge(serverEnvSchema).safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables');
  }
  return parsed.data;
}

export function getClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_WS_SERVER_URL: process.env.NEXT_PUBLIC_WS_SERVER_URL,
  });
  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }
  return parsed.data;
}

export type ServerEnv = ReturnType<typeof getServerEnv>;
export type ClientEnv = ReturnType<typeof getClientEnv>;
