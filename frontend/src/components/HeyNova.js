import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Chip,
  Fade,
  Paper,
  Typography,
  CircularProgress,
  Button
} from '@mui/material';
import {
  MicOff,
  VolumeUp,
  SmartToy
} from '@mui/icons-material';
import { toast } from 'react-toastify';

function HeyNova({ onActivate }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasAttemptedAutoStart, setHasAttemptedAutoStart] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  // Check for browser support
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Check if microphone permission is already granted
  useEffect(() => {
    if (!isSupported) return;
    
    // Check if we should show welcome message
    const welcomeShown = localStorage.getItem('careiq_voice_welcome_shown');
    if (!welcomeShown) {
      setShowWelcome(true);
    }
    
    // Check permission status if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            setHasPermission(true);
            console.log('Microphone permission already granted');
          }
        })
        .catch(() => {
          // Permissions API not supported or failed
          console.log('Cannot check microphone permission status');
        });
    }
  }, [isSupported]);

  // Auto-start listening on mount if previously enabled
  useEffect(() => {
    if (!isSupported) {
      setIsInitializing(false);
      return;
    }
    
    if (hasAttemptedAutoStart) return;
    
    // Check if user previously enabled voice
    const previouslyEnabled = localStorage.getItem('careiq_voice_enabled') === 'true';
    
    if (previouslyEnabled) {
      // Check if we have permission first
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' })
          .then(async (permissionStatus) => {
            setHasAttemptedAutoStart(true);
            
            if (permissionStatus.state === 'granted') {
              // We have permission, start immediately
              try {
                await startListening();
                setIsEnabled(true);
                console.log('Voice assistant auto-started successfully');
              } catch (error) {
                console.error('Auto-start failed:', error);
              }
            } else {
              // No permission yet, user will need to click
              console.log('Microphone permission required for auto-start');
            }
            setIsInitializing(false);
          })
          .catch(() => {
            // Fallback: try to start anyway
            setHasAttemptedAutoStart(true);
            setTimeout(async () => {
              try {
                await startListening();
                setIsEnabled(true);
              } catch (error) {
                console.error('Auto-start failed:', error);
              }
              setIsInitializing(false);
            }, 1000);
          });
      } else {
        // No permissions API, try to start after delay
        setTimeout(async () => {
          setHasAttemptedAutoStart(true);
          try {
            await startListening();
            setIsEnabled(true);
          } catch (error) {
            console.error('Auto-start failed:', error);
          }
          setIsInitializing(false);
        }, 1000);
      }
    } else {
      setHasAttemptedAutoStart(true);
      setIsInitializing(false);
    }
  }, [isSupported]); // Remove dependencies to avoid circular issues

  // Wake phrase variations for better detection
  const wakePhrasesPatterns = [
    /\b(hey\s*nova|hi\s*nova|okay\s*nova|ok\s*nova)\b/i,
    /\b(nova\s*help|nova\s*assist|nova\s*please)\b/i,
    /\b(activate\s*nova|start\s*nova|nova\s*start)\b/i,
    /\b(wake\s*up\s*nova|nova\s*wake\s*up)\b/i,
    /\b(talk\s*to\s*nova|speak\s*to\s*nova)\b/i,
    // Fuzzy matching for common mispronunciations
    /\b(hey\s*noah|hi\s*noah|hey\s*nova|hey\s*nava)\b/i,
    /\b(hey\s*no\s*va|hi\s*no\s*va)\b/i,
    // Single word activation as fallback
    /\bnova\b/i
  ];

  // Function to check if transcript contains wake phrase
  const containsWakePhrase = (text) => {
    const normalizedText = text.toLowerCase().trim();
    
    // Check each pattern
    for (const pattern of wakePhrasesPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        return {
          found: true,
          match: match[0],
          index: match.index,
          pattern: pattern
        };
      }
    }
    
    // Fuzzy matching for close variations
    const fuzzyPhrases = ['hanova', 'henova', 'haynova', 'hinova', 'heynava'];
    for (const phrase of fuzzyPhrases) {
      if (normalizedText.includes(phrase)) {
        return {
          found: true,
          match: phrase,
          index: normalizedText.indexOf(phrase),
          pattern: 'fuzzy'
        };
      }
    }
    
    return { found: false };
  };

  const startListening = async () => {
    try {
      // First, try to start recognition directly (if permission was already granted)
      if (recognitionRef.current && !isListening) {
        try {
          recognitionRef.current.start();
          console.log('Started speech recognition successfully');
          setHasPermission(true);
          return;
        } catch (e) {
          // If direct start fails, we need to request permission
          console.log('Direct start failed, requesting permission...');
        }
      }
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      
      // Stop the stream after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      if (recognitionRef.current && !isListening) {
        recognitionRef.current.start();
        console.log('Started speech recognition successfully after permission');
      }
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast.error('Please allow microphone access for Hey Nova feature');
      setHasPermission(false);
      localStorage.setItem('careiq_voice_enabled', 'false');
    }
  };

  const restartRecognition = () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    restartTimeoutRef.current = setTimeout(() => {
      if (isEnabled && hasPermission && recognitionRef.current && !isProcessing) {
        try {
          recognitionRef.current.start();
          console.log('Recognition restarted');
        } catch (e) {
          console.log('Recognition restart error:', e);
          // Try again in a second
          setTimeout(() => restartRecognition(), 1000);
        }
      }
    }, 500);
  };

  useEffect(() => {
    // Skip if not supported
    if (!isSupported) {
      return;
    }

    // Check if we're on HTTPS (required for speech recognition)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('Speech recognition requires HTTPS');
      toast.warning('Voice features require HTTPS connection');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5; // Increased for better recognition
    
    recognition.onstart = () => {
      console.log('Hey Nova listening started');
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      // Check all alternatives for better wake phrase detection
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          // Check all alternatives for final results
          for (let j = 0; j < event.results[i].length; j++) {
            const altTranscript = event.results[i][j].transcript.toLowerCase();
            const wakeCheck = containsWakePhrase(altTranscript);
            if (wakeCheck.found) {
              finalTranscript = altTranscript;
              break;
            }
          }
          if (!finalTranscript) {
            finalTranscript = event.results[i][0].transcript.toLowerCase();
          }
        } else {
          interimTranscript = event.results[i][0].transcript.toLowerCase();
        }
      }
      
      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      // Debug log
      if (currentTranscript && currentTranscript.length > 2) {
        console.log('Speech detected:', currentTranscript);
      }
      
      // Check for wake phrase
      const wakeCheck = containsWakePhrase(currentTranscript);
      
      if (wakeCheck.found) {
        console.log('Wake phrase detected!', wakeCheck);
        setIsProcessing(true);
        
        // Extract the query after the wake phrase
        const query = currentTranscript.substring(wakeCheck.index + wakeCheck.match.length).trim();
        
        // Stop recognition temporarily
        recognition.stop();
        
        // Give feedback
        toast.success('Nova activated', { autoClose: 1000 });
        
        // Play a subtle sound if available (optional)
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQ==');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch (e) {}
        
        // Notify parent component
        setTimeout(() => {
          if (query.length > 2) {
            onActivate(query);
          } else {
            onActivate(''); // Open Nova without query
          }
          
          setIsProcessing(false);
          setTranscript('');
          
          // Restart listening after a delay
          setTimeout(() => restartRecognition(), 2000);
        }, 500);
      }
      
      // Clear old transcripts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setTranscript('');
      }, 5000); // Increased timeout for longer phrases
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        setIsEnabled(false);
        localStorage.setItem('careiq_voice_enabled', 'false');
        
        // Show helpful message based on context
        if (!hasAttemptedAutoStart) {
          toast.error('Microphone access required. Please enable it in your browser settings and refresh the page.');
        } else {
          toast.info('Click the microphone icon to enable voice features');
        }
      } else if (event.error === 'no-speech') {
        // This is normal, just restart
        restartRecognition();
      } else if (event.error === 'audio-capture') {
        toast.error('No microphone found. Please check your audio input.');
      } else if (event.error === 'network') {
        toast.error('Network error. Please check your connection.');
        // Try to restart after network error
        setTimeout(() => restartRecognition(), 3000);
      } else if (event.error === 'aborted') {
        // Recognition was aborted, restart if enabled
        restartRecognition();
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      console.log('Recognition ended');
      // Auto-restart if enabled (always listening)
      if (isEnabled && !isProcessing && hasPermission) {
        restartRecognition();
      }
    };
    
    recognitionRef.current = recognition;
    
    // Clean up function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition stop error:', e);
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [onActivate, isProcessing, hasPermission, isEnabled, isSupported]);

  const toggleListening = async () => {
    if (!hasPermission && !isListening) {
      // Request permission first
      await startListening();
      setIsEnabled(true);
      localStorage.setItem('careiq_voice_enabled', 'true');
    } else if (recognitionRef.current) {
      if (isListening) {
        try {
          recognitionRef.current.stop();
          setIsEnabled(false);
          localStorage.setItem('careiq_voice_enabled', 'false');
          toast.info('Voice assistant disabled', { autoClose: 2000 });
        } catch (e) {
          console.log('Stop error:', e);
        }
      } else {
        try {
          await startListening();
          setIsEnabled(true);
          localStorage.setItem('careiq_voice_enabled', 'true');
          toast.success('Voice assistant enabled - Say "Hey Nova"', { autoClose: 2000 });
        } catch (e) {
          console.log('Start error:', e);
        }
      }
    }
  };

  // If not supported, show unsupported message
  if (!isSupported) {
    return (
      <Box sx={{ 
        position: 'fixed', 
        top: 80, 
        left: 16,
        zIndex: 1000
      }}>
        <Chip
          icon={<MicOff />}
          label="Voice not supported"
          color="default"
          variant="outlined"
          size="small"
          disabled
        />
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            mt: 0.5, 
            ml: 1,
            color: 'text.secondary',
            fontSize: '0.7rem'
          }}
        >
          Try Chrome or Edge browser
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Status Indicator */}
      <Box sx={{ 
        position: 'fixed', 
        top: 80, 
        left: 16,
        zIndex: 1000
      }}>
        <Fade in={true}>
          <Chip
            icon={isListening ? <VolumeUp /> : <MicOff />}
            label={
              isListening ? "Say 'Hey Nova'" : 
              isInitializing ? "Initializing..." :
              "Enable voice"
            }
            color={isListening ? "success" : "default"}
            variant={isListening ? "filled" : "outlined"}
            size="small"
            onClick={isInitializing ? undefined : toggleListening}
            disabled={isInitializing}
            sx={{
              animation: isListening ? 'pulse 2s infinite' : 'none',
              cursor: isInitializing ? 'default' : 'pointer',
              '&:hover': !isInitializing ? {
                transform: 'scale(1.05)',
                boxShadow: 2
              } : {},
              transition: 'all 0.2s'
            }}
          />
        </Fade>
        {!isListening && !isInitializing && showWelcome && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mt: 0.5, 
              ml: 1,
              color: 'primary.main',
              fontSize: '0.7rem',
              fontWeight: 'medium'
            }}
          >
            ↑ Click to get started
          </Typography>
        )}
      </Box>

      {/* Processing Indicator */}
      <Fade in={isProcessing}>
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            p: 4,
            textAlign: 'center',
            zIndex: 2000,
            minWidth: 280,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <SmartToy sx={{ fontSize: 64, color: 'white', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="white">
            Nova is listening...
          </Typography>
          <CircularProgress size={30} sx={{ color: 'white' }} />
        </Paper>
      </Fade>

      {/* Debug Transcript (shows what's being heard) */}
      {transcript && transcript.length > 1 && isListening && (
        <Fade in={true}>
          <Box sx={{
            position: 'fixed',
            bottom: 100,
            left: 16,
            right: 16,
            maxWidth: 300,
            mx: 'auto',
            p: 1.5,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 2,
            fontSize: '0.875rem',
            color: containsWakePhrase(transcript).found ? 'success.main' : 'text.secondary',
            zIndex: 900,
            textAlign: 'center',
            border: containsWakePhrase(transcript).found ? '2px solid' : 'none',
            borderColor: 'success.main'
          }}>
            {containsWakePhrase(transcript).found ? '✓ ' : '🎤 '}"{transcript}"
          </Box>
        </Fade>
      )}

      {/* First-time user welcome */}
      {showWelcome && !isListening && (
        <Fade in={true}>
          <Paper
            elevation={3}
            sx={{
              position: 'fixed',
              top: 120,
              left: 16,
              maxWidth: 300,
              p: 2,
              bgcolor: 'info.main',
              color: 'white',
              borderRadius: 2,
              zIndex: 999
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              👋 Welcome to CareIQ Voice!
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              Click the microphone to enable hands-free access to Nova. Just say "Hey Nova" anytime!
            </Typography>
            <Button
              size="small"
              sx={{ color: 'white', textDecoration: 'underline' }}
              onClick={() => {
                setShowWelcome(false);
                localStorage.setItem('careiq_voice_welcome_shown', 'true');
              }}
            >
              Got it
            </Button>
          </Paper>
        </Fade>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% { 
            transform: scale(1); 
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
          }
          100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }
      `}</style>
    </>
  );
}

export default HeyNova;