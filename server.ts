// Backend for Consultoria de Negocios - Railway v1.0.3
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'
import 'dotenv/config'
import { UNIFIED_AGENT_PROMPT } from './agents.js'
import {
  SALES_AGENT_PROMPT,
  MARKETING_AGENT_PROMPT,
  FINANCE_AGENT_PROMPT,
  MANAGEMENT_AGENT_PROMPT,
  TECH_AGENT_PROMPT,
} from './agents_specialized.js'

// Placeholder for agent system instructions - will be managed dynamically

const app = express()
app.use(cors())
app.use(express.json())

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Backend is running! v1.0.6')
})

const geminiKey = process.env.GEMINI_API_KEY

if (!geminiKey) {
  throw new Error('GEMINI_API_KEY not set')
}

const genAI = new GoogleGenerativeAI(geminiKey)

app.post('/api/consultoria', async (req: Request, res: Response) => {
  try {
    const { message, history, focus, language } = req.body as {
      message?: string
      history?: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>
      focus?: string
      language?: string
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const LANGUAGE_MAP: Record<string, string> = {
      'en': 'English',
      'pt': 'Portuguese (Brazil)',
      'es': 'Spanish',
    }

    const targetLanguage = LANGUAGE_MAP[language || 'en'] || 'English'



    const modelName = 'gemini-2.0-flash'

    // Remove explicit apiVersion to let the SDK handle it (defaults to v1beta or v1 depending on version)
    const model = genAI.getGenerativeModel({
      model: modelName,
    })

    const PROMPT_MAP: Record<string, string> = {
      'Vendas': SALES_AGENT_PROMPT,
      'Marketing e Branding': MARKETING_AGENT_PROMPT,
      'Finanças e Jurídico': FINANCE_AGENT_PROMPT,
      'Gestão e Estratégia': MANAGEMENT_AGENT_PROMPT,
      'Tecnologia e Inovação': TECH_AGENT_PROMPT,
    }

    // Determine system instruction based on focus
    let systemInstruction = UNIFIED_AGENT_PROMPT
    if (focus && PROMPT_MAP[focus]) {
      systemInstruction = PROMPT_MAP[focus]
    }

    // Prepend system instruction to history as a user-model turn
    // This is a workaround for API v1 not supporting systemInstruction in the top-level config
    const systemContext = [
      {
        role: 'user',
        parts: [{ text: `INSTRUÇÕES DO SISTEMA:\n\n${systemInstruction}\n\nIMPORTANT: You must answer strictly in ${targetLanguage}.` }],
      },
      {
        role: 'model',
        parts: [{ text: `Entendido. Atuarei como o consultor especialista solicitado e responderei em ${targetLanguage}.` }],
      },
    ]

    const chat = model.startChat({
      history: [...systemContext, ...(history || [])],
    })

    // If focus is present, we can gently remind the model in the user message too, 
    // but the system prompt switch is the main driver.
    // We keep the original message clean to avoid confusion.
    const result = await chat.sendMessage(message)
    const response = result.response.text()

    console.log('Final Response:', response)

    return res.json({ reply: response })
  } catch (err: any) {
    console.error('consultoria error:', err)
    const message = typeof err?.message === 'string' ? err.message : 'Internal server error'
    return res.json({ reply: `Erro interno no backend: ${message}` })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
