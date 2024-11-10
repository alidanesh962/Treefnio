// src/hooks/useUserActivity.ts
import { useState, useEffect, useMemo } from 'react';
import { getUserActivities } from '../utils/userActivity';
import { UserActivity } from '../types';

export const useUserActivity = (selectedUsername?: string) => {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = () => {
            setLoading(true);
            try {
                const data = getUserActivities(selectedUsername);
                setActivities(data);
            } catch (error) {
                console.error('Error fetching user activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
        // Set up polling for real-time updates
        const intervalId = setInterval(fetchActivities, 30000); // Update every 30 seconds

        return () => clearInterval(intervalId);
    }, [selectedUsername]);

    const stats = useMemo(() => {
        if (!activities.length) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            total: activities.length,
            today: activities.filter(a => new Date(a.timestamp) >= today).length,
            logins: activities.filter(a => a.type === 'login').length,
            logouts: activities.filter(a => a.type === 'logout').length,
        };
    }, [activities]);

    return {
        activities,
        loading,
        stats,
        refresh: () => setActivities(getUserActivities(selectedUsername))
    };
};