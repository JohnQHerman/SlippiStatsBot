import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req: Request, res: Response) => {
    res.send('bot is running');
});

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
