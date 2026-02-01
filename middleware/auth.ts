import { type Request, type Response, type NextFunction } from 'express';
import { supabase } from '../supabase.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header missing' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Bearer token missing' });
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Usuario autenticado com sucesso
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Internal auth error' });
  }
};
