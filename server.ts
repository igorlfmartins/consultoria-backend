// Backend for Consultoria de Negocios - Railway v1.0.3
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import 'dotenv/config'
import { UNIFIED_AGENT_PROMPT, TONE_INSTRUCTIONS } from './agents.js'
import {
  SALES_AGENT_PROMPT,
  MARKETING_AGENT_PROMPT,
  FINANCE_AGENT_PROMPT,
  MANAGEMENT_AGENT_PROMPT,
  TECH_AGENT_PROMPT,
} from './agents_specialized.js'

// Placeholder for agent system instructions - will be managed dynamically

const app = express()

// Security Middleware: Helmet (Secure Headers)
app.use(helmet())

// Security Middleware: Rate Limiting (DDoS Protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Muitas requisições deste IP, por favor tente novamente mais tarde.'
})
app.use(limiter)

app.use(cors())
app.use(express.json())

// Input Validation Schema
const consultoriaSchema = z.object({
  message: z.string().min(1, "Message is required"),
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      parts: z.array(z.object({ text: z.string() }))
    })
  ).optional(),
  focus: z.string().nullable().optional(),
  language: z.string().optional(),
  toneLevel: z.number().int().min(1).max(3).optional()
})

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Backend is running! v1.0.7 (Secure)')
})

const geminiKey = process.env.GEMINI_API_KEY

if (!geminiKey) {
  throw new Error('GEMINI_API_KEY not set')
}

const genAI = new GoogleGenerativeAI(geminiKey)

app.post('/api/consultoria', async (req: Request, res: Response) => {
  try {
    // Validate Input with Zod
    const validationResult = consultoriaSchema.safeParse(req.body)

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.format() })
    }

    const { message, history, focus, language, toneLevel } = validationResult.data

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
      'vendas': SALES_AGENT_PROMPT,
      'marketing': MARKETING_AGENT_PROMPT,
      'financas': FINANCE_AGENT_PROMPT,
      'gestao': MANAGEMENT_AGENT_PROMPT,
      'tecnologia': TECH_AGENT_PROMPT,
    }

    // Determine base prompt based on focus
    let basePrompt = UNIFIED_AGENT_PROMPT
    const normalizedFocus = focus ? focus.toLowerCase() : null
    
    if (normalizedFocus && PROMPT_MAP[normalizedFocus]) {
      basePrompt = PROMPT_MAP[normalizedFocus]
    } else if (focus) {
      console.warn(`Focus area '${focus}' not found in PROMPT_MAP. Using default prompt.`)
    }

    // Determine tone instruction
    const selectedTone = toneLevel === 1 ? TONE_INSTRUCTIONS.level1 :
                         toneLevel === 2 ? TONE_INSTRUCTIONS.level2 :
                         TONE_INSTRUCTIONS.level3 // Default to Brutal (Level 3)

    const finalSystemInstruction = `${basePrompt}\n\n${selectedTone}`

    // Use systemInstruction for more reliable persona adherence (Gemini SDK native support)
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: {
        role: 'system',
        parts: [{ text: `${finalSystemInstruction}\n\nIMPORTANT: You must answer strictly in ${targetLanguage}.` }],
      }
    })

    const chat = model.startChat({
      history: history || [],
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
    return res.status(500).json({ error: message, reply: `Erro interno no backend: ${message}` })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
