# lmage-based-Animal-Type-Classification-for-cattle-and-buffaloes
This project focuses on classifying animals as cattle or buffaloes using image-based machine learning integrated with the MERN technology stack (MongoDB, Express.js, React.js, Node.js). Users can upload an animal image through a React-based web interface.

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file and set your Gemini API key. The server supports these env var names (in order): `API_KEY`, `GEMINI_API_KEY`, or `GOOGLE_API_KEY`. Example: `API_KEY=ya29_xxx`. Optionally you can set `GEMINI_NEXT_GEN_API_BASE_URL` to override the API base URL.
3. Install dependencies and run the app:
   ```bash
   npm install
   npm start
   ```

4. (Optional) Run a small API smoke test after the server is running:
   ```bash
   npm run test:api
   ```

5. (Optional) If your key is valid but you see model-not-found errors, list available models with:
   ```bash
   node scripts/list_models.js
   ```
   You can override models with env vars in `.env.local`:
   - `IMAGE_MODEL` (default: `models/gemini-flash-latest`)
   - `TEXT_MODEL` (default: `models/gemini-pro-latest`)
   If you need to change the Gemini API base URL (rare), set `GEMINI_NEXT_GEN_API_BASE_URL` in `.env.local`.
