# Jhoom It - AI Gesture Music Controller

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/MediaPipe-Computer_Vision-blue" alt="MediaPipe" />
  <img src="https://img.shields.io/badge/Spotify-API-green" alt="Spotify" />
  <img src="https://img.shields.io/badge/Python-Local_Control-yellow" alt="Python" />
</p>

**Jhoom It** is a futuristic, touchless interface for controlling your music. Using advanced computer vision and AI, it transforms your webcam into a gesture controller, allowing you to Play, Pause, and Skip tracks on Spotify (or any media player) with simple hand movements.

It features a stunning, reactive "Wave" audio visualizer that syncs perfectly with your music, creating an immersive experience.

## 🚀 Key Features

-   **🤖 AI Gesture Control**: Control playback without touching your keyboard using Google MediaPipe hands tracking.
-   **🎵 Reactive Wave Visualizer**: A high-speed, 300-bar frequency visualizer that glows and pulses around the album art in real-time.
-   **🔌 Smart Dual-Mode Control**:
    -   **Spotify API Mode**: For Premium users, controls Spotify directly across any device.
    -   **Local Key Mode**: A Python background service that presses media keys (Play/Pause/Next), working with **Spotify Free**, YouTube Music, Apple Music, and more.
-   **⚡ Zero-Lag Interface**: Optimistic UI updates ensure the interface responds instantly to your gestures, even before the API confirms.
-   **🛡️ Stability Filters**: Intelligent debouncing algorithms prevent accidental triggers from twitchy movements.

## 🎮 Command Guide

Hold the gesture for **0.5 seconds** to trigger the action. The UI will flash green to confirm.

| Gesture | Action | Description |
| :--- | :--- | :--- |
| **✋ Open Palm** | **Play / Resume** | Show 5 fingers clearly. |
| **✊ Fist (Grab)** | **Pause** | Close your hand into a fist. |
| **✌️ Victory (V)** | **Next Track** | Show index and middle fingers (Peace sign). |
| **👆 Point** | **Previous Track** | Show only your index finger. |

## 📦 Installation & Setup

### Prerequisites
-   Node.js & npm
-   Python 3.x (Optional, for Local Control)
-   A webcam

### 1. Clone the Repository
```bash
git clone https://github.com/MDASARI2028/Jhoom-It.git
cd Jhoom-It
```

### 2. Install Frontend
```bash
npm install
```

### 3. Install Local Control (Optional but Recommended)
This allows the app to control your PC's volume and media keys directly.
```bash
pip install -r local_control/requirements.txt
```

### 4. Set Environment Variables
Create a `.env.local` file in the root directory and add your Spotify Client ID and Secret (get them from [developer.spotify.com](https://developer.spotify.com)):
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### 5. Run the App
You need two terminals running simultaneously:

**Terminal 1 (Frontend UI):**
```bash
npm run dev
```

**Terminal 2 (Local Control Service):**
```bash
python local_control/server.py
```

Open **http://localhost:3000** in your browser and allow camera access.

## 🛠️ Tech Stack

-   **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
-   **AI/CV**: Google MediaPipe Hands (Client-side tracking)
-   **Backend**: Python (Flask) for operating system integration
-   **APIs**: Spotify Web API + MediaSession API
-   **State**: Zustand for global store management

## ⚠️ Troubleshooting

-   **"No Token Found"**: Click the green "Connect Spotify" button on the card to log in.
-   **Visualizer is flat**: Ensure your microphone is allowed and the volume is up slightly (browser security blocks audio access until user interaction).
-   **Gestures not working**: Ensure your hand is visible and well-lit. Hold the gesture steady for a moment.
-   **Local Control Offline**: Check if `python local_control/server.py` is running and port 5000 is free.

---
*V2.0 - Enhanced UI & Stability Update*
