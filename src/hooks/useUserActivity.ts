// src/hooks/useUserActivity.ts
import { useState, useEffect, useMemo } from 'react';
import { getUserActivities } from '../utils/userActivity';
import { UserActivity, UserActivityDetails } from '../types';

export const useUserActivity = (selectedUsername?: string) => {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const data = await getUserActivities(selectedUsername);
                console.log('Fetched activities:', data);
                // Sort activities by timestamp in descending order
                const sortedData = [...data].sort((a: UserActivity, b: UserActivity) => b.timestamp - a.timestamp);
                setActivities(sortedData);
            } catch (error) {
                console.error('Error fetching user activities:', error);
            }
        };
        fetchActivities();
    }, [selectedUsername]);

    const groupedByDate = useMemo(() => {
        const groups: { [date: string]: UserActivity[] } = {};
        
        activities.forEach(activity => {
            const date = new Date(activity.timestamp).toISOString().split('T')[0];
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity);
        });

        return groups;
    }, [activities]);

    const stats = useMemo(() => {
        if (!activities.length) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            total: activities.length,
            today: activities.filter(a => new Date(a.timestamp) >= today).length,
            creates: activities.filter(a => a.type === 'create').length,
            edits: activities.filter(a => a.type === 'edit').length,
            deletes: activities.filter(a => a.type === 'delete').length,
        };
    }, [activities]);

    return {
        activities,
        groupedByDate,
        loading,
        stats,
        error,
        refresh: async () => {
            const data = await getUserActivities(selectedUsername);
            const sortedData = [...data].sort((a: UserActivity, b: UserActivity) => b.timestamp - a.timestamp);
            setActivities(sortedData);
        }
    };
};