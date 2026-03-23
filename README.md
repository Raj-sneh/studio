# Sargam AI

Sargam is an interactive, AI-powered web application designed to make piano learning engaging and accessible. Built with a modern tech stack, it serves as a personal piano tutor, offering a suite of tools for practice, learning, and creative composition.

## ✨ Features

- **🎹 Virtual Piano**: High-quality Salamander Grand Piano samples for practice and recording.
- **🎼 Interactive Lessons**: Learn classics and rhymes with real-time feedback and visual demos.
- **🎙️ Vocal Studio**: High-fidelity AI speech and singing powered by **Resemble.ai**.
- **👥 Voice Cloner**: Instant AI voice cloning using a custom Python inference engine.
- **🤖 SKV AI Assistant**: A friendly helper to guide you through the app and answer questions.

## 🚀 Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, ShadCN UI.
- **AI Backend**: Genkit (Google AI / Gemini 2.5 Flash), Resemble.ai API.
- **Voice Engine**: Flask (Python), librosa, gTTS (runs on port 8080).
- **Database**: Firebase (Auth, Firestore).

## 🛠️ Configuration Guide

To fully unlock the AI features, you need to set up your environment variables in a `.env` file:

### 🎙️ Resemble.ai (Vocal Studio)
1. **API Key**: Get this from your Resemble.ai Account Settings.
2. **Project ID**: Found in the URL of your Resemble project (`app.resemble.ai/projects/<ID>`).
3. **Voice IDs**: Map your specific Resemble Voice UUIDs to the environment variables:
   - `RESEMBLE_VOICE_CLIVE_ID`
   - `RESEMBLE_VOICE_CLARA_ID`
   - `RESEMBLE_VOICE_JAMES_ID`

### 👥 Voice Cloner (Python Engine)
1. Ensure you have Python installed.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run the engine: `python app.py`.
4. The Next.js app will connect to `http://127.0.0.1:8080/clone`.

## 🔧 Getting Started

1. **Install Frontend**: `npm install`
2. **Run Frontend**: `npm run dev`
3. **Run Voice Engine**: `python app.py` (in a separate terminal)
