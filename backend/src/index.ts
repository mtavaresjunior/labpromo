import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 5172;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err: Error) => console.error('Connection error', err.stack));

import dealRoutes from './routes/deals';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';

// Basic route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

app.use('/api/deals', dealRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
