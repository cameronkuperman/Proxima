import { supabase } from '@/lib/supabase';

export interface UserTutorial {
  id: string;
  user_id: string;
  has_seen_welcome: boolean;
  completed_tours: string[];
  last_tour_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const tutorialService = {
  async getUserTutorialProgress(userId: string): Promise<UserTutorial | null> {
    // Check if we have an authenticated session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Tutorial Service: No auth session, skipping tutorial fetch');
      return null;
    }
    
    // Verify the session user matches the requested userId
    if (session.user.id !== userId) {
      console.error('Tutorial Service: User ID mismatch', { sessionUserId: session.user.id, requestedUserId: userId });
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_tutorials')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no row exists

      if (error) {
        console.error('Tutorial Service: Error fetching tutorial progress:', error);
        return null;
      }

      // If no data found, initialize a new record
      if (!data) {
        console.log('Tutorial Service: No tutorial record found, initializing...');
        return await this.initializeUserTutorial(userId);
      }

      return data;
    } catch (error) {
      console.error('Tutorial Service: Unexpected error in getUserTutorialProgress:', error);
      return null;
    }
  },

  async initializeUserTutorial(userId: string): Promise<UserTutorial | null> {
    // Check auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
      console.log('Tutorial Service: No auth session or user mismatch, cannot initialize tutorial');
      return null;
    }
    
    try {
      // Use Supabase's upsert with onConflict to handle the unique constraint
      const { data, error } = await supabase
        .from('user_tutorials')
        .upsert(
          {
            user_id: userId,
            has_seen_welcome: false,
            completed_tours: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            onConflict: 'user_id',
            ignoreDuplicates: false // This will return the existing row if it exists
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Tutorial Service: Error during upsert:', error);
        
        // As a fallback, try to fetch the existing record
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_tutorials')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (fallbackError) {
          console.error('Tutorial Service: Fallback fetch also failed:', fallbackError);
          return null;
        }
        
        return fallbackData;
      }

      console.log('Tutorial Service: Successfully initialized/fetched tutorial record');
      return data;
    } catch (error) {
      console.error('Tutorial Service: Unexpected error in initializeUserTutorial:', error);
      return null;
    }
  },

  async updateHasSeenWelcome(userId: string): Promise<boolean> {
    // Check auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No auth session, cannot update tutorial');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('user_tutorials')
        .update({
          has_seen_welcome: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating has_seen_welcome:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateHasSeenWelcome:', error);
      return false;
    }
  },

  async addCompletedTour(userId: string, tourName: string): Promise<boolean> {
    // Check auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No auth session, cannot add completed tour');
      return false;
    }
    
    try {
      // First get current completed tours
      const { data: currentData, error: fetchError } = await supabase
        .from('user_tutorials')
        .select('completed_tours')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching current tours:', fetchError);
        return false;
      }

      const currentTours = currentData?.completed_tours || [];
      
      // Add new tour if not already completed
      if (!currentTours.includes(tourName)) {
        const updatedTours = [...currentTours, tourName];
        
        const { error: updateError } = await supabase
          .from('user_tutorials')
          .update({
            completed_tours: updatedTours,
            last_tour_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating completed tours:', updateError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in addCompletedTour:', error);
      return false;
    }
  },

  async resetTutorialProgress(userId: string): Promise<boolean> {
    // Check auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No auth session, cannot reset tutorial');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('user_tutorials')
        .update({
          has_seen_welcome: false,
          completed_tours: [],
          last_tour_completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting tutorial progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resetTutorialProgress:', error);
      return false;
    }
  }
};