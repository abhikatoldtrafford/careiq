import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box
} from '@mui/material';
import {
  Home,
  Mic,
  SmartToy,
  Download,
  BarChart
} from '@mui/icons-material';

function MobileNav({ onVoiceNote, onTextNote, onNova, onExport, onDashboard }) {
  const [value, setValue] = React.useState(0);

  return (
    <Box className="bottom-nav safe-area-bottom">
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        sx={{ 
          height: 72,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<Home />}
          onClick={onDashboard}
        />
        <BottomNavigationAction
          label="Voice Note"
          icon={<Mic />}
          onClick={onVoiceNote}
        />
        <BottomNavigationAction
          label="Ask Nova"
          icon={<SmartToy />}
          onClick={onNova}
        />
        <BottomNavigationAction
          label="Reports"
          icon={<BarChart />}
          onClick={onExport}
        />
      </BottomNavigation>
    </Box>
  );
}

export default MobileNav;