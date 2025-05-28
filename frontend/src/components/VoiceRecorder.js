import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  IconButton,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  LinearProgress,
  Alert,
  Chip,
  Slide,
  Paper,
  Fade,
  Avatar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close,
  Mic,
  Stop,
  PlayArrow,
  Pause,
  Send,
  Delete,
  Person,
  FiberManualRecord,
  Refresh
} from '@mui/icons-material';
import { ReactMediaRecorder } from 'react-media-recorder';
import { toast } from 'react-toastify';
import api from '../services/api';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function VoiceRecorder({ open, onClose, participants, selectedParticipant, onSuccess, initialMode = 'voice' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [participant, setParticipant] = useState(selectedParticipant?.id || '');
  const [textNote, setTextNote] = useState('');
  const [isTextMode, setIsTextMode] = useState(initialMode === 'text');
  const [loading, setLoading] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);
  const [recorderStatus, setRecorderStatus] = useState('idle');
  
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const startRecordingRef = useRef(null);
  const stopRecordingRef = useRef(null);

  const resetState = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setTextNote('');
    setTranscribedText('');
    setDuration(0);
    setIsPlaying(false);
    setIsRecording(false);
    setShowReview(false);
    setShowTranscription(false);
    setRecorderStatus('idle');
    setIsTextMode(initialMode === 'text');
    if (!selectedParticipant) {
      setParticipant('');
    }
  }, [audioUrl, initialMode, selectedParticipant]);

  useEffect(() => {
    if (selectedParticipant) {
      setParticipant(selectedParticipant.id);
    }
  }, [selectedParticipant]);

  useEffect(() => {
    if (open) {
      setIsTextMode(initialMode === 'text');
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  useEffect(() => {
    // Timer for recording duration
    if (isRecording) {
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = useCallback(() => {
    console.log('Starting recording...');
    if (!participant) {
      toast.error('Please select a participant first');
      return;
    }
    
    if (startRecordingRef.current) {
      startRecordingRef.current();
      setIsRecording(true);
      setDuration(0);
      console.log('Recording started');
    } else {
      console.error('Start recording function not available');
      toast.error('Recording not available. Please refresh and try again.');
    }
  }, [participant]);

  const handleStopRecording = useCallback(() => {
    console.log('Stopping recording...');
    if (stopRecordingRef.current) {
      stopRecordingRef.current();
      setIsRecording(false);
      console.log('Recording stopped');
    } else {
      console.error('Stop recording function not available');
    }
  }, []);

  const handleVoiceStop = useCallback((blobUrl, blob) => {
    console.log('Voice recording stopped, processing...', {
      blobUrl,
      blobSize: blob?.size,
      blobType: blob?.type
    });
    
    if (!blob || blob.size === 0) {
      console.error('Invalid audio blob received');
      toast.error('Recording failed. Please try again.');
      resetState();
      return;
    }
    
    setAudioBlob(blob);
    setAudioUrl(blobUrl);
    setShowReview(true);
    setRecorderStatus('idle');
    console.log('Audio ready for review');
  }, [resetState]);

  const handlePlay = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            console.log('Audio playback started');
          })
          .catch(error => {
            console.error('Audio play error:', error);
            toast.error('Failed to play audio. The recording might be corrupted.');
          });
      }
    } else {
      console.error('Audio element or URL not available');
    }
  };

  const handleAudioEnded = () => {
    console.log('Audio playback ended');
    setIsPlaying(false);
  };

  const handleDelete = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscribedText('');
    setDuration(0);
    setIsPlaying(false);
    setShowReview(false);
    setShowTranscription(false);
    setRecorderStatus('idle');
  };

  const handleRetryRecording = () => {
    handleDelete();
    setTimeout(() => {
      console.log('Ready for new recording');
    }, 100);
  };

  const handlePreviewTranscription = async () => {
    if (!audioBlob || !participant) {
      toast.error('Audio or participant missing');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const audioFile = new File([audioBlob], 'preview.wav', { 
        type: audioBlob.type || 'audio/wav' 
      });
      formData.append('audio', audioFile);
      formData.append('participant_id', participant);

      console.log('Sending transcription preview request...', {
        fileSize: audioFile.size,
        fileType: audioFile.type
      });
      
      const response = await api.post('/api/voice-to-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setTranscribedText(response.data.transcribed_text);
      setShowTranscription(true);
      
      if (response.data.rp_flag) {
        toast.warning('⚠️ Restrictive practice detected in preview');
      } else {
        toast.success('Transcription preview ready');
      }
    } catch (error) {
      console.error('Preview transcription error:', error);
      if (error.response?.status === 422) {
        toast.error('Invalid audio format or missing data');
      } else {
        toast.error('Failed to transcribe audio. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!participant) {
      toast.error('Please select a participant');
      return;
    }

    setLoading(true);

    try {
      if (isTextMode) {
        if (!textNote.trim()) {
          toast.error('Please enter a note');
          setLoading(false);
          return;
        }

        const response = await api.post('/api/notes', {
          participant_id: participant,
          text: textNote.trim()
        });

        if (response.data.rp_flag) {
          toast.warning('⚠️ Restrictive practice detected');
        } else {
          toast.success('Text note saved successfully');
        }
      } else {
        if (!audioBlob) {
          toast.error('Please record audio first');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        const audioFile = new File([audioBlob], 'recording.wav', { 
          type: audioBlob.type || 'audio/wav' 
        });
        formData.append('audio', audioFile);
        formData.append('participant_id', participant);

        console.log('Submitting voice note...', {
          participantId: participant,
          fileSize: audioFile.size,
          fileType: audioFile.type
        });

        const response = await api.post('/api/voice-to-text', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.rp_flag) {
          toast.warning('⚠️ Restrictive practice detected in note');
        } else {
          toast.success('Voice note saved successfully');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      if (error.response?.status === 422) {
        toast.error('Invalid submission data. Please check your input.');
      } else if (error.response?.status === 413) {
        toast.error('Audio file too large. Please record a shorter message.');
      } else {
        toast.error('Failed to save note. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getParticipantInfo = (participantId) => {
    return participants.find(p => p.id === participantId);
  };

  const selectedParticipantInfo = participant ? getParticipantInfo(participant) : null;

  const getDialogTitle = () => {
    if (isTextMode) return 'Create Text Note';
    if (showReview) return 'Review Voice Note';
    return 'Create Voice Note';
  };

  // Voice Recording UI Component
  const VoiceRecordingUI = ({ status, startRecording, stopRecording }) => {
    // Update refs when functions change
    useEffect(() => {
      startRecordingRef.current = startRecording;
      stopRecordingRef.current = stopRecording;
      setRecorderStatus(status);
      console.log('Recorder status updated:', status);
    }, [startRecording, stopRecording, status]);

    return (
      <Box>
        {!showReview ? (
          // Start Recording UI
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Record your voice note about the participant. Speak clearly and include relevant details.
            </Alert>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 6, 
                textAlign: 'center', 
                bgcolor: 'grey.50',
                borderRadius: 3,
                mb: 3
              }}
            >
              <IconButton
                onClick={handleStartRecording}
                disabled={!participant || status === 'recording'}
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: participant ? 'primary.main' : 'grey.300',
                  color: 'white',
                  mb: 2,
                  '&:hover': { 
                    bgcolor: participant ? 'primary.dark' : 'grey.400',
                    transform: participant ? 'scale(1.05)' : 'none'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <Mic sx={{ fontSize: 60 }} />
              </IconButton>
              <Typography variant="body1" color={participant ? "text.primary" : "text.secondary"}>
                {participant ? `Tap to start recording (Status: ${status})` : "Select a participant first"}
              </Typography>
            </Paper>
          </Box>
        ) : (
          // Audio Preview
          <Box>
            <Alert 
              severity="success" 
              icon={<Mic />}
              sx={{ mb: 3 }}
            >
              Voice note recorded successfully ({formatTime(duration)})
            </Alert>
            
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              onEnded={handleAudioEnded}
              onError={(e) => {
                console.error('Audio error:', e);
                toast.error('Audio playback error');
              }}
            />
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                bgcolor: 'grey.50',
                borderRadius: 2,
                mb: 3
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton 
                  onClick={handlePlay} 
                  color="primary"
                  sx={{ bgcolor: 'primary.100' }}
                  disabled={!audioUrl}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                
                <Box flex={1}>
                  <Typography variant="body2" fontWeight="medium">
                    {isPlaying ? 'Playing...' : 'Review your recording'}
                  </Typography>
                  <LinearProgress 
                    variant={isPlaying ? "indeterminate" : "determinate"} 
                    value={0}
                    sx={{ mt: 1 }}
                  />
                </Box>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePreviewTranscription}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : null}
                >
                  Preview Text
                </Button>
                
                <IconButton onClick={handleRetryRecording} color="warning" title="Record again">
                  <Refresh />
                </IconButton>
                
                <IconButton onClick={handleDelete} color="error" title="Delete recording">
                  <Delete />
                </IconButton>
              </Box>
            </Paper>

            {/* Transcription Preview */}
            {showTranscription && transcribedText && (
              <Fade in>
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                  <Typography variant="subtitle2" color="info.main" gutterBottom>
                    Transcription Preview:
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {transcribedText}
                  </Typography>
                </Paper>
              </Fade>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      {/* Full Screen Recording Dialog */}
      <Dialog
        fullScreen
        open={open && isRecording && !isTextMode}
        TransitionComponent={Transition}
        sx={{ '& .MuiDialog-paper': { bgcolor: 'grey.900' } }}
      >
        <Box sx={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          color: 'white'
        }}>
          {/* Header */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton onClick={() => {
              handleStopRecording();
              onClose();
            }} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
            <Typography variant="h6">Recording Voice Note</Typography>
            <Box width={40} />
          </Box>

          {/* Main Content */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            px: 4
          }}>
            {/* Recording Animation */}
            <Box sx={{ position: 'relative', mb: 6 }}>
              <Box sx={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                bgcolor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation: 'pulse 2s infinite'
              }}>
                <Mic sx={{ fontSize: 64 }} />
              </Box>
              <FiberManualRecord 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0,
                  color: 'error.main',
                  animation: 'blink 1s infinite'
                }} 
              />
            </Box>

            {/* Timer */}
            <Typography variant="h2" sx={{ mb: 2, fontFamily: 'monospace' }}>
              {formatTime(duration)}
            </Typography>

            {/* Participant Info */}
            {selectedParticipantInfo && (
              <Chip
                avatar={<Avatar>{selectedParticipantInfo.name[0]}</Avatar>}
                label={`Recording for ${selectedParticipantInfo.name}`}
                sx={{ mb: 6, bgcolor: 'rgba(255,255,255,0.1)' }}
              />
            )}

            {/* Stop Button */}
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<Stop />}
              onClick={handleStopRecording}
              sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
            >
              Stop Recording
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Speak clearly about the participant's activities, behaviors, and observations
            </Typography>
          </Box>
        </Box>

        <style jsx global>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}</style>
      </Dialog>

      {/* Main Dialog - For setup and review */}
      <Dialog 
        open={open && !isRecording} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={Transition}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: isTextMode ? 'secondary.main' : 'primary.main',
            color: 'white'
          }}>
            <Typography variant="h6">
              {getDialogTitle()}
            </Typography>
            <IconButton onClick={onClose} disabled={loading} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Participant Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Participant *</InputLabel>
              <Select
                value={participant}
                onChange={(e) => setParticipant(e.target.value)}
                label="Select Participant *"
                disabled={loading}
                startAdornment={
                  selectedParticipantInfo && (
                    <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                      {selectedParticipantInfo.name[0]}
                    </Avatar>
                  )
                }
              >
                {participants.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {p.name[0]}
                      </Avatar>
                      {p.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Mode Toggle */}
            <Box display="flex" gap={1} mb={3} justifyContent="center">
              <Chip
                icon={<Mic />}
                label="Voice Note"
                onClick={() => {
                  setIsTextMode(false);
                  setTextNote('');
                }}
                color={!isTextMode ? 'primary' : 'default'}
                variant={!isTextMode ? 'filled' : 'outlined'}
                sx={{ px: 2 }}
                disabled={showReview}
              />
              <Chip
                icon={<Person />}
                label="Text Note"
                onClick={() => {
                  setIsTextMode(true);
                  handleDelete();
                }}
                color={isTextMode ? 'secondary' : 'default'}
                variant={isTextMode ? 'filled' : 'outlined'}
                sx={{ px: 2 }}
              />
            </Box>

            {isTextMode ? (
              // Text Mode
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Write your progress note about the participant's activities and behaviors.
                </Alert>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Enter your note"
                  value={textNote}
                  onChange={(e) => setTextNote(e.target.value)}
                  variant="outlined"
                  disabled={loading}
                  placeholder="Describe the participant's activities, behaviors, or any important observations..."
                  sx={{ mb: 3 }}
                />
              </Box>
            ) : (
              // Voice Mode with ReactMediaRecorder
              <ReactMediaRecorder
                audio
                onStop={handleVoiceStop}
                render={({ status, startRecording, stopRecording }) => (
                  <VoiceRecordingUI 
                    status={status} 
                    startRecording={startRecording} 
                    stopRecording={stopRecording} 
                  />
                )}
              />
            )}

            {/* Action Buttons */}
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button 
                onClick={onClose} 
                disabled={loading}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={loading || !participant || (isTextMode ? !textNote.trim() : !audioBlob)}
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                color={isTextMode ? 'secondary' : 'primary'}
              >
                {loading ? 'Saving...' : `Save ${isTextMode ? 'Text' : 'Voice'} Note`}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VoiceRecorder;