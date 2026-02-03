import {
  SALES_AGENT_PROMPT,
  MARKETING_AGENT_PROMPT,
  FINANCE_AGENT_PROMPT,
  MANAGEMENT_AGENT_PROMPT,
  TECH_AGENT_PROMPT,
} from './agents_specialized.js';

export const LANGUAGE_MAP: Record<string, string> = {
  'en': 'English',
  'pt': 'Portuguese (Brazil)',
  'es': 'Spanish',
};

export const PROMPT_MAP: Record<string, string> = {
  'vendas': SALES_AGENT_PROMPT,
  'marketing': MARKETING_AGENT_PROMPT,
  'financas': FINANCE_AGENT_PROMPT,
  'gestao': MANAGEMENT_AGENT_PROMPT,
  'tecnologia': TECH_AGENT_PROMPT,
};

export const MODEL_NAME = 'gemini-3-flash-preview';
