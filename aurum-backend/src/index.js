const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.get('/api/healthz', (req, res) => res.json({ ok: true, timestamp: new Date() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
