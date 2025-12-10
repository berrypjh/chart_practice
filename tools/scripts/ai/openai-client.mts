import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'node:path';

export const createOpenAIClient = (scriptName: string): OpenAI => {
  const root = import.meta.dirname;

  dotenv.config({
    path: path.resolve(root, '../../../.env'),
    override: true,
  });

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error(`[${scriptName}] OPENAI_API_KEY가 설정되지 않았습니다. 루트 .env를 확인하세요.`);
    process.exit(1);
  }

  return new OpenAI({ apiKey });
};

export const getOpenAIModel = (): string => {
  return process.env.OPENAI_MODEL || 'gpt-4.1-mini';
};
