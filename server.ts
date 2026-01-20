// Backend for Consultoria de Negocios - Railway v1.0.3
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'
import 'dotenv/config'
import { UNIFIED_AGENT_PROMPT } from './agents.js'

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
    const { message, history } = req.body as {
      message?: string
      history?: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const modelName = 'gemini-1.5-flash'

    const model = genAI.getGenerativeModel(
      {
        model: modelName,
      },
      {
        apiVersion: 'v1',
      }
    )

    // Prepend system instruction to history as a user-model turn
    // This is a workaround for API v1 not supporting systemInstruction in the top-level config
    const systemContext = [
      {
        role: 'user',
        parts: [{ text: `INSTRUÇÕES DO SISTEMA:\n\n${UNIFIED_AGENT_PROMPT}` }],
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Seguirei essas instruções para atuar como o consultor de negócios.' }],
      },
    ]

    const chat = model.startChat({
      history: [...systemContext, ...(history || [])],
    })

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
