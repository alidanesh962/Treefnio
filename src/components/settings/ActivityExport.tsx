// src/components/settings/ActivityExport.tsx
import React from 'react';
import { Button } from '@mui/material';
import { useUserActivity } from '../../hooks/useUserActivity';
import { exportActivities } from '../../utils/userActivity';

export const ActivityExport: React.FC = () => {
  const { activities } = useUserActivity();

  const handleExport = async () => {
    try {
      const blob = await exportActivities(activities);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_activities_${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting activities:', error);
    }
  };

  return (
    <Button 
      variant="contained" 
      color="primary" 
      onClick={handleExport}
      disabled={!activities.length}
    >
      Export Activities
    </Button>
  );
};