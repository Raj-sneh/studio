# **App Name**: Socio

## Core Features:

- User Authentication: Secure user login/registration via Email/Password, Google Sign-In, and Phone OTP, all handled by Firebase Authentication.
- Instrument Practice: Enable users to practice with different virtual instruments (Piano, Guitar, Drums, Violin) with multi-touch support and audio playback using SoundPool and ExoPlayer.
- AI Teacher Mode: Provide live pitch and timing analysis powered by a TFLite model hosted on Firebase ML or a local TarsosDSP fallback, offering demo playback with animated notes and scoring user attempts.
- Lesson Management: Display and manage lessons with details like title, instrument, tempo, and backing track URL, all stored in Cloud Firestore.
- Session Recording and Playback: Record user sessions, allowing playback with metronome and tempo adjustments, with data saved to Firestore.
- Feedback and Reporting: Implement a reporting feature to allow users to flag content. AI tool automatically triggers moderation tasks based on report thresholds.
- Cloud Notifications: Cloud Functions manages sending push notifications on new follows/likes. Timeline data denormalized via cloud functions.

## Style Guidelines:

- Primary color: Cyan (#00FFF9), derived from the request. To highlight playable elements of the UI, and contrast the dark background.
- Background color: Dark navy blue (#0b0022) per the request.
- Accent color: Purple (#6b4cff), to highlight other parts of the interface.
- Fonts: 'Poppins' (sans-serif) for general UI and headings, and 'Roboto' (sans-serif) as a secondary font if needed for body text, per the user request. Note: currently only Google Fonts are supported.
- Custom-designed S-shaped cyan login button icon (based on request), a monogram 'n' icon, and simple Lottie JSON animations for note highlighting.
- Consistent layout across all screens, with clear navigation tabs for Practice and AI Teacher modes. The watermark 'Made in India • Sneh Kumar Verma' to the bottom left.
- Subtle animations for note highlighting during playback and transitions between screens.