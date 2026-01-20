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

const clientApiKey = process.env.CLIENT_API_KEY
const geminiKey = process.env.GEMINI_API_KEY

if (!geminiKey) {
  throw new Error('GEMINI_API_KEY not set')
}

const genAI = new GoogleGenerativeAI(geminiKey)

app.post('/api/consultoria', async (req: Request, res: Response) => {
  try {
    if (clientApiKey) {
      const apiKey = req.header('x-api-key')
      if (apiKey !== clientApiKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' })
      }
    }

    const { message, history } = req.body as {
      message?: string
      history?: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const modelName = 'gemini-1.5-flash-latest' // Using the unified model

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: UNIFIED_AGENT_PROMPT,
    })

    const chat = model.startChat({
      history: history || [],
    })

    const result = await chat.sendMessage(message)
    const response = result.response.text()

    console.log('Final Response:', response)

    return res.json({ reply: response })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
