import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
    res.send('bot is running');
});

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
