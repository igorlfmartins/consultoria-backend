
import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import 'dotenv/config';
import { UNIFIED_AGENT_PROMPT, TONE_INSTRUCTIONS } from './agents.js';

export function setupLiveProxy(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const host = request.headers.host || 'localhost';
      const url = new URL(request.url || '', `http://${host}`);

      if (url.pathname === '/api/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.error('WebSocket upgrade error:', err);
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Live mode client connected');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      ws.close(1011, 'API Key not configured');
      return;
    }

    // Gemini Multimodal Live WebSocket URL
    const googleUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.MultimodalLive?key=${apiKey}`;
    
    const googleWs = new WebSocket(googleUrl);

    googleWs.on('open', () => {
      console.log('Connected to Gemini Live API');
    });

    googleWs.on('message', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    googleWs.on('error', (err) => {
      console.error('Gemini Live API error:', err);
      ws.close(1011, 'Gemini API Error');
    });

    googleWs.on('close', () => {
      console.log('Gemini Live API connection closed');
      ws.close();
    });

    ws.on('message', (data) => {
      if (googleWs.readyState === WebSocket.OPEN) {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.setup) {
            // Inject system instruction securely
            const systemInstruction = `${UNIFIED_AGENT_PROMPT}\n\n${TONE_INSTRUCTIONS.level1}\n\nIMPORTANT: You are in Voice Mode. Keep responses concise and conversational.`;
            
            msg.setup.system_instruction = {
              parts: [{ text: systemInstruction }]
            };
            
            // Re-serialize with injected prompt
            const newMsg = JSON.stringify(msg);
            googleWs.send(newMsg);
            return;
          }
        } catch (e) {
          // Ignore parse errors, just forward raw data (e.g. audio chunks)
        }
        
        googleWs.send(data);
      }
    });

    ws.on('error', (err) => {
      console.error('Frontend WebSocket error:', err);
      googleWs.close();
    });

    ws.on('close', () => {
      console.log('Frontend WebSocket closed');
      googleWs.close();
    });
  });
}
