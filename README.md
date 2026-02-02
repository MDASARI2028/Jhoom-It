# Jhoom It - Spotify Gesture Controller

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/MediaPipe-Computer_Vision-blue" alt="MediaPipe" />
  <img src="https://img.shields.io/badge/Spotify-API-green" alt="Spotify" />
</p>

**Jhoom It** is a futuristic, touchless interface for controlling your music. Using your webcam and advanced computer vision, it allows you to Play, Pause, and Skip tracks on Spotify with simple hand gestures—just like magic.

## 🚀 Features

-   **Touchless Control**: Use hand gestures to control playback without touching your keyboard or mouse.
-   **Local Key Control**: Works with **any** media player (Spotify Free, YouTube Music, etc.) by simulating media keys.
-   **Spotify Integration**: Connects to your Spotify account to display "Now Playing" info and high-res album art.
-   **Zero Lag UI**: Features "Optimistic Updates" for instant visual feedback.
-   **Futuristic HUD**: A clean, glassmorphism-inspired interface with real-time hand tracking visuals.

## 🎮 Gestures

| Gesture | Action |
| :--- | :--- |
| **✋ Open Palm** | **Play / Resume** |
| **✊ Fist (Grab)** | **Pause** |
| **✌️ Victory (V)** | **Next Track** |
| **👆 Point** | **Previous Track** |

## 🛠️ Tech Stack

-   **Frontend**: Next.js 16, Tailwind CSS, Framer Motion
-   **Computer Vision**: Google MediaPipe (Hands)
-   **Backend (Local)**: Python (Flask + PyAutoGUI) for media key simulation.
-   **State Management**: Zustand

## 📦 Getting Started

### Prerequisites
-   Node.js & npm
-   Python 3.x (for local control)
-   A webcam

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/MDASARI2028/Jhoom-It.git
    cd Jhoom-It
    ```

2.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

3.  **Install Python Dependencies (for Local Control)**
    ```bash
    pip install -r local_control/requirements.txt
    ```

4.  **Run the Application**
    
    Open two terminals:
    
    *Terminal 1 (Frontend):*
    ```bash
    npm run dev
    ```
    
    *Terminal 2 (Local Control Server):*
    ```bash
    python local_control/server.py
    ```

5.  **Open in Browser**
    Navigate to `http://localhost:3000`. Allow camera access when prompted.

---

## ⚠️ Note on Spotify Premium
While the app can read track info for everyone, direct API control requires **Spotify Premium**. However, the included **Local Control Python Script** allows it to work for **Free users** too by pressing your computer's media keys!

---

*Made with ❤️ by Monis Dasari*
