# Sargam AI  

Sargam is an interactive, AI-powered web application designed to make piano learning engaging and accessible. Built with a modern tech stack, it serves as a personal piano tutor, offering a suite of tools for practice, learning, and creative composition.

## ✨ Features

- **🎹 Virtual Piano**: High-quality Salamander Grand Piano samples for practice and recording.
- **🎼 Interactive Lessons**: Learn classics and rhymes with real-time feedback and visual demos.
- **🎙️ Vocal Studio**: High-fidelity AI speech and singing powered by **ElevenLabs**.
- **👥 Voice Cloner**: Instant AI voice cloning using ElevenLabs and SKV AI (Gemini 2.5 Flash).
- **🤖 SKV AI Assistant**: A friendly helper to guide you through the app and answer questions.

## 🚀 Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, ShadCN UI.
- **AI Backend**: Genkit (Google AI / Gemini 2.5 Flash), ElevenLabs API.
- **Voice Engine**: Flask (Python), librosa, FFmpeg (for vocal separation and mixing).
- **Database**: Firebase (Auth, Firestore).

## 🔧 Configuration Guide

To fully unlock the AI features, you need to set up your environment variables in a `.env` file:

### 🎙️ ElevenLabs (Vocal Studio & Cloner)
1. **ELEVENLABS_API_KEY**: Your API key from the ElevenLabs dashboard.
2. **VOICE_ENGINE_URL**: The URL of your Python Voice Engine (e.g., `http://127.0.0.1:8080`).

## 🔧 Getting Started

1. **Install Frontend**: `npm install`
2. **Run Frontend**: `npm run dev`
3. **Run Voice Engine**: `python app.py` (in a separate terminal)
