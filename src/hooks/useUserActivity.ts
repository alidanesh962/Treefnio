// src/hooks/useUserActivity.ts
import { useState, useEffect, useCallback } from 'react';
import { firebaseService } from '../services/firebaseService';
import { COLLECTIONS } from '../services/firebaseService';
import { UserActivity } from '../types';

export const useUserActivity = () => {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(() => {
        // Re-fetch activities
        firebaseService.subscribeToCollection(
            COLLECTIONS.USER_ACTIVITIES,
            (data: UserActivity[]) => {
                const sortedActivities = [...data].sort((a: UserActivity, b: UserActivity) => {
                    if (!a.timestamp || !b.timestamp) return 0;
                    return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
                });
                setActivities(sortedActivities);
                setLoading(false);
            }
        );
    }, []);

    useEffect(() => {
        const unsubscribe = firebaseService.subscribeToCollection(
            COLLECTIONS.USER_ACTIVITIES,
            (data: UserActivity[]) => {
                const sortedActivities = [...data].sort((a: UserActivity, b: UserActivity) => {
                    if (!a.timestamp || !b.timestamp) return 0;
                    return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
                });
                setActivities(sortedActivities);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { activities, loading, refresh };
};