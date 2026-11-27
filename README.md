# KhataVoice

Voice-first digital khata (ledger) for Indian kirana shopkeepers. Speak a sale or payment in Hindi / Hinglish, hear it read back, confirm by voice or tap, and it is saved. Nothing is ever saved without confirmation.

Built for the Scaler x Wispr Flow "Build for Bharat" hackathon, theme: voice-first tools for India (Small business).

## Run (one command)

    docker compose up

Open http://localhost:8080 (no secret keys needed). Without Docker you can also open `index.html` through any static server.

## How voice works
- **Wispr Flow:** the "Bolo" box is always focused. Dictate into it with Wispr Flow, press Enter, done.
- **Fallback mic button:** browser Web Speech API (hi-IN, en-IN, kn-IN). Needs Chrome/Edge and mic permission.
- **Offline parser (default):** `parser.js` handles Hindi number words ("paanch sau", "do hazaar"), fillers and Devanagari. No key needed.
- **Optional AI mode:** tap the small status line to paste your own key. If the key is missing it shows "Key not set" and uses the offline parser.

## Try these
- Ramesh ne 450 ka saman liya, 200 diya, baaki udhaar
- Ramesh ne 100 diye
- Ramesh ka kitna baaki hai
- Aaj ki bikri kitni hui
- Sabse zyada udhaar kiska hai

## Safety
Never auto-saves. Missing name or amount triggers a spoken follow-up. Uncertain fields are highlighted "check". The original spoken text is stored with every entry.

## Files
`index.html`, `style.css`, `parser.js` (rules), `app.js` (UI, speech, storage, WhatsApp reminders), `docker-compose.yml` (nginx).
Data is kept in the browser's localStorage, so it works offline and never leaves the device.

## 60-second demo
1. Say "Ramesh ne 450 ka saman liya, 200 diya, baaki udhaar". Hear the read-back, say "haan".
2. Say "Ramesh ka kitna baaki hai". Hear the answer.
3. Open Khata, tap Remind on Ramesh to open the WhatsApp message.
4. Open Hisaab, tap the read-out button for the daily summary.
