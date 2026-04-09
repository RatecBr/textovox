import { Request, Response } from 'express';
import { TTSOrchestrator } from '../services/TTSOrchestrator';

const orchestrator = new TTSOrchestrator();

export class TTSController {
  static async preview(req: Request, res: Response) {
    try {
      const { text, controls, voice } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      // Default controls if not provided
      const finalControls = {
        pitch: 0,
        rate: 1.0,
        volume: 0,
        timbre: 0,
        intensity: 0.5,
        humanization: 0.3,
        pause_before: 0,
        provider: 'openai', // Default to OpenAI
        voice, // Pass the voice ID explicitly
        ...controls
      };

      const result = await orchestrator.generatePreview(text, finalControls);
      
      // Set headers for streaming
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Transfer-Encoding', 'chunked');
      
      // If we used SSML (mock), we might want to send it in header since body is stream
      // But for OpenAI we use raw text usually. 
      // If orchestrator fell back to mock, it generated SSML.
      // We can't easily get the SSML string here if orchestrator returns just stream.
      // We'll skip SSML debug in headers for now or rely on orchestrator logs.

      if (result.stream && typeof result.stream.pipe === 'function') {
        result.stream.pipe(res);
      } else if (result.stream) {
        // It might be a web stream or something else if our conversion logic failed or if it's already a buffer?
        // If it's a web stream and we are in Node, we should have converted it.
        // Let's try to handle if it's an async iterable (Node streams are async iterable)
        for await (const chunk of result.stream) {
          res.write(chunk);
        }
        res.end();
      } else {
        throw new Error('No stream returned from orchestrator');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      // If headers sent, we can't send JSON error
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }
}
