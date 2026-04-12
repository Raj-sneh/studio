
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview A background listener component that monitors the 'admin_notices' collection.
 * Restricted to authenticated users only to align with the app's strict access policy.
 */
export default function UserNotice() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  // Track seen notices in local storage to prevent duplicate alerts on refresh
  const [seenNoticeIds, setSeenNoticeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('sargam-seen-notices');
    if (saved) {
      try {
        setSeenNoticeIds(new Set(JSON.parse(saved)));
      } catch (e) {
        console.warn("Could not parse seen notices history.");
      }
    }
  }, []);

  const noticeQuery = useMemoFirebase(() => {
    // Only query if firestore is ready and a verified user is logged in
    // This prevents "auth: null" permission errors for guests
    if (!firestore || !user || user.isAnonymous) return null;
    
    // Listen for the most recent active administrative broadcast
    return query(
      collection(firestore, 'admin_notices'),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

  const { data: notices } = useCollection(noticeQuery);

  useEffect(() => {
    if (notices && notices.length > 0) {
      const notice = notices[0];
      
      // If we haven't seen this notice ID yet in this session or history
      if (!seenNoticeIds.has(notice.id)) {
        // Update local memory
        const nextSeen = new Set(seenNoticeIds).add(notice.id);
        setSeenNoticeIds(nextSeen);
        
        // Persist to local storage
        localStorage.setItem('sargam-seen-notices', JSON.stringify(Array.from(nextSeen)));

        // Trigger the visual notification
        toast({
          title: notice.title || "Admin Broadcast",
          description: notice.message,
          variant: notice.type === 'alert' ? 'destructive' : 'default',
        });
      }
    }
  }, [notices, seenNoticeIds, toast]);

  // This component handles logic only and renders nothing to the DOM directly.
  return null;
}
