import os
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg\bin"
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path
import tempfile
import json
from functools import wraps
import io
import wave

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text, ForeignKey, desc, and_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
import whisper
import uvicorn
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
try:
    cred = credentials.Certificate("firebase_admin_key.json")
    firebase_admin.initialize_app(cred)
except Exception as e:
    logger.warning(f"Firebase initialization warning: {e}")
    # Continue without Firebase for testing

# Initialize OpenAI
OPENAI_API_KEY = ''
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Create or retrieve the assistant
ASSISTANT_ID = os.getenv("OPENAI_ASSISTANT_ID")
if not ASSISTANT_ID:
    # Create assistant if it doesn't exist
    assistant = openai_client.beta.assistants.create(
        name="CareIQ Assistant",
        instructions="""You are CareIQ Assistant (Nova), an AI coach for support workers in disability care settings. Your role is to:

1. Detect and flag restrictive practices in progress notes
2. Provide guidance on de-escalation and person-centered alternatives
3. Offer brief, practical coaching for challenging situations
4. Promote dignity, choice, and least restrictive approaches

When analyzing notes for restrictive practices, look for:
- Physical restraints (holding, blocking, forced movement)
- Environmental restraints (locked doors, blocked exits)
- Chemical restraints (forced medication)
- Mechanical restraints (straps, belts)
- Seclusion or isolation

Always respond in JSON format with these fields:
{
  "rp_flag": boolean,
  "detected_practices": ["list of detected practices"],
  "tags": ["relevant tags"],
  "intent": "note|question|warning",
  "response": "your coaching response",
  "severity": "low|medium|high",
  "alternatives": ["list of suggested alternatives"]
}

Keep responses concise, supportive, and focused on practical solutions.""",
        model="gpt-4.1-mini",
        response_format={"type": "json_object"}
    )
    ASSISTANT_ID = assistant.id
    logger.info(f"Created new assistant with ID: {ASSISTANT_ID}")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./careiq.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Initialize FastAPI app
app = FastAPI(title="CareIQ API", version="2.0.0")

# CORS middleware - Mobile friendly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model
whisper_model_name = os.getenv("WHISPER_MODEL", "base")
logger.info(f"Loading Whisper model: {whisper_model_name}")
try:
    whisper_model = whisper.load_model(whisper_model_name)
except Exception as e:
    logger.warning(f"Failed to load Whisper model: {e}. Will use mock transcription.")
    whisper_model = None

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    firebase_uid = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False, default="staff")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    notes = relationship("Note", back_populates="user")
    queries = relationship("QueryLog", back_populates="user")

class Participant(Base):
    __tablename__ = "participants"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    notes = relationship("Note", back_populates="participant")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    participant_id = Column(String, ForeignKey("participants.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    rp_flag = Column(Boolean, default=False)
    gpt_response = Column(Text, nullable=True)
    audio_duration = Column(Integer, nullable=True)  # seconds
    
    # Relationships
    user = relationship("User", back_populates="notes")
    participant = relationship("Participant", back_populates="notes")

class QueryLog(Base):
    __tablename__ = "query_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    intent_type = Column(String, nullable=True)  # question/training
    thread_id = Column(String, nullable=True)  # OpenAI thread ID
    
    # Relationships
    user = relationship("User", back_populates="queries")

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class UserCreate(BaseModel):
    firebase_uid: str
    name: str
    email: EmailStr
    role: str = "staff"

class UserResponse(BaseModel):
    id: str
    firebase_uid: str
    name: str
    email: str
    role: str
    created_at: datetime

class ParticipantCreate(BaseModel):
    name: str

class ParticipantResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    notes_count: Optional[int] = 0

class NoteCreate(BaseModel):
    participant_id: str
    text: str
    audio_duration: Optional[int] = None

class NoteResponse(BaseModel):
    id: str
    participant_id: str
    user_id: str
    text: str
    timestamp: datetime
    rp_flag: bool
    gpt_response: Optional[str]
    participant_name: Optional[str]
    user_name: Optional[str]
    audio_duration: Optional[int]

class VoiceTranscriptionResponse(BaseModel):
    note_id: str
    participant_id: str
    user_id: str
    transcribed_text: str
    timestamp: datetime
    rp_flag: bool
    audio_duration: int

class AskNovaRequest(BaseModel):
    question: str
    context: Optional[Dict] = {}
    session_id: Optional[str] = None

class AskNovaResponse(BaseModel):
    response: str
    tags: List[str] = []
    intent: str = "advice"
    should_log: bool = False
    rp_flag: bool = False
    alternatives: List[str] = []

class TrainingCompletion(Base):
    __tablename__ = "training_completions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    module_id = Column(String, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Integer, nullable=True)  # Optional quiz score
    
    # Relationships
    user = relationship("User", backref="training_completions")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Firebase authentication decorator
async def verify_firebase_token(authorization: str = Header(None)):
    # Allow testing without Firebase
    if os.getenv("DISABLE_AUTH", "false").lower() == "true":
        return {"uid": "test-user", "email": "test@careiq.com", "name": "Test User"}
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split("Bearer ")[1]
    
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Firebase auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Get current user from Firebase token
async def get_current_user(
    token_data: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db)
) -> User:
    firebase_uid = token_data["uid"]
    
    # Get or create user
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    
    if not user:
        # Create new user from Firebase data
        user = User(
            firebase_uid=firebase_uid,
            email=token_data.get("email", ""),
            name=token_data.get("name", token_data.get("email", "").split("@")[0]),
            role="staff"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

# Helper function for OpenAI GPT-4 analysis
async def analyze_with_gpt4(text: str, context: Dict[str, Any] = {}) -> Dict[str, Any]:
    """Analyze text with GPT-4 using Assistant API"""
    try:
        # Create a thread
        thread = openai_client.beta.threads.create()
        
        # Add message to thread
        message = openai_client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=f"Analyze this note for restrictive practices: {text}"
        )
        
        # Run the assistant
        run = openai_client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=ASSISTANT_ID
        )
        
        # Wait for completion
        while run.status != "completed":
            run = openai_client.beta.threads.runs.retrieve(
                thread_id=thread.id,
                run_id=run.id
            )
            if run.status == "failed":
                raise Exception("Assistant run failed")
        
        # Get the response
        messages = openai_client.beta.threads.messages.list(thread_id=thread.id)
        response = messages.data[0].content[0].text.value
        
        # Parse JSON response
        result = json.loads(response)
        
        # Ensure all required fields
        return {
            "rp_flag": result.get("rp_flag", False),
            "detected_practices": result.get("detected_practices", []),
            "tags": result.get("tags", []),
            "intent": result.get("intent", "note"),
            "response": result.get("response", ""),
            "severity": result.get("severity", "low"),
            "alternatives": result.get("alternatives", [])
        }
        
    except Exception as e:
        logger.error(f"GPT-4 analysis error: {str(e)}")
        # Fallback to simple keyword detection
        return check_restrictive_practice_fallback(text)

def check_restrictive_practice_fallback(text: str) -> Dict[str, Any]:
    """Fallback RP detection when GPT-4 is unavailable"""
    rp_keywords = [
        "blocked door", "locked door", "restrained", "tied", "forced",
        "prevented from leaving", "held down", "chemical restraint",
        "physical restraint", "locked in", "can't leave", "won't let"
    ]
    
    text_lower = text.lower()
    detected_practices = []
    
    for keyword in rp_keywords:
        if keyword in text_lower:
            detected_practices.append(keyword)
    
    if detected_practices:
        return {
            "rp_flag": True,
            "detected_practices": detected_practices,
            "tags": ["restrictive practice"],
            "intent": "warning",
            "response": f"⚠️ Restrictive practices detected: {', '.join(detected_practices)}. Consider alternatives like verbal de-escalation, offering choices, or environmental modifications.",
            "severity": "medium",
            "alternatives": [
                "Use verbal de-escalation techniques",
                "Offer choices and alternatives",
                "Modify the environment to reduce triggers",
                "Seek supervisor support"
            ]
        }
    
    return {
        "rp_flag": False,
        "detected_practices": [],
        "tags": [],
        "intent": "note",
        "response": "No restrictive practices detected.",
        "severity": "low",
        "alternatives": []
    }
# Add this around line 350 (after existing helper functions)
TRAINING_MODULES = {
    "rp-alternatives": {
        "id": "rp-alternatives",
        "title": "Restrictive Practice Alternatives",
        "description": "Learn evidence-based alternatives to restrictive practices",
        "duration": 15,
        "sections": [
            {
                "title": "Understanding Restrictive Practices",
                "content": """
**What are Restrictive Practices?**

Restrictive practices are interventions that intentionally restrict a person's rights or freedom of movement. Common types include:

- **Physical restraints**: Holding, blocking, or forcing movement
- **Environmental restraints**: Locking doors, blocking exits
- **Chemical restraints**: Medication used for behavior control
- **Mechanical restraints**: Straps, belts, or devices
- **Seclusion**: Isolating or separating from others

**Why avoid them?**
- Violate human rights and dignity
- Can cause physical and psychological harm
- Often ineffective long-term
- May escalate challenging behaviors
                """,
                "quiz": [
                    {
                        "question": "Which of these is considered a restrictive practice?",
                        "options": ["Offering choices", "Blocking a doorway", "Active listening", "Providing support"],
                        "correct": 1,
                        "explanation": "Blocking a doorway prevents free movement and is an environmental restraint."
                    }
                ]
            },
            {
                "title": "De-escalation Techniques",
                "content": """
**Primary De-escalation Strategies:**

**1. Stay Calm**
- Keep your voice low and steady
- Maintain relaxed body language
- Take deep breaths

**2. Active Listening**
- "I can see you're upset about..."
- "Help me understand what's happening"
- Validate their feelings

**3. Offer Choices**
- "Would you prefer to talk here or in your room?"
- "Would you like some water or tea?"
- Give control where possible

**4. Create Space**
- Step back if safe to do so
- Remove unnecessary people
- Reduce environmental stimuli

**5. Problem-Solve Together**
- "What would help right now?"
- "Let's figure this out together"
- Focus on solutions, not problems
                """,
                "quiz": [
                    {
                        "question": "What should you do first when someone becomes agitated?",
                        "options": ["Call for backup", "Stay calm and lower your voice", "Give them space to calm down", "Explain the rules"],
                        "correct": 1,
                        "explanation": "Staying calm and speaking in a low, steady voice helps prevent escalation."
                    }
                ]
            },
            {
                "title": "Person-Centered Alternatives",
                "content": """
**Instead of Restrictive Practices, Try:**

**For Door Blocking/Locking:**
- Understand why they want to leave
- Offer to accompany them safely
- Address underlying needs (bathroom, fresh air, etc.)
- Use distraction or redirection
- Create a safe walking area

**For Physical Restraint:**
- Use verbal de-escalation first
- Offer sensory tools (fidget items, music)
- Address pain, discomfort, or needs
- Change the environment
- Seek supervisor support

**For Medication Refusal:**
- Explore the reason for refusal
- Offer choices about timing or method
- Provide clear, simple information
- Respect their right to refuse (if competent)
- Document and inform healthcare team

**Environmental Modifications:**
- Reduce noise and crowding
- Improve lighting
- Remove triggers when possible
- Create calming spaces
- Use visual supports and cues
                """,
                "quiz": [
                    {
                        "question": "If someone refuses medication, what should you do first?",
                        "options": ["Force them to take it", "Explore why they're refusing", "Call the doctor immediately", "Document non-compliance"],
                        "correct": 1,
                        "explanation": "Understanding the reason helps address concerns and find acceptable solutions."
                    }
                ]
            }
        ]
    },
    "de-escalation": {
        "id": "de-escalation", 
        "title": "Advanced De-escalation Techniques",
        "description": "Master verbal and non-verbal de-escalation strategies",
        "duration": 20,
        "sections": [
            {
                "title": "Reading Escalation Signs",
                "content": """
**Early Warning Signs:**

**Physical Signs:**
- Increased breathing or heart rate
- Muscle tension, clenched fists
- Restlessness, pacing
- Facial flushing or pallor
- Changes in voice tone

**Behavioral Signs:**
- Increased volume or rapid speech
- Repetitive movements or words
- Invasion of personal space
- Difficulty following instructions
- Seeking attention or reassurance

**Emotional Signs:**
- Expressing frustration or anger
- Withdrawal or shut down
- Confusion or anxiety
- Fear or paranoia
- Feeling overwhelmed

**The Escalation Curve:**
1. **Baseline** - Normal, calm state
2. **Trigger** - Something causes stress
3. **Escalation** - Stress builds up
4. **Crisis** - Peak of emotional dysregulation
5. **Recovery** - Gradual return to baseline
6. **Post-crisis** - Below baseline, vulnerable
                """,
                "quiz": [
                    {
                        "question": "What is the best time to intervene with de-escalation?",
                        "options": ["During crisis phase", "During escalation phase", "During recovery phase", "During post-crisis phase"],
                        "correct": 1,
                        "explanation": "Early intervention during escalation is most effective before reaching crisis."
                    }
                ]
            }
        ]
    },
    "pbsp-basics": {
        "id": "pbsp-basics",
        "title": "Positive Behavior Support Principles", 
        "description": "Understanding person-centered, evidence-based behavior support",
        "duration": 25,
        "sections": [
            {
                "title": "Core PBSP Principles",
                "content": """
**Positive Behavior Support Philosophy:**

**1. Person-Centered Approach**
- Focus on the individual's strengths and preferences
- Respect dignity, choice, and self-determination
- Build meaningful relationships
- Consider cultural and personal values

**2. Evidence-Based Practice**
- Use proven strategies and interventions
- Collect and analyze data
- Make decisions based on evidence
- Continuously evaluate effectiveness

**3. Prevention Focus**
- Identify and address triggers
- Modify environments to prevent problems
- Teach new skills proactively
- Build on existing strengths

**4. Quality of Life**
- Enhance meaningful participation
- Increase independence and choice
- Build social connections
- Promote physical and emotional wellbeing

**5. Collaborative Approach**
- Include the person in planning
- Work with families and teams
- Share knowledge and expertise
- Respect different perspectives
                """,
                "quiz": [
                    {
                        "question": "What is the primary focus of PBSP?",
                        "options": ["Stopping bad behaviors", "Punishment and consequences", "Person-centered support and prevention", "Following rules and procedures"],
                        "correct": 2,
                        "explanation": "PBSP focuses on person-centered support and preventing problems through positive approaches."
                    }
                ]
            }
        ]
    }
}

def get_recommended_modules(user_id: str, db: Session) -> List[str]:
    """Get recommended training modules based on user's recent activity"""
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    # Get recent RP incidents
    rp_notes = db.query(Note).filter(
        and_(
            Note.user_id == user_id,
            Note.timestamp >= twenty_four_hours_ago,
            Note.rp_flag == True
        )
    ).all()
    
    # Get recent queries
    queries = db.query(QueryLog).filter(
        and_(
            QueryLog.user_id == user_id,
            QueryLog.timestamp >= twenty_four_hours_ago
        )
    ).all()
    
    recommended = []
    
    # If multiple RP incidents, recommend alternatives training
    if len(rp_notes) >= 2:
        recommended.append("rp-alternatives")
    
    # If many queries, recommend de-escalation
    if len(queries) >= 3:
        recommended.append("de-escalation")
    
    # Always include PBSP basics for comprehensive understanding
    if len(rp_notes) + len(queries) >= 2:
        recommended.append("pbsp-basics")
    
    return recommended[:2]  # Limit to 2 recommendations

def has_completed_training(user_id: str, module_id: str, db: Session) -> bool:
    """Check if user has completed specific training module"""
    completion = db.query(TrainingCompletion).filter(
        and_(
            TrainingCompletion.user_id == user_id,
            TrainingCompletion.module_id == module_id
        )
    ).first()
    return completion is not None
# Check for micro-training triggers
async def check_training_triggers(user_id: str, db: Session) -> bool:
    """Check if user needs training prompt (2+ RP flags or queries in 24hrs)"""
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    # Count RP-flagged notes
    rp_notes_count = db.query(Note).filter(
        and_(
            Note.user_id == user_id,
            Note.timestamp >= twenty_four_hours_ago,
            Note.rp_flag == True
        )
    ).count()
    
    # Count queries
    queries_count = db.query(QueryLog).filter(
        and_(
            QueryLog.user_id == user_id,
            QueryLog.timestamp >= twenty_four_hours_ago
        )
    ).count()
    
    return (rp_notes_count + queries_count) >= 2

# Initialize sample data
def init_sample_data(db: Session):
    """Create sample participants if they don't exist"""
    existing = db.query(Participant).first()
    if not existing:
        participants = [
            Participant(name="Jack Wilson"),
            Participant(name="Emma Brown"),
            Participant(name="Michael Chen"),
            Participant(name="Sarah Johnson")
        ]
        db.add_all(participants)
        db.commit()
        logger.info("Sample participants created")

# API Endpoints
# Add these imports at the top of app.py if not already present:
from fastapi.responses import Response
import csv
import io

# Add this endpoint to your existing app.py file:

@app.get("/api/export/{format}")
async def export_data(
    format: str,
    participant_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export notes in CSV or JSON format"""
    if format not in ['csv', 'json']:
        raise HTTPException(status_code=400, detail="Format must be 'csv' or 'json'")
    
    # Build query
    query = db.query(Note)
    
    if participant_id:
        query = query.filter(Note.participant_id == participant_id)
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Note.timestamp >= start_dt)
        except:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Note.timestamp <= end_dt)
        except:
            pass
    
    notes = query.order_by(desc(Note.timestamp)).all()
    
    if format == 'json':
        # JSON export
        export_data = []
        for note in notes:
            export_data.append({
                'id': note.id,
                'timestamp': note.timestamp.isoformat(),
                'participant': note.participant.name if note.participant else 'Unknown',
                'participant_id': note.participant_id,
                'staff': note.user.name if note.user else 'Unknown',
                'staff_id': note.user_id,
                'text': note.text,
                'rp_flag': note.rp_flag,
                'rp_details': json.loads(note.gpt_response) if note.gpt_response else None,
                'audio_duration': note.audio_duration
            })
        
        return JSONResponse(content={
            'export_date': datetime.utcnow().isoformat(),
            'total_notes': len(export_data),
            'filters': {
                'participant_id': participant_id,
                'start_date': start_date,
                'end_date': end_date
            },
            'notes': export_data
        })
    
    else:
        # CSV export
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            'Timestamp', 'Staff', 'Participant', 'Note', 
            'RP Flag', 'RP Type', 'Duration (s)'
        ])
        
        # Data
        for note in notes:
            rp_details = json.loads(note.gpt_response) if note.gpt_response else {}
            rp_type = ', '.join(rp_details.get('detected_practices', [])) if note.rp_flag else ''
            
            writer.writerow([
                note.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                note.user.name if note.user else 'Unknown',
                note.participant.name if note.participant else 'Unknown',
                note.text,
                'Yes' if note.rp_flag else 'No',
                rp_type,
                note.audio_duration or ''
            ])
        
        output.seek(0)
        return Response(
            content=output.getvalue(),
            media_type='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename=careiq_export_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.csv'
            }
        )
@app.on_event("startup")
async def startup_event():
    """Initialize sample data on startup"""
    db = SessionLocal()
    try:
        init_sample_data(db)
    finally:
        db.close()

@app.get("/")
async def root():
    return {
        "message": "CareIQ API v2.0",
        "status": "running",
        "features": ["firebase-auth", "voice-notes", "nova-ai", "mobile-optimized", "gpt-4-analysis"]
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "firebase": "enabled",
        "whisper_model": whisper_model_name,
        "openai": "enabled" if OPENAI_API_KEY else "disabled"
    }

@app.post("/api/auth/verify", response_model=UserResponse)
async def verify_user(
    current_user: User = Depends(get_current_user)
):
    """Verify Firebase token and return user data"""
    return UserResponse(
        id=current_user.id,
        firebase_uid=current_user.firebase_uid,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at
    )

@app.post("/api/voice-to-text", response_model=VoiceTranscriptionResponse)
async def voice_to_text(
    audio: UploadFile = File(...),
    participant_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Voice to text endpoint with RP detection"""
    try:
        # Validate participant
        participant = db.query(Participant).filter(Participant.id == participant_id).first()
        if not participant:
            raise HTTPException(status_code=404, detail="Participant not found")
        
        # Read audio data
        audio_data = await audio.read()
        
        # Save audio temporarily with proper extension
        file_extension = ".wav"
        if audio.filename:
            file_extension = os.path.splitext(audio.filename)[1] or ".wav"
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            tmp_file.write(audio_data)
            tmp_path = tmp_file.name
        
        try:
            # Transcribe audio
            if whisper_model:
                try:
                    result = whisper_model.transcribe(tmp_path)
                    transcribed_text = result["text"].strip()
                except Exception as e:
                    logger.error(f"Whisper transcription error: {e}")
                    # Fallback transcription for demo
                    transcribed_text = "This is a demo transcription. The participant completed their daily activities without any issues."
            else:
                # Mock transcription for testing
                transcribed_text = "This is a demo transcription. The participant completed their daily activities without any issues."
            
            # Estimate duration (rough calculation)
            audio_duration = max(1, len(audio_data) // 16000)  # Approximate for 16kHz audio
            
            if not transcribed_text:
                raise HTTPException(status_code=400, detail="No speech detected")
            
            # Analyze with GPT-4
            analysis = await analyze_with_gpt4(transcribed_text)
            
            # Create note
            note = Note(
                participant_id=participant_id,
                user_id=current_user.id,
                text=transcribed_text,
                rp_flag=analysis["rp_flag"],
                gpt_response=json.dumps(analysis),
                audio_duration=audio_duration
            )
            
            db.add(note)
            db.commit()
            db.refresh(note)
            
            # Check for training triggers
            needs_training = await check_training_triggers(current_user.id, db)
            
            return VoiceTranscriptionResponse(
                note_id=note.id,
                participant_id=note.participant_id,
                user_id=note.user_id,
                transcribed_text=note.text,
                timestamp=note.timestamp,
                rp_flag=note.rp_flag,
                audio_duration=audio_duration
            )
            
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except:
                pass
            
    except Exception as e:
        logger.error(f"Voice transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notes", response_model=NoteResponse)
async def create_note(
    note: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a text note with GPT-4 analysis"""
    # Validate participant
    participant = db.query(Participant).filter(Participant.id == note.participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Analyze with GPT-4
    analysis = await analyze_with_gpt4(note.text)
    
    # Create note
    db_note = Note(
        participant_id=note.participant_id,
        user_id=current_user.id,
        text=note.text,
        rp_flag=analysis["rp_flag"],
        gpt_response=json.dumps(analysis),
        audio_duration=note.audio_duration
    )
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    # Check for training triggers
    needs_training = await check_training_triggers(current_user.id, db)
    
    return NoteResponse(
        id=db_note.id,
        participant_id=db_note.participant_id,
        user_id=db_note.user_id,
        text=db_note.text,
        timestamp=db_note.timestamp,
        rp_flag=db_note.rp_flag,
        gpt_response=db_note.gpt_response,
        participant_name=participant.name,
        user_name=current_user.name,
        audio_duration=db_note.audio_duration
    )

@app.get("/api/notes", response_model=List[NoteResponse])
async def get_notes(
    participant_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notes with mobile-optimized pagination"""
    query = db.query(Note)
    
    if participant_id:
        query = query.filter(Note.participant_id == participant_id)
    
    # Order by newest first
    query = query.order_by(desc(Note.timestamp))
    
    notes = query.offset(skip).limit(limit).all()
    
    # Mobile-optimized response
    response_notes = []
    for note in notes:
        response_notes.append(NoteResponse(
            id=note.id,
            participant_id=note.participant_id,
            user_id=note.user_id,
            text=note.text,
            timestamp=note.timestamp,
            rp_flag=note.rp_flag,
            gpt_response=note.gpt_response,
            participant_name=note.participant.name if note.participant else None,
            user_name=note.user.name if note.user else None,
            audio_duration=note.audio_duration
        ))
    
    return response_notes

@app.get("/api/participants", response_model=List[ParticipantResponse])
async def get_participants(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all participants with note counts"""
    participants = db.query(Participant).all()
    
    response = []
    for p in participants:
        notes_count = db.query(Note).filter(Note.participant_id == p.id).count()
        response.append(ParticipantResponse(
            id=p.id,
            name=p.name,
            created_at=p.created_at,
            notes_count=notes_count
        ))
    
    return response

@app.post("/api/participants", response_model=ParticipantResponse)
async def create_participant(
    participant: ParticipantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new participant"""
    db_participant = Participant(name=participant.name)
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)
    
    return ParticipantResponse(
        id=db_participant.id,
        name=db_participant.name,
        created_at=db_participant.created_at,
        notes_count=0
    )

@app.post("/api/ask-nova", response_model=AskNovaResponse)
async def ask_nova(
    request: AskNovaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Nova AI Assistant with GPT-4 powered responses"""
    try:
        # Create thread for conversation context
        thread = openai_client.beta.threads.create()
        
        # Add context if participant is specified
        context_msg = ""
        if request.context.get("participant_id"):
            participant = db.query(Participant).filter(
                Participant.id == request.context["participant_id"]
            ).first()
            if participant:
                context_msg = f"Context: Question about participant {participant.name}. "
        
        # Add message to thread
        message = openai_client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=f"{context_msg}Support worker question: {request.question}"
        )
        
        # Run the assistant
        run = openai_client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=ASSISTANT_ID
        )
        
        # Wait for completion
        while run.status != "completed":
            run = openai_client.beta.threads.runs.retrieve(
                thread_id=thread.id,
                run_id=run.id
            )
            if run.status == "failed":
                raise Exception("Assistant run failed")
        
        # Get the response
        messages = openai_client.beta.threads.messages.list(thread_id=thread.id)
        response = messages.data[0].content[0].text.value
        
        # Parse JSON response
        result = json.loads(response)
        
        # Log the query
        query_log = QueryLog(
            user_id=current_user.id,
            text=request.question,
            response=result["response"],
            intent_type=result.get("intent", "question"),
            thread_id=thread.id
        )
        db.add(query_log)
        db.commit()
        
        # Check for training triggers
        needs_training = await check_training_triggers(current_user.id, db)
        
        return AskNovaResponse(
            response=result["response"],
            tags=result.get("tags", []),
            intent=result.get("intent", "advice"),
            rp_flag=result.get("rp_flag", False),
            alternatives=result.get("alternatives", [])
        )
        
    except Exception as e:
        logger.error(f"Nova error: {str(e)}")
        # Fallback response
        question_lower = request.question.lower()
        
        if any(word in question_lower for word in ['block', 'lock', 'restrain', 'force']):
            response = AskNovaResponse(
                response=(
                    "⚠️ This involves restrictive practices:\n\n"
                    "✓ Use verbal de-escalation\n"
                    "✓ Consider least restrictive approach\n"
                    "✓ Document thoroughly\n"
                    "✓ Seek supervisor guidance"
                ),
                tags=["restrictive practice", "de-escalation"],
                intent="warning",
                rp_flag=True,
                alternatives=[
                    "Verbal de-escalation techniques",
                    "Environmental modifications",
                    "Offering choices",
                    "Supervisor consultation"
                ]
            )
        else:
            response = AskNovaResponse(
                response=(
                    "📋 Key Principles:\n\n"
                    "✓ Prioritize dignity & choice\n"
                    "✓ Person-centered approach\n"
                    "✓ Build trust consistently\n"
                    "✓ Document interactions\n"
                    "✓ Consult team when unsure"
                ),
                tags=["general"],
                intent="advice"
            )
        
        return response

@app.get("/api/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics with training prompt status"""
    total_notes = db.query(Note).count()
    rp_notes = db.query(Note).filter(Note.rp_flag == True).count()
    my_notes = db.query(Note).filter(Note.user_id == current_user.id).count()
    participants = db.query(Participant).count()
    
    # Check if user needs training
    needs_training = await check_training_triggers(current_user.id, db)
    
    return {
        "total_notes": total_notes,
        "rp_incidents": rp_notes,
        "my_notes": my_notes,
        "participants": participants,
        "rp_percentage": round((rp_notes / total_notes * 100) if total_notes > 0 else 0, 1),
        # "needs_training": needs_training
    }
# Add these training endpoints after existing endpoints (around line 600)

@app.get("/api/training-modules")
async def get_training_modules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available training modules with completion status"""
    modules = []
    
    for module_id, module_data in TRAINING_MODULES.items():
        completed = has_completed_training(current_user.id, module_id, db)
        modules.append({
            "id": module_data["id"],
            "title": module_data["title"], 
            "description": module_data["description"],
            "duration": module_data["duration"],
            "completed": completed,
            "sections_count": len(module_data["sections"])
        })
    
    return {"modules": modules}

@app.get("/api/training-modules/{module_id}")
async def get_training_module(
    module_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific training module content"""
    if module_id not in TRAINING_MODULES:
        raise HTTPException(status_code=404, detail="Training module not found")
    
    module = TRAINING_MODULES[module_id].copy()
    module["completed"] = has_completed_training(current_user.id, module_id, db)
    
    return module

@app.post("/api/training-complete")
async def complete_training(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark training module as completed"""
    module_id = request.get("module_id")
    score = request.get("score", 100)  # Default score if no quiz
    
    if module_id not in TRAINING_MODULES:
        raise HTTPException(status_code=404, detail="Training module not found")
    
    # Check if already completed
    existing = db.query(TrainingCompletion).filter(
        and_(
            TrainingCompletion.user_id == current_user.id,
            TrainingCompletion.module_id == module_id
        )
    ).first()
    
    if existing:
        return {"message": "Training already completed", "completed_at": existing.completed_at}
    
    # Create completion record
    completion = TrainingCompletion(
        user_id=current_user.id,
        module_id=module_id,
        score=score
    )
    
    db.add(completion)
    db.commit()
    db.refresh(completion)
    
    return {
        "message": "Training completed successfully",
        "module_id": module_id,
        "completed_at": completion.completed_at,
        "score": score
    }

@app.get("/api/training-progress")
async def get_training_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's training progress and recommendations"""
    total_modules = len(TRAINING_MODULES)
    completed_modules = db.query(TrainingCompletion).filter(
        TrainingCompletion.user_id == current_user.id
    ).count()
    
    recommended_modules = get_recommended_modules(current_user.id, db)
    
    return {
        "total_modules": total_modules,
        "completed_modules": completed_modules,
        "completion_percentage": round((completed_modules / total_modules) * 100, 1),
        "recommended_modules": recommended_modules,
        "needs_training": len(recommended_modules) > 0
    }
@app.get("/api/training-status")
async def get_training_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user needs training with specific recommendations"""
    needs_training = await check_training_triggers(current_user.id, db)
    
    if needs_training:
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        # Get details for training prompt
        rp_notes = db.query(Note).filter(
            and_(
                Note.user_id == current_user.id,
                Note.timestamp >= twenty_four_hours_ago,
                Note.rp_flag == True
            )
        ).count()
        
        queries = db.query(QueryLog).filter(
            and_(
                QueryLog.user_id == current_user.id,
                QueryLog.timestamp >= twenty_four_hours_ago
            )
        ).count()
        
        # Get recommended modules
        recommended_modules = get_recommended_modules(current_user.id, db)
        
        # Get module details for recommendations
        modules_info = []
        for module_id in recommended_modules:
            if module_id in TRAINING_MODULES:
                module = TRAINING_MODULES[module_id]
                modules_info.append({
                    "id": module_id,
                    "title": module["title"],
                    "duration": module["duration"],
                    "description": module["description"]
                })
        
        return {
            "needs_training": True,
            "rp_incidents": rp_notes,
            "queries": queries,
            "message": f"You've had {rp_notes + queries} incidents/queries in 24hrs. Training recommended.",
            "recommended_modules": modules_info,
            "priority": "high" if rp_notes >= 2 else "medium"
        }
    
    return {"needs_training": False, "message": "No training needed at this time"}

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host=os.getenv("API_HOST", "0.0.0.0"), 
        port=int(os.getenv("API_PORT", "8000"))
    )
