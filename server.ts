import { localApiOnly } from './local-api-guard.mjs';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

async function startServer() {
  const app = express();
app.use('/api', localApiOnly(() => PORT));
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Tools
  const updateMapViewport: FunctionDeclaration = {
    name: 'updateMapViewport',
    description: 'Update the map viewport to a new center and zoom level, and optionally drop a marker. Use this when the user asks to see a location, or asks about a place that you want to highlight on the map.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER, description: 'Latitude' },
        lng: { type: Type.NUMBER, description: 'Longitude' },
        zoom: { type: Type.NUMBER, description: 'Zoom level (typically 12-16)' },
        title: { type: Type.STRING, description: 'Optional name of the place. Leave empty if just changing viewport without highlighting a specific place.' }
      },
      required: ['lat', 'lng', 'zoom'],
    },
  };

  const getMapCenter: FunctionDeclaration = {
    name: 'getMapCenter',
    description: 'If you are unsure where the user currently is or where they are looking on the map, use this to get the current coordinates and zoom.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  };

  /**
   * Endpoint to handle chat from the user.
   */
  app.post('/api/chat', async (req, res) => {
    try {
      const { history, message, currentViewport } = req.body;
      let contents = [];

      // Start with system instruction + context as a user initial message
      const systemMsg = `You are a helpful map assistant. Your job is to answer questions using map data and Google Search. 
Use the googleSearch tool to find accurate and up to date information.
If the user asks about a general area or specific place, you MUST call 'updateMapViewport' to show it to them on the map.
If you need to know where the user is looking on the map currently, use getMapCenter.
CURRENT MAP VIEWPORT: Lat ${currentViewport?.lat}, Lng ${currentViewport?.lng}, Zoom ${currentViewport?.zoom}`;

      contents.push({ role: 'user', parts: [{ text: systemMsg }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood. I will help the user.' }] });

      // Add actual history
      for (const m of history) {
        if (m.role && m.parts) {
           contents.push(m);
        }
      }

      // Add the latest message
      contents.push({ role: 'user', parts: [{ text: message }] });

      const modelOptions = {
        model: 'gemini-3.5-flash',
        contents,
        tools: [
          { googleSearch: {} },
          { functionDeclarations: [updateMapViewport, getMapCenter] }
        ],
        toolConfig: { includeServerSideToolInvocations: true },
      };

      const response = await ai.models.generateContent(modelOptions);
      
      const functionCalls = response.functionCalls || [];
      const textOutput = response.text || '';
      
      const callsToReturn = functionCalls.map(c => ({
        name: c.name,
        args: c.args
      }));

      // In a real application, the model might require us to respond to its function call 
      // but simpler for now is to just return what the model said + what it wants the frontend to execute.
      res.json({
         text: textOutput,
         functionCalls: callsToReturn,
         hasSearchGrounding: response.candidates?.[0]?.groundingMetadata ? true : false,
         raw: response.candidates?.[0]
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
