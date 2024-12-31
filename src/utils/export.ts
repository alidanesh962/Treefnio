import { UserActivity } from '../types';

export const exportActivities = async (activities: UserActivity[]): Promise<Blob> => {
  const headers = ['Date', 'Type', 'Entity Type', 'Entity ID', 'User', 'Details'];
  const rows = activities.map(activity => [
    new Date(activity.timestamp.toDate()).toLocaleString(),
    activity.type,
    activity.entityType,
    activity.entityId,
    activity.username,
    activity.details
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}; 