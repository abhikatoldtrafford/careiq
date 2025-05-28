# 🏥 CareIQ - AI-Powered Support Worker Assistant

<div align="center">

![CareIQ Logo](https://img.shields.io/badge/CareIQ-Support_Worker_Assistant-667eea?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4em0wLTE0Yy0zLjMxIDAtNiAyLjY5LTYgNnMyLjY5IDYgNiA2IDYtMi42OSA2LTYtMi42OS02LTYtNnptMCA5Yy0xLjY2IDAtMy0xLjM0LTMtM3MxLjM0LTMgMy0zIDMgMS4zNCAzIDMtMS4zNCAzLTMgM3oiLz48L3N2Zz4=)

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.1-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?style=flat-square&logo=openai)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**Voice-enabled progress notes with real-time AI coaching and restrictive practice detection**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture)

</div>

---

## 📋 Overview

CareIQ is a mobile-first, voice-enabled progress notes application designed for support workers in disability care settings. It uses cutting-edge AI to help workers document interactions, detect restrictive practices, and receive real-time coaching - all through natural voice commands.

### 🎯 Milestone 1 Objectives ✅

All deliverables for Milestone 1 have been successfully implemented:

- ✅ **Voice-to-Text Progress Note Logging** with Whisper integration
- ✅ **GPT-4 Restrictive Practice Detection** with visual alerts
- ✅ **"Ask Nova" AI Coaching Assistant** with voice and text input
- ✅ **Micro-Training Prompt Logic** for continuous learning
- ✅ **Firebase Authentication** with Google sign-in
- ✅ **Responsive React Frontend** with mobile-first design
- ✅ **FastAPI Backend** with comprehensive API endpoints
- ✅ **Complete Database Schema** with all required models

### 🌟 Bonus Features Implemented

Beyond the original requirements, we've added:

- 🎤 **"Hey Nova" Voice Activation** - Hands-free access to AI assistant
- 📱 **Progressive Web App** capabilities
- 📊 **Export Functionality** for reports
- 🔄 **Real-time Updates** and refreshing
- 🎨 **Modern UI/UX** with Material-UI

## ✨ Features

### 🎤 Voice-First Design
- **Voice Note Recording**: Speak your progress notes naturally
- **"Hey Nova" Activation**: Hands-free access to AI assistant
- **Voice Commands**: Ask questions using voice or text
- **Whisper Transcription**: Accurate speech-to-text conversion

### 🤖 AI-Powered Intelligence
- **GPT-4 Integration**: Advanced language understanding
- **Restrictive Practice Detection**: Automatic flagging of concerning behaviors
- **Smart Coaching**: Context-aware guidance and suggestions
- **De-escalation Tips**: Real-time alternatives to restrictive practices

### 📱 Mobile-Optimized Experience
- **Responsive Design**: Works perfectly on phones, tablets, and desktops
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Offline Capable**: PWA support for basic functionality
- **Fast Performance**: Optimized for mobile networks

### 🔒 Security & Compliance
- **Firebase Authentication**: Secure login with Google
- **Role-Based Access**: Staff-only access control
- **Encrypted Storage**: Secure note storage
- **HIPAA Considerations**: Privacy-first design

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ 
- Node.js 16+
- Firebase Project
- OpenAI API Key

### 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/careiq.git
   cd careiq
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   Backend `.env`:
   ```env
   DATABASE_URL=sqlite:///./careiq.db
   OPENAI_API_KEY=your-openai-api-key
   WHISPER_MODEL=base
   ```

   Frontend `.env`:
   ```env
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_API_URL=http://localhost:8000
   ```

5. **Firebase Admin Key**
   - Download your Firebase Admin SDK key from Firebase Console
   - Save as `backend/firebase_admin_key.json`

### 🏃‍♂️ Running the Application

1. **Start Backend**
   ```bash
   cd backend
   python app.py
   ```
   Backend will run on http://localhost:8000

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on http://localhost:3000

### 👥 Sample Accounts

The application comes with pre-configured sample data:

**Demo Account:**
- Email: `demo@careiq.com`
- Password: `demo123`

**Sample Participants:**
- Jack Wilson
- Emma Brown
- Michael Chen
- Sarah Johnson

## 📖 Usage Guide

### 🎙️ Recording Voice Notes

1. Click the **Voice Note** button or FAB
2. Select a participant
3. Hold the microphone button to record
4. Release to stop and auto-transcribe
5. Review and submit

### 🤖 Using Nova AI Assistant

**Voice Activation:**
1. Enable "Hey Nova" by clicking the microphone chip
2. Say "Hey Nova" followed by your question
3. Nova will respond with guidance

**Manual Access:**
1. Click the Nova button
2. Type or speak your question
3. Get instant AI-powered coaching

### ⚠️ Restrictive Practice Alerts

When the system detects restrictive practices:
- **Red alert banner** appears immediately
- Note is **flagged** in the system
- **Alternative suggestions** are provided
- Incident is **tracked** for training purposes

### 📊 Micro-Training Prompts

The system monitors for:
- 2+ RP flags in 24 hours
- Multiple AI coaching queries
- Triggers personalized training suggestions

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18.2.0
- Material-UI 5.14
- Firebase Auth
- React Media Recorder
- Axios

**Backend:**
- FastAPI 0.104.1
- SQLAlchemy 2.0
- OpenAI Whisper
- GPT-4 API
- Firebase Admin SDK

### Database Schema

```sql
Users
├── id (UUID)
├── firebase_uid (String)
├── name (String)
├── email (String)
└── role (String)

Participants
├── id (UUID)
├── name (String)
└── created_at (DateTime)

Notes
├── id (UUID)
├── participant_id (FK)
├── user_id (FK)
├── text (Text)
├── timestamp (DateTime)
├── rp_flag (Boolean)
├── gpt_response (JSON)
└── audio_duration (Integer)

QueryLogs
├── id (UUID)
├── user_id (FK)
├── text (Text)
├── response (Text)
├── timestamp (DateTime)
└── intent_type (String)
```

### API Endpoints

```
POST   /api/voice-to-text     - Voice transcription & analysis
POST   /api/notes             - Create text note
GET    /api/notes             - Get notes (with filters)
POST   /api/ask-nova          - AI assistant query
GET    /api/participants      - List participants
GET    /api/stats             - Dashboard statistics
GET    /api/training-status   - Check training needs
POST   /api/auth/verify       - Verify Firebase token
```

## 🧪 Testing

### Mobile Testing on Desktop

1. **Chrome DevTools**
   - Press `F12` or `Ctrl+Shift+I`
   - Click device toolbar icon
   - Select mobile device preset
   - Test touch events and responsive layout

2. **Recommended Test Devices**
   - iPhone 12 Pro (390 x 844)
   - Pixel 5 (393 x 851)
   - iPad (768 x 1024)

### Voice Features Testing

1. Ensure HTTPS connection (required for voice)
2. Grant microphone permissions
3. Test "Hey Nova" activation
4. Verify transcription accuracy


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@careiq.com or open an issue in this repository.

## 🙏 Acknowledgments

- OpenAI for GPT-4 and Whisper APIs
- Firebase for authentication services
- Material-UI for the component library
- The disability care community for invaluable feedback

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CareIQ Mobile Overview</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .title {
            text-align: center;
            color: white;
            margin-bottom: 48px;
        }
        
        .title h1 {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 12px;
        }
        
        .title p {
            font-size: 20px;
            opacity: 0.9;
        }
        
        .phones-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 40px;
            margin-bottom: 48px;
        }
        
        .phone {
            width: 280px;
            height: 560px;
            background: #1a1a1a;
            border-radius: 30px;
            padding: 8px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            position: relative;
            margin: 0 auto;
        }
        
        .phone::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background: #333;
            border-radius: 2px;
        }
        
        .screen {
            width: 100%;
            height: 100%;
            background: white;
            border-radius: 22px;
            overflow: hidden;
            position: relative;
        }
        
        .status-bar {
            height: 24px;
            background: #000;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 16px;
            font-size: 12px;
        }
        
        .screen-content {
            height: calc(100% - 24px);
            overflow: hidden;
        }
        
        .phone-label {
            position: absolute;
            bottom: -40px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 14px;
            font-weight: 500;
            text-align: center;
        }
        
        /* Dashboard Screen */
        .dashboard-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            text-align: center;
        }
        
        .dashboard-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            padding: 20px;
        }
        
        .stat-card {
            background: #f5f5f5;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
        }
        
        .participants-section {
            padding: 0 20px 20px;
        }
        
        .participant-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .participant-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        
        .mobile-nav {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-around;
            padding: 8px 0;
        }
        
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            color: #666;
        }
        
        .nav-item.active {
            color: #1976d2;
        }
        
        /* Recording Screen */
        .recording-screen {
            background: #121212;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        
        .recording-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: #f44336;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            margin-bottom: 24px;
            animation: pulse 2s infinite;
        }
        
        .timer {
            font-size: 36px;
            font-family: monospace;
            margin-bottom: 16px;
        }
        
        .stop-btn {
            background: #f44336;
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            border: none;
            font-size: 14px;
            margin-top: 24px;
        }
        
        /* Chat Screen */
        .chat-header {
            background: #dc004e;
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .nova-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .chat-messages {
            padding: 16px;
            height: 380px;
            overflow-y: auto;
        }
        
        .message {
            margin-bottom: 16px;
        }
        
        .message-bubble {
            background: #f0f0f0;
            padding: 12px;
            border-radius: 12px;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .message.user .message-bubble {
            background: #1976d2;
            color: white;
            margin-left: 40px;
        }
        
        .rp-alert {
            background: #fff3cd;
            color: #856404;
            padding: 8px;
            border-radius: 8px;
            font-size: 11px;
            margin-top: 8px;
        }
        
        .chat-input {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 12px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 8px;
        }
        
        .input-field {
            flex: 1;
            border: 1px solid #e0e0e0;
            border-radius: 20px;
            padding: 8px 12px;
            font-size: 12px;
        }
        
        .voice-btn, .send-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .voice-btn {
            background: #4caf50;
            color: white;
        }
        
        .send-btn {
            background: #1976d2;
            color: white;
        }
        
        /* Training Screen */
        .training-header {
            background: #2e7d32;
            color: white;
            padding: 16px;
            text-align: center;
        }
        
        .training-progress {
            padding: 20px;
        }
        
        .progress-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: conic-gradient(#4caf50 0deg 216deg, #e0e0e0 216deg 360deg);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-weight: bold;
            color: #2e7d32;
        }
        
        .module-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
        }
        
        .module-title {
            font-weight: 500;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .module-duration {
            font-size: 12px;
            color: #666;
        }
        
        .feature-list {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 32px;
            color: white;
            text-align: center;
        }
        
        .feature-list h2 {
            font-size: 28px;
            margin-bottom: 24px;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            text-align: left;
        }
        
        .feature {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        
        .feature-icon {
            font-size: 24px;
            margin-top: 4px;
        }
        
        .feature-content h3 {
            font-size: 18px;
            margin-bottom: 8px;
        }
        
        .feature-content p {
            font-size: 14px;
            opacity: 0.9;
            line-height: 1.5;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Title -->
        <div class="title">
            <h1>CareIQ</h1>
            <p>AI-Powered Support Worker Assistant</p>
        </div>
        
        <!-- Phone Mockups -->
        <div class="phones-grid">
            <!-- Dashboard -->
            <div class="phone">
                <div class="screen">
                    <div class="status-bar">
                        <span>9:41 AM</span>
                        <span>🔋 100%</span>
                    </div>
                    <div class="screen-content">
                        <div class="dashboard-header">
                            <h2>CareIQ</h2>
                            <p style="font-size: 12px; opacity: 0.9;">Good morning, Sarah 👋</p>
                        </div>
                        
                        <div style="position: absolute; top: 80px; left: 16px; background: rgba(76, 175, 80, 0.9); color: white; padding: 6px 10px; border-radius: 16px; font-size: 11px;">
                            🎤 Say "Hey Nova"
                        </div>
                        
                        <div class="dashboard-stats">
                            <div class="stat-card">
                                <div class="stat-number">47</div>
                                <div style="font-size: 12px; color: #666;">Total Notes</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: #f44336;">3</div>
                                <div style="font-size: 12px; color: #666;">RP Incidents</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: #4caf50;">12</div>
                                <div style="font-size: 12px; color: #666;">My Notes</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" style="color: #2196f3;">4</div>
                                <div style="font-size: 12px; color: #666;">Participants</div>
                            </div>
                        </div>
                        
                        <div class="participants-section">
                            <h3 style="font-size: 16px; margin-bottom: 12px;">Participants</h3>
                            <div class="participant-row">
                                <div class="participant-avatar" style="background: #FF6B6B;">JW</div>
                                <div>
                                    <div style="font-weight: 500; font-size: 14px;">Jack Wilson</div>
                                    <div style="font-size: 12px; color: #666;">8 notes</div>
                                </div>
                            </div>
                            <div class="participant-row">
                                <div class="participant-avatar" style="background: #4ECDC4; position: relative;">
                                    EB
                                    <div style="position: absolute; top: -2px; right: -2px; background: #f44336; width: 12px; height: 12px; border-radius: 50%; font-size: 8px;">⚠️</div>
                                </div>
                                <div>
                                    <div style="font-weight: 500; font-size: 14px;">Emma Brown</div>
                                    <div style="font-size: 12px; color: #666;">12 notes • RP Alert</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mobile-nav">
                            <div class="nav-item active">
                                <div>🏠</div>
                                <div>Dashboard</div>
                            </div>
                            <div class="nav-item">
                                <div>🎤</div>
                                <div>Voice Note</div>
                            </div>
                            <div class="nav-item">
                                <div>🤖</div>
                                <div>Ask Nova</div>
                            </div>
                            <div class="nav-item">
                                <div>📊</div>
                                <div>Reports</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="phone-label">Dashboard & Overview</div>
            </div>
            
            <!-- Voice Recording -->
            <div class="phone">
                <div class="screen">
                    <div class="status-bar">
                        <span>9:42 AM</span>
                        <span>🔋 99%</span>
                    </div>
                    <div class="screen-content recording-screen">
                        <div style="position: absolute; top: 20px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 18px;">✕</div>
                            <div style="font-size: 16px;">Recording Voice Note</div>
                            <div style="width: 18px;"></div>
                        </div>
                        
                        <div class="recording-circle">🎤</div>
                        <div class="timer">2:34</div>
                        
                        <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px; margin: 20px 0; display: flex; align-items: center; gap: 8px;">
                            <div style="background: #4ECDC4; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">EB</div>
                            <span style="font-size: 14px;">Recording for Emma Brown</span>
                        </div>
                        
                        <button class="stop-btn">⏹️ Stop Recording</button>
                        
                        <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; text-align: center; font-size: 12px; opacity: 0.7; line-height: 1.4;">
                            Speak clearly about the participant's activities, behaviors, and observations
                        </div>
                    </div>
                </div>
                <div class="phone-label">Voice Recording Interface</div>
            </div>
            
            <!-- Nova Chat -->
            <div class="phone">
                <div class="screen">
                    <div class="status-bar">
                        <span>9:43 AM</span>
                        <span>🔋 98%</span>
                    </div>
                    <div class="screen-content">
                        <div class="chat-header">
                            <div class="nova-avatar">🤖</div>
                            <div>
                                <div style="font-weight: 500;">Nova AI Assistant</div>
                                <div style="font-size: 11px; opacity: 0.8;">Powered by GPT-4</div>
                            </div>
                            <div style="margin-left: auto;">✕</div>
                        </div>
                        
                        <div style="background: #f9f9f9; padding: 8px 16px; font-size: 11px; color: #666; border-bottom: 1px solid #e0e0e0;">
                            Context: 👤 Emma Brown
                        </div>
                        
                        <div class="chat-messages">
                            <div class="message">
                                <div class="message-bubble">
                                    Hi! I'm Nova. How can I help you today?
                                </div>
                            </div>
                            
                            <div class="message user">
                                <div class="message-bubble">
                                    What should I do if Emma refuses medication?
                                </div>
                            </div>
                            
                            <div class="message">
                                <div class="message-bubble">
                                    When someone refuses medication:
                                    <br><br>
                                    <strong>1. Stay calm and respectful</strong><br>
                                    • Don't force or coerce<br>
                                    • Listen to their concerns
                                    <br><br>
                                    <strong>2. Explore reasons</strong><br>
                                    • Ask about their concerns<br>
                                    • Provide clear information
                                    <br><br>
                                    <strong>3. Offer choices</strong><br>
                                    • Different timing<br>
                                    • Alternative methods
                                    
                                    <div class="rp-alert">
                                        ⚠️ Never use physical force - this would be a restrictive practice
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="chat-input">
                            <input class="input-field" placeholder="Ask Nova anything..." />
                            <button class="voice-btn">🎤</button>
                            <button class="send-btn">📤</button>
                        </div>
                    </div>
                </div>
                <div class="phone-label">Nova AI Assistant</div>
            </div>
            
            <!-- Training Module -->
            <div class="phone">
                <div class="screen">
                    <div class="status-bar">
                        <span>9:44 AM</span>
                        <span>🔋 97%</span>
                    </div>
                    <div class="screen-content">
                        <div class="training-header">
                            <h2 style="font-size: 18px;">Training Modules</h2>
                            <p style="font-size: 12px; opacity: 0.9;">Continuous Learning</p>
                        </div>
                        
                        <div class="training-progress">
                            <div class="progress-circle">60%</div>
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="font-size: 14px; font-weight: 500;">Your Progress</div>
                                <div style="font-size: 12px; color: #666;">3 of 5 modules completed</div>
                            </div>
                            
                            <div style="background: #fff3cd; color: #856404; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 12px;">
                                📚 Training recommended: You've had 2+ RP incidents in 24hrs
                            </div>
                            
                            <div class="module-card">
                                <div class="module-title">🚪 Restrictive Practice Alternatives</div>
                                <div class="module-duration">15 minutes • Recommended</div>
                                <div style="margin-top: 8px;">
                                    <button style="background: #4caf50; color: white; border: none; padding: 6px 16px; border-radius: 16px; font-size: 12px;">Start Module</button>
                                </div>
                            </div>
                            
                            <div class="module-card">
                                <div class="module-title">🧘 De-escalation Techniques</div>
                                <div class="module-duration">20 minutes</div>
                                <div style="margin-top: 8px;">
                                    <button style="background: #1976d2; color: white; border: none; padding: 6px 16px; border-radius: 16px; font-size: 12px;">Continue</button>
                                </div>
                            </div>
                            
                            <div class="module-card" style="opacity: 0.6;">
                                <div class="module-title">✅ Positive Behavior Support</div>
                                <div class="module-duration">25 minutes • Completed</div>
                                <div style="margin-top: 8px;">
                                    <span style="color: #4caf50; font-size: 12px;">✓ Completed with 95% score</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="phone-label">Micro-Training System</div>
            </div>
        </div>
        
        <!-- Features List -->
        <div class="feature-list">
            <h2>Key Features</h2>
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🎤</div>
                    <div class="feature-content">
                        <h3>Voice-First Design</h3>
                        <p>Hands-free voice notes with Whisper transcription and "Hey Nova" activation</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">🤖</div>
                    <div class="feature-content">
                        <h3>AI-Powered Analysis</h3>
                        <p>GPT-4 powered restrictive practice detection with real-time coaching</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">📱</div>
                    <div class="feature-content">
                        <h3>Mobile Optimized</h3>
                        <p>Progressive Web App with offline support and touch-friendly interface</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">🎓</div>
                    <div class="feature-content">
                        <h3>Intelligent Training</h3>
                        <p>Personalized micro-learning modules triggered by behavior patterns</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">🔒</div>
                    <div class="feature-content">
                        <h3>Secure & Compliant</h3>
                        <p>Firebase authentication with role-based access and encrypted storage</p>
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div class="feature-content">
                        <h3>Analytics & Export</h3>
                        <p>Comprehensive reporting with CSV/JSON export capabilities</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
