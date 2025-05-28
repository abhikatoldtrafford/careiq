import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Chip,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Slide,
  Tab,
  Tabs,
  Card,
  CardContent
} from '@mui/material';
import {
  ArrowBack,
  Warning,
  TrendingUp,
  Assignment,
  AccessTime,
  Mic,
  Add,
  BarChart,
  School,
  PlayArrow,
  Pause
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="left" ref={ref} {...props} />;
});

function ParticipantDetail({ open, onClose, participant, notes, onCreateNote }) {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [playingNoteId, setPlayingNoteId] = useState(null);

  if (!participant) return null;

  const getParticipantColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const color = getParticipantColor(participant.name);
  const rpNotes = notes.filter(n => n.rp_flag);
  const recentNotes = notes.slice(0, 5);

  const stats = {
    totalNotes: notes.length,
    rpIncidents: rpNotes.length,
    compliance: notes.length > 0 ? Math.round(((notes.length - rpNotes.length) / notes.length) * 100) : 100,
    lastActivity: notes[0]?.timestamp ? new Date(notes[0].timestamp).toLocaleDateString() : 'No activity'
  };

  const NoteItem = ({ note }) => {
    const rpDetails = note.gpt_response ? JSON.parse(note.gpt_response) : null;
    
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          {note.rp_flag && (
            <Chip
              icon={<Warning />}
              label={rpDetails?.detected_practices?.[0] || "RP Detected"}
              color="error"
              size="small"
              sx={{ mb: 1 }}
            />
          )}
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            {note.text}
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              <AccessTime sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {new Date(note.timestamp).toLocaleString()}
            </Typography>
            
            {note.audio_duration && (
              <IconButton
                size="small"
                onClick={() => setPlayingNoteId(playingNoteId === note.id ? null : note.id)}
              >
                {playingNoteId === note.id ? <Pause /> : <PlayArrow />}
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <ArrowBack />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {participant.name}
          </Typography>
          <Button color="inherit" startIcon={<Add />} onClick={onCreateNote}>
            Add Note
          </Button>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0 }}>
        {/* Header Card */}
        <Paper sx={{ p: 3, borderRadius: 0 }} elevation={0}>
          <Box display="flex" alignItems="center" gap={3} mb={3}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: color,
                fontSize: '2rem'
              }}
            >
              {participant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight="bold">
                {participant.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last activity: {stats.lastActivity}
              </Typography>
            </Box>
          </Box>

          {/* Stats Grid */}
          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {stats.totalNotes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Notes
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
              <Typography variant="h4" color="error" fontWeight="bold">
                {stats.rpIncidents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                RP Incidents
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats.compliance}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compliance
              </Typography>
            </Paper>
          </Box>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)}
            variant="fullWidth"
          >
            <Tab label="Recent Notes" icon={<Assignment />} iconPosition="start" />
            <Tab label="Insights" icon={<BarChart />} iconPosition="start" />
            <Tab label="Training" icon={<School />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <Box>
              {recentNotes.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No notes yet for this participant
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={onCreateNote}
                    sx={{ mt: 2 }}
                  >
                    Create First Note
                  </Button>
                </Paper>
              ) : (
                recentNotes.map(note => (
                  <NoteItem key={note.id} note={note} />
                ))
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Behavior Patterns
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Based on recent notes, {participant.name} shows improved cooperation during structured activities.
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.compliance} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>

              {rpNotes.length > 0 && (
                <Card variant="outlined" sx={{ bgcolor: 'error.50' }}>
                  <CardContent>
                    <Typography variant="h6" color="error" gutterBottom>
                      Areas of Concern
                    </Typography>
                    <List dense>
                      {rpNotes.slice(0, 3).map((note, i) => {
                        const rpDetails = note.gpt_response ? JSON.parse(note.gpt_response) : null;
                        return (
                          <ListItem key={i}>
                            <ListItemIcon>
                              <Warning color="error" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={rpDetails?.detected_practices?.[0] || "Restrictive Practice"}
                              secondary={new Date(note.timestamp).toLocaleDateString()}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommended Training
                  </Typography>
                  <List>
                    <ListItem button>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="De-escalation Techniques"
                        secondary="15 min module"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem button>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Understanding Triggers"
                        secondary="20 min module"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem button>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Positive Behavior Support"
                        secondary="30 min module"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default ParticipantDetail;