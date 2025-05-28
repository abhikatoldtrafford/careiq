import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Download,
  DateRange,
  Person,
  Description
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

function ExportDialog({ open, onClose, participants }) {
  const [format, setFormat] = useState('csv');
  const [participantId, setParticipantId] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (participantId !== 'all') {
        params.append('participant_id', participantId);
      }
      
      if (dateRange === 'custom' && startDate) {
        params.append('start_date', startDate);
      }
      
      if (dateRange === 'custom' && endDate) {
        params.append('end_date', endDate);
      }
      
      // Add date presets
      if (dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.append('start_date', today.toISOString());
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.append('start_date', weekAgo.toISOString());
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.append('start_date', monthAgo.toISOString());
      }
      
      // Make request
      const response = await api.get(`/api/export/${format}?${params.toString()}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        // Download CSV file
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `careiq_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Download JSON file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `careiq_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success(`Export completed successfully`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Download />
          Export Notes
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Format Selection */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Export Format
            </Typography>
            <RadioGroup
              row
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <FormControlLabel 
                value="csv" 
                control={<Radio />} 
                label={
                  <Chip 
                    icon={<Description />} 
                    label="CSV (Excel compatible)" 
                    variant={format === 'csv' ? 'filled' : 'outlined'}
                    color={format === 'csv' ? 'primary' : 'default'}
                  />
                } 
              />
              <FormControlLabel 
                value="json" 
                control={<Radio />} 
                label={
                  <Chip 
                    icon={<Description />} 
                    label="JSON (Full data)" 
                    variant={format === 'json' ? 'filled' : 'outlined'}
                    color={format === 'json' ? 'primary' : 'default'}
                  />
                } 
              />
            </RadioGroup>
          </FormControl>

          {/* Participant Filter */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Participant</InputLabel>
            <Select
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              label="Participant"
              startAdornment={<Person sx={{ mr: 1, color: 'action.active' }} />}
            >
              <MenuItem value="all">All Participants</MenuItem>
              {participants.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Date Range
            </Typography>
            <RadioGroup
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <FormControlLabel value="all" control={<Radio />} label="All time" />
              <FormControlLabel value="today" control={<Radio />} label="Today" />
              <FormControlLabel value="week" control={<Radio />} label="Last 7 days" />
              <FormControlLabel value="month" control={<Radio />} label="Last 30 days" />
              <FormControlLabel value="custom" control={<Radio />} label="Custom range" />
            </RadioGroup>
          </Box>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          )}

          {/* Export Preview */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.100', 
            borderRadius: 1,
            mt: 2
          }}>
            <Typography variant="body2" color="text.secondary">
              This will export notes in {format.toUpperCase()} format
              {participantId !== 'all' && ` for ${participants.find(p => p.id === participantId)?.name}`}
              {dateRange !== 'all' && ` from ${dateRange === 'custom' ? 'selected dates' : `last ${dateRange}`}`}.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleExport} 
          variant="contained" 
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
          disabled={loading || (dateRange === 'custom' && (!startDate || !endDate))}
        >
          {loading ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ExportDialog;