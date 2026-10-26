# Chalk (Eraser-style docs + diagrams)
npm install && cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev     # http://localhost:3000
npm test
Without a key, /api/diagram falls back to parsing "A -> B -> C" lines.
