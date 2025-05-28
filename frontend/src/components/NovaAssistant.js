import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  Avatar,
  InputAdornment,
  Slide,
  Fade,
  useTheme,
  useMediaQuery,
  LinearProgress
} from '@mui/material';
import {
  Close,
  Send,
  SmartToy,
  Person,
  ContentCopy,
  Mic,
  Psychology,
  School,
  Warning,
  Lightbulb,
  QuestionAnswer,
  Stop,
  FiberManualRecord,
  MicOff
} from '@mui/icons-material';
import { ReactMediaRecorder } from 'react-media-recorder';
import { toast } from 'react-toastify';
import api from '../services/api';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function NovaAssistant({ open, onClose, participants, onSuccess, initialQuery = '' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasProcessedInitialQuery = useRef(false);
  const recordingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) {
      if (messages.length === 0) {
        // Initial greeting
        setMessages([{
          id: Date.now(),
          text: "Hi! I'm Nova, your AI assistant. I can help with:\n\n• Questions about participant care\n• Restrictive practice guidance\n• De-escalation techniques\n• Best practices and training\n\nHow can I assist you today?",
          sender: 'nova',
          timestamp: new Date(),
          type: 'greeting'
        }]);
      }
      
      // If there's an initial query from "Hey Nova", process it automatically
      if (initialQuery && initialQuery.trim() && !hasProcessedInitialQuery.current) {
        hasProcessedInitialQuery.current = true;
        // Give a small delay to show the greeting first
        setTimeout(() => {
          handleSendMessage(initialQuery, false);
        }, 800);
      }
    } else {
      // Reset when dialog closes
      hasProcessedInitialQuery.current = false;
      setIsRecording(false);
      setRecordingDuration(0);
      setIsTranscribing(false);
    }
  }, [open, initialQuery]);

  const handleSendMessage = async (messageText = inputText, isVoiceMessage = false) => {
    if (!messageText.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      isVoice: isVoiceMessage // Mark if this was a voice message
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.post('/api/ask-nova', {
        question: messageText,
        context: selectedContext ? { participant_id: selectedContext.id } : {}
      });

      const novaMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'nova',
        timestamp: new Date(),
        tags: response.data.tags,
        intent: response.data.intent,
        rp_flag: response.data.rp_flag,
        alternatives: response.data.alternatives
      };

      setMessages(prev => [...prev, novaMessage]);

      if (response.data.rp_flag) {
        toast.warning('⚠️ Restrictive practice concern identified');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Nova API error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting. Please try again.",
        sender: 'nova',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get response from Nova');
    } finally {
      setLoading(false);
    }
  };

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingDuration(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Custom transcription function for Nova
  const transcribeAudioForNova = async (audioBlob) => {
    try {
      // For Nova, we'll use a simple approach - either create a special endpoint
      // or use the existing one with a dummy participant
      const formData = new FormData();
      const audioFile = new File([audioBlob], 'nova-voice.wav', { type: 'audio/wav' });
      formData.append('audio', audioFile);
      
      // Use the first participant as a dummy for transcription purposes
      // The backend should handle this gracefully
      if (participants.length > 0) {
        formData.append('participant_id', participants[0].id);
      } else {
        // If no participants, we need to handle this differently
        throw new Error('No participants available for voice transcription');
      }

      console.log('Sending voice transcription request for Nova...');
      const response = await api.post('/api/voice-to-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30 second timeout for transcription
      });

      return response.data.transcribed_text;
    } catch (error) {
      console.error('Voice transcription error:', error);
      
      if (error.response?.status === 422) {
        throw new Error('Voice transcription service unavailable. Please type your question instead.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Transcription timeout. Please try a shorter message.');
      } else {
        throw new Error('Voice transcription failed. Please try again.');
      }
    }
  };

  const handleVoiceInput = async (blobUrl, blob) => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);
      
      toast.info('Transcribing your voice...', { autoClose: 2000 });

      const transcribedText = await transcribeAudioForNova(blob);
      
      if (transcribedText && transcribedText.trim()) {
        // Automatically send the transcribed message
        handleSendMessage(transcribedText.trim(), true); // true indicates it's a voice message
        toast.success('Voice message transcribed!', { autoClose: 1000 });
      } else {
        toast.error('No speech detected. Please try again.');
      }
    } catch (error) {
      console.error('Voice input error:', error);
      toast.error(error.message || 'Voice transcription failed. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      text: "Chat cleared. How can I help you?",
      sender: 'nova',
      timestamp: new Date()
    }]);
  };

  const suggestedQuestions = [
    { icon: <Warning />, text: "What are alternatives to blocking doors?", category: "rp" },
    { icon: <Psychology />, text: "How to handle medication refusal?", category: "behavior" },
    { icon: <Lightbulb />, text: "De-escalation techniques for agitation", category: "technique" },
    { icon: <School />, text: "What constitutes restrictive practice?", category: "training" }
  ];

  const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';
    
    return (
      <ListItem
        sx={{
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          mb: 2,
          px: 0
        }}
      >
        <Avatar
          sx={{
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            ml: isUser ? 2 : 0,
            mr: isUser ? 0 : 2
          }}
        >
          {isUser ? <Person /> : <SmartToy />}
        </Avatar>
        
        <Paper
          elevation={1}
          sx={{
            p: 2,
            maxWidth: '75%',
            bgcolor: isUser ? 'primary.light' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            position: 'relative'
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {message.text}
          </Typography>
          
          {message.isVoice && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Mic sx={{ fontSize: 14, opacity: 0.6 }} />
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Voice message
              </Typography>
            </Box>
          )}
          
          {message.rp_flag && (
            <Alert 
              severity="warning" 
              sx={{ mt: 2 }}
              icon={<Warning />}
            >
              Restrictive practice concern
            </Alert>
          )}
          
          {message.alternatives && message.alternatives.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Suggested alternatives:
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {message.alternatives.map((alt, i) => (
                  <Chip
                    key={i}
                    label={alt}
                    size="small"
                    sx={{ 
                      height: 'auto',
                      py: 0.5,
                      '& .MuiChip-label': { whiteSpace: 'normal' }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {message.tags && message.tags.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {message.tags.map((tag, i) => (
                <Chip
                  key={i}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          )}
          
          <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </Typography>
            {!isUser && (
              <IconButton 
                size="small" 
                onClick={() => copyToClipboard(message.text)}
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Paper>
      </ListItem>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Transition}
      PaperProps={{
        sx: { 
          height: isMobile ? '100%' : '90vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          m: isMobile ? 0 : 1
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'secondary.main',
          color: 'white'
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'secondary.dark' }}>
                <SmartToy />
              </Avatar>
              <Box>
                <Typography variant="h6">Nova AI Assistant</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Powered by GPT-4
                </Typography>
              </Box>
            </Box>
            <Box>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Context Selection */}
        {participants.length > 0 && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select context (optional):
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label="General"
                onClick={() => setSelectedContext(null)}
                color={!selectedContext ? 'primary' : 'default'}
                size="small"
              />
              {participants.slice(0, 4).map(p => (
                <Chip
                  key={p.id}
                  avatar={<Avatar sx={{ width: 20, height: 20 }}>{p.name[0]}</Avatar>}
                  label={p.name.split(' ')[0]}
                  onClick={() => setSelectedContext(p)}
                  color={selectedContext?.id === p.id ? 'primary' : 'default'}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Messages */}
        <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {(loading || isTranscribing) && (
            <ListItem sx={{ px: 0 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                <SmartToy />
              </Avatar>
              <Box display="flex" alignItems="center">
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography color="text.secondary">
                  {isTranscribing ? 'Transcribing your voice...' : 'Nova is thinking...'}
                </Typography>
              </Box>
            </ListItem>
          )}
          
          <div ref={messagesEndRef} />
        </List>

        {/* Suggested Questions - Compact */}
        {messages.length === 1 && !isRecording && !isTranscribing && (
          <Fade in>
            <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
                {suggestedQuestions.slice(0, 2).map((q, i) => (
                  <Chip
                    key={i}
                    label={q.text.length > 30 ? q.text.substring(0, 30) + '...' : q.text}
                    onClick={() => handleSendMessage(q.text, false)}
                    disabled={loading}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Fade>
        )}

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          {isRecording ? (
            // Recording Interface
            <ReactMediaRecorder
              audio
              onStop={handleVoiceInput}
              render={({ status, startRecording, stopRecording }) => {
                // Start recording when entering this mode
                useEffect(() => {
                  if (isRecording && status === 'idle') {
                    startRecording();
                  }
                }, [isRecording, status, startRecording]);
                
                return (
                  <Box>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        bgcolor: 'error.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FiberManualRecord 
                            sx={{ 
                              color: 'error.main',
                              animation: 'blink 1s infinite'
                            }} 
                          />
                          <Typography variant="body1" color="error.main" fontWeight="medium">
                            Recording...
                          </Typography>
                        </Box>
                        <Typography variant="h6" fontFamily="monospace" color="error.main">
                          {formatTime(recordingDuration)}
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Stop />}
                        onClick={() => {
                          console.log('Stopping recording...');
                          stopRecording();
                        }}
                      >
                        Stop & Send
                      </Button>
                    </Paper>
                    
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                      Speak your question clearly, then click "Stop & Send"
                    </Typography>
                  </Box>
                );
              }}
            />
          ) : isTranscribing ? (
            // Transcribing Interface
            <Box textAlign="center" py={2}>
              <CircularProgress size={30} sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Transcribing your voice...
              </Typography>
              <LinearProgress sx={{ mt: 2 }} />
            </Box>
          ) : (
            // Normal Input Interface
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask Nova anything..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={loading || isTranscribing}
                multiline
                maxRows={3}
                inputRef={inputRef}
                size="small"
                InputProps={{
                  sx: { borderRadius: 3 },
                  endAdornment: (
                    <InputAdornment position="end">
                      {participants.length > 0 ? (
                        <ReactMediaRecorder
                          audio
                          onStop={handleVoiceInput}
                          render={({ status, startRecording, stopRecording }) => (
                            <IconButton
                              onClick={() => {
                                if (status === 'recording') {
                                  stopRecording();
                                  setIsRecording(false);
                                } else {
                                  // Clear any existing text when starting recording
                                  setInputText('');
                                  startRecording();
                                  setIsRecording(true);
                                  // Haptic feedback if available
                                  if ('vibrate' in navigator) {
                                    navigator.vibrate(50);
                                  }
                                  toast.info('Recording started - speak clearly', { autoClose: 1500 });
                                }
                              }}
                              color={status === 'recording' ? 'error' : 'default'}
                              size="small"
                              title="Click to record voice message"
                              disabled={loading || isTranscribing}
                            >
                              <Mic />
                            </IconButton>
                          )}
                        />
                      ) : (
                        <IconButton
                          size="small"
                          disabled
                          title="Voice recording requires participants to be loaded"
                        >
                          <MicOff />
                        </IconButton>
                      )}
                    </InputAdornment>
                  )
                }}
              />
              
              <Button
                variant="contained"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || loading}
                sx={{ 
                  minWidth: 48,
                  borderRadius: 3
                }}
              >
                <Send />
              </Button>
            </Box>
          )}
          
          {!isRecording && !isTranscribing && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              {participants.length > 0 ? (
                <>
                  <Mic sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Click mic to record, or type your question
                  </Typography>
                </>
              ) : (
                <>
                  <MicOff sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Voice recording unavailable - please type your question
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </Dialog>
  );
}

export default NovaAssistant;