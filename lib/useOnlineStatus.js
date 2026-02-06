import { useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Hook to track and update user's online status in Firestore
 * Updates isOnline and lastSeen fields automatically
 */
export function useOnlineStatus() {
    useEffect(() => {
        let unsubscribeAuth;
        let heartbeatInterval;

        const updateOnlineStatus = async (user, isOnline) => {
            if (!user) return;

            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    isOnline,
                    lastSeen: new Date()
                });
            } catch (error) {
                console.error('Error updating online status:', error);
            }
        };

        unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Set online when user logs in
                updateOnlineStatus(user, true);

                // Heartbeat every 2 minutes to keep status fresh
                heartbeatInterval = setInterval(() => {
                    updateOnlineStatus(user, true);
                }, 120000); // 2 minutes

                // Set offline on page unload
                const handleBeforeUnload = () => {
                    // Use sendBeacon for reliable offline status update
                    const data = JSON.stringify({
                        isOnline: false,
                        lastSeen: new Date().toISOString()
                    });
                    // Note: This would need a server endpoint, for now we'll use regular update
                    updateOnlineStatus(user, false);
                };

                window.addEventListener('beforeunload', handleBeforeUnload);

                return () => {
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                };
            }
        });

        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
            if (heartbeatInterval) clearInterval(heartbeatInterval);

            // Set offline on cleanup
            if (auth.currentUser) {
                updateOnlineStatus(auth.currentUser, false);
            }
        };
    }, []);
}
