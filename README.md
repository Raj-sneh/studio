# Sargam AI  

Sargam is an interactive, AI-powered web application designed to make piano learning engaging and accessible. Built with a modern tech stack, it serves as a personal piano tutor, offering a suite of tools for practice, learning, and creative composition.

## ✨ Features

- **🎹 Virtual Piano**: High-quality Salamander Grand Piano samples for practice and recording.
- **🎬 Sargam Studio**: Cinematic AI animation engine with iterative narrative beats.
- **🎙️ Vocal Studio**: High-fidelity AI speech and neural voice replacement.
- **👥 Voice Cloner**: Instant AI voice cloning using ElevenLabs and Gemini 2.5 Flash.
- **🤖 SKV AI Assistant**: A friendly helper to guide you through the app and answer questions.

## 🚀 Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, ShadCN UI.
- **AI Backend**: Genkit (Google AI / Gemini 2.5 Flash), ElevenLabs API.
- **Voice Engine**: FastAPI / Flask (Python), librosa, FFmpeg (for vocal separation and mixing).
- **Database**: Firebase (Auth, Firestore).

## 🔧 Configuration Guide

To fully unlock the AI features, you need to set up your environment variables with your Backend URL.

### 🎙️ Neural Engine (Cloud Run Backend)
The URL of your Python backend. Based on your Cloud Run console, this is the **`sargam-backend`** service.

**How to get the link:**
1. Go to Cloud Run in Google Cloud Console.
2. Click on **`sargam-backend`**.
3. Copy the **URL** at the top of the page.

**Where to set in Google Cloud Run Console:**
1. Select your **frontend** service (likely named `studio`) -> **Edit & Deploy New Revision**.
2. Go to **Variables & Secrets** tab.
3. Add `NEURAL_ENGINE_URL` and `NEXT_PUBLIC_NEURAL_ENGINE_URL` with the copied URL.
4. Click **Deploy**.

**Where to set in Firebase Console (App Hosting):**
1. App Hosting -> [Your App] -> **Settings**.
2. Go to **Environment Variables** section.
3. Add the keys mentioned above with the copied URL.

### 🔑 AI API Keys
1. **ELEVENLABS_API_KEY**: Your API key from the ElevenLabs dashboard for voice cloning.
2. **GEMINI_API_KEY**: For Genkit and Sargam Studio animations.

## 🔧 Getting Started

1. **Install Frontend**: `npm install`
2. **Run Frontend**: `npm run dev`
3. **Run Backend**: `python main.py` (ensure `librosa` and `ffmpeg` are installed)

Made with ❤️ by Sneh Kumar Verma.
