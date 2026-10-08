# LetsWatch

Real-time synchronized cinema and watch party web application with instant cross-device sync, live room chat, playback controls, and mobile QR pairing.

## Features
- **Ultra-low latency Synchronization**: Real-time Play, Pause, Seek, and Playback speed sync across devices using Socket.IO.
- **Multi-Device & Cross-Platform**: Works smoothly across PCs, tablets, Android, and iOS devices.
- **Zero-Config Mobile Pairing**: Instant QR Code scanning for mobile devices on the same Wi-Fi network or public cloud (Render).
- **Format Support**: Direct MP4, MKV streams, HLS Adaptive Live Streams (.m3u8), and YouTube.
- **Autoplay Resilience**: Automatic audio fallback with synchronized video and 1-tap unmute overlay.
- **Ambient Lighting & Reactions**: Cinematic ambient canvas glow, sound effects, and floating emoji reactions.

## Quick Start Locally
```bash
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Render
- **Build Command**: `npm install`
- **Start Command**: `npm start`
