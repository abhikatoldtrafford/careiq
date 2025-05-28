import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Alert,
  Skeleton,
  useMediaQuery,
  useTheme,
  Fab,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Button,
  Card,
  CardContent,
  Badge,
  Snackbar
} from '@mui/material';
import {
  Mic,
  Add,
  Warning,
  SmartToy,
  TrendingUp,
  Assignment,
  Group,
  Menu as MenuIcon,
  PlayArrow,
  Pause,
  AccessTime,
  Download,
  BarChart,
  Settings,
  ExitToApp,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';
import VoiceRecorder from './VoiceRecorder';
import NovaAssistant from './NovaAssistant';
import MobileNav from './MobileNav';
import HeyNova from './HeyNova';

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userData, logout } = useAuth();
  
  // State
  const [participants, setParticipants] = useState([]);
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState({
    participants: true,
    notes: true,
    stats: true
  });
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [voiceRecorderMode, setVoiceRecorderMode] = useState('voice'); // 'voice' or 'text'
  const [showNova, setShowNova] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [rpAlert, setRpAlert] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [playingNoteId, setPlayingNoteId] = useState(null);
  const [novaInitialQuery, setNovaInitialQuery] = useState('');

  // Fetch data
  const fetchParticipants = useCallback(async () => {
    try {
      const response = await api.get('/api/participants');
      setParticipants(response.data);
    } catch (error) {
      console.error('Failed to load participants:', error);
      toast.error('Failed to load participants');
    } finally {
      setLoading(prev => ({ ...prev, participants: false }));
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await api.get('/api/notes');
      setNotes(response.data);
      
      // Check for recent RP but don't auto-show alert immediately
      const recentRP = response.data.find(note => note.rp_flag);
      if (recentRP) {
        setRpAlert({
          note: recentRP,
          participant: participants.find(p => p.id === recentRP.participant_id)
        });
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(prev => ({ ...prev, notes: false }));
    }
  }, [participants]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchParticipants(), fetchNotes(), fetchStats()]);
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [fetchParticipants, fetchNotes, fetchStats]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Hey Nova handler
  const handleHeyNova = (query) => {
    console.log('Hey Nova activated with query:', query);
    setNovaInitialQuery(query || '');
    setShowNova(true);
  };

  // Voice recorder handlers
  const handleOpenVoiceNote = () => {
    setVoiceRecorderMode('voice');
    setShowVoiceRecorder(true);
  };

  const handleOpenTextNote = () => {
    setVoiceRecorderMode('text');
    setShowVoiceRecorder(true);
  };

  // Export handler
  const handleExport = () => {
    try {
      const csv = [
        ['Timestamp', 'Staff', 'Participant', 'Note', 'RP Flag', 'Duration'],
        ...notes.map(note => [
          new Date(note.timestamp).toLocaleString(),
          note.user_name || 'Unknown',
          note.participant_name || 'Unknown',
          note.text.replace(/"/g, '""'), // Escape quotes in CSV
          note.rp_flag ? 'Yes' : 'No',
          note.audio_duration ? `${note.audio_duration}s` : 'Text'
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `careiq_notes_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Notes exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export notes');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const handleParticipantClick = (participant) => {
    setSelectedParticipant(participant);
  };

  // Participant colors for avatars
  const getParticipantColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get participant's RP status
  const getParticipantRPStatus = (participantId) => {
    const participantNotes = notes.filter(n => n.participant_id === participantId);
    const recentRP = participantNotes.find(n => n.rp_flag);
    return !!recentRP;
  };

  // Quick Stats Component
  const QuickStats = () => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
        <Card 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {loading.stats ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : stats?.total_notes || 0}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                  Total Notes
                </Typography>
              </Box>
              <Assignment sx={{ fontSize: 48, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card 
          sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {loading.stats ? <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : stats?.rp_incidents || 0}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                  RP Incidents
                </Typography>
              </Box>
              <Warning sx={{ fontSize: 48, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
        <Card 
          sx={{ 
            bgcolor: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'grey.100'
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  {loading.stats ? <Skeleton width={40} /> : stats?.my_notes || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  My Notes Today
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card 
          sx={{ 
            bgcolor: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'grey.100'
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                <Group />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  {loading.stats ? <Skeleton width={40} /> : participants.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Participants
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  // Participant Card Component
  const ParticipantCard = ({ participant }) => {
    const hasRP = getParticipantRPStatus(participant.id);
    const color = getParticipantColor(participant.name);
    
    return (
      <Card 
        sx={{ 
          minWidth: 140,
          cursor: 'pointer',
          border: selectedParticipant?.id === participant.id ? 2 : 1,
          borderColor: selectedParticipant?.id === participant.id ? 'primary.main' : 'grey.200',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 2,
            transform: 'translateY(-2px)'
          }
        }}
        onClick={() => handleParticipantClick(participant)}
      >
        <CardContent sx={{ p: 2, textAlign: 'center' }}>
          <Badge
            badgeContent={hasRP ? <Warning sx={{ fontSize: 16 }} /> : null}
            color="error"
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Avatar 
              sx={{ 
                width: 56, 
                height: 56, 
                bgcolor: color,
                mx: 'auto',
                mb: 1,
                fontSize: '1.25rem'
              }}
            >
              {participant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Avatar>
          </Badge>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {participant.name.split(' ')[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {participant.notes_count} notes
          </Typography>
        </CardContent>
      </Card>
    );
  };

  // Note Card Component  
  const NoteCard = ({ note }) => {
    let rpDetails = null;
    try {
      rpDetails = note.gpt_response ? JSON.parse(note.gpt_response) : null;
    } catch (error) {
      console.error('Error parsing GPT response:', error);
    }
    
    return (
      <Card 
        variant="outlined"
        sx={{ 
          mb: 2,
          borderColor: note.rp_flag ? 'error.200' : 'grey.200',
          bgcolor: note.rp_flag ? 'error.50' : 'background.paper'
        }}
      >
        <CardContent>
          {note.rp_flag && rpDetails && (
            <Alert 
              severity="error" 
              icon={<Warning />}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2" fontWeight="medium">
                {rpDetails.detected_practices?.join(', ') || 'Restrictive Practice Detected'}
              </Typography>
            </Alert>
          )}
          
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="medium">
                {note.participant_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                <AccessTime sx={{ fontSize: 14 }} />
                {new Date(note.timestamp).toLocaleString()} • {note.user_name}
              </Typography>
            </Box>
            
            {note.audio_duration && (
              <IconButton
                size="small"
                onClick={() => setPlayingNoteId(playingNoteId === note.id ? null : note.id)}
                sx={{ bgcolor: 'primary.100' }}
              >
                {playingNoteId === note.id ? <Pause /> : <PlayArrow />}
              </IconButton>
            )}
          </Box>
          
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
            {note.text}
          </Typography>
          
          {note.audio_duration && (
            <Box display="flex" alignItems="center" gap={1}>
              <Mic sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Voice note ({note.audio_duration}s)
              </Typography>
              {playingNoteId === note.id && (
                <LinearProgress sx={{ flex: 1, height: 2 }} />
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Side Drawer Menu
  const SideMenu = () => (
    <SwipeableDrawer
      anchor="left"
      open={showMenu}
      onClose={() => setShowMenu(false)}
      onOpen={() => setShowMenu(true)}
    >
      <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ bgcolor: 'primary.dark' }}>
              {userData?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6">{userData?.name || 'User'}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {userData?.role || 'Support Worker'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <List sx={{ flex: 1 }}>
          <ListItem button onClick={() => { setShowMenu(false); }}>
            <ListItemIcon><BarChart /></ListItemIcon>
            <ListItemText primary="Reports & Analytics" />
          </ListItem>
          
          <ListItem button onClick={() => { handleExport(); setShowMenu(false); }}>
            <ListItemIcon><Download /></ListItemIcon>
            <ListItemText primary="Export Notes" />
          </ListItem>
          
          <Divider />
          
          <ListItem button onClick={() => { setShowMenu(false); }}>
            <ListItemIcon><Settings /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
          
          <ListItem button onClick={handleLogout}>
            <ListItemIcon><ExitToApp /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5', pb: isMobile ? 10 : 2 }}>
      {/* Header with gradient */}
      <Paper elevation={0} sx={{ 
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        borderRadius: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Container>
          <Box display="flex" alignItems="center" justifyContent="space-between" py={2.5}>
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={() => setShowMenu(true)} edge="start" sx={{ color: 'white' }}>
                <MenuIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  CareIQ
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Support Worker Assistant
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton onClick={handleRefresh} sx={{ color: 'white' }} disabled={refreshing}>
                <Refresh className={refreshing ? 'loading-spinner' : ''} />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Hey Nova Voice Activation */}
      <HeyNova onActivate={handleHeyNova} />

      {/* RP Alert Snackbar */}
      <Snackbar
        open={!!rpAlert}
        autoHideDuration={6000}
        onClose={() => setRpAlert(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setRpAlert(null)}
          icon={<Warning />}
          action={
            rpAlert?.participant && (
              <Button 
                color="inherit" 
                size="small"
                onClick={() => {
                  handleParticipantClick(rpAlert.participant);
                  setRpAlert(null);
                }}
              >
                VIEW
              </Button>
            )
          }
        >
          Restrictive Practice detected for {rpAlert?.participant?.name}
        </Alert>
      </Snackbar>

      {/* Main Content */}
      <Container sx={{ mt: 3 }}>
        {/* Welcome Section */}
        <Box mb={4} mt={3}>
          <Paper 
            sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom color="primary.dark">
                Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {userData?.name?.split(' ')[0] || 'there'} 👋
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Typography>
            </Box>
            <Box
              sx={{
                position: 'absolute',
                right: -20,
                top: -20,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                pointerEvents: 'none'
              }}
            />
          </Paper>
        </Box>

        {/* Quick Stats */}
        <QuickStats />

        {/* Participants Section */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Your Participants
            </Typography>
            {selectedParticipant && (
              <Chip 
                label={`Viewing: ${selectedParticipant.name}`}
                onDelete={() => setSelectedParticipant(null)}
                size="small"
                color="primary"
              />
            )}
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            overflowX: 'auto', 
            pb: 2,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { 
              bgcolor: 'grey.300',
              borderRadius: 3
            }
          }}>
            {loading.participants ? (
              [1, 2, 3, 4].map(i => (
                <Skeleton key={i} variant="rounded" width={140} height={140} />
              ))
            ) : (
              participants.map(participant => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))
            )}
          </Box>
        </Box>

        {/* Recent Notes */}
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Recent Notes
            </Typography>
            <IconButton size="small">
              <FilterList />
            </IconButton>
          </Box>

          {loading.notes ? (
            [1, 2, 3].map(i => (
              <Skeleton key={i} variant="rounded" height={120} sx={{ mb: 2 }} />
            ))
          ) : (
            <>
              {notes
                .filter(note => !selectedParticipant || note.participant_id === selectedParticipant.id)
                .slice(0, 10)
                .map(note => (
                  <NoteCard key={note.id} note={note} />
                ))
              }
              {notes.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No notes yet. Use the bottom navigation to create your first note!
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Container>

      {/* Mobile FABs - Fixed positioning */}
      {isMobile && (
        <>
          {/* Add/Voice Note FAB - Left side */}
          <Fab
            color="primary"
            sx={{ 
              position: 'fixed', 
              bottom: 88, 
              left: 24,
              zIndex: 1000
            }}
            onClick={handleOpenVoiceNote}
          >
            <Add />
          </Fab>
          
          {/* Nova Assistant FAB - Right side */}
          <Fab
            color="secondary"
            sx={{ 
              position: 'fixed', 
              bottom: 88, 
              right: 24,
              zIndex: 1000
            }}
            onClick={() => setShowNova(true)}
          >
            <SmartToy />
          </Fab>
        </>
      )}
      
      {/* Desktop FABs */}
      {!isMobile && (
        <>
          <Fab
            color="primary"
            sx={{ 
              position: 'fixed', 
              bottom: 24, 
              right: 24,
              zIndex: 1000
            }}
            onClick={handleOpenVoiceNote}
          >
            <Add />
          </Fab>
          <Fab
            color="secondary"
            sx={{ 
              position: 'fixed', 
              bottom: 24, 
              right: 88,
              zIndex: 1000
            }}
            onClick={() => setShowNova(true)}
          >
            <SmartToy />
          </Fab>
        </>
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          onVoiceNote={handleOpenVoiceNote}
          onTextNote={handleOpenTextNote}
          onNova={() => setShowNova(true)}
          onExport={handleExport}
          onDashboard={handleRefresh}
        />
      )}

      {/* Dialogs and Drawers */}
      <SideMenu />
      
      <VoiceRecorder
        open={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        participants={participants}
        selectedParticipant={selectedParticipant}
        onSuccess={() => {
          setShowVoiceRecorder(false);
          handleRefresh();
        }}
        initialMode={voiceRecorderMode} // Pass the mode to VoiceRecorder
      />

      <NovaAssistant
        open={showNova}
        onClose={() => {
          setShowNova(false);
          setNovaInitialQuery('');
        }}
        participants={participants}
        onSuccess={handleRefresh}
        initialQuery={novaInitialQuery}
      />
    </Box>
  );
}

export default Dashboard;