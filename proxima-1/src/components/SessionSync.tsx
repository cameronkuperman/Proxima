'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SessionSync() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const syncSession = async () => {
      if (searchParams.get('session_sync') === 'true') {
        console.log('SessionSync: Syncing session after OAuth...');
        
        // Force refresh the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('SessionSync: Error getting session:', error);
        } else {
          console.log('SessionSync: Session synced:', {
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email
          });
          
          // Clean up the URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('session_sync');
          router.replace(newUrl.pathname + newUrl.search);
        }
      }
    };
    
    syncSession();
  }, [searchParams, router]);
  
  return null;
}