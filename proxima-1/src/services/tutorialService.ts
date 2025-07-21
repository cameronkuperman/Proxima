import { createClient } from '@/utils/supabase/client';

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
    const supabase = createClient();
    
    // Check if we have an authenticated session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No auth session, skipping tutorial fetch');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_tutorials')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create one
          return await this.initializeUserTutorial(userId);
        }
        console.error('Error fetching tutorial progress:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserTutorialProgress:', error);
      return null;
    }
  },

  async initializeUserTutorial(userId: string): Promise<UserTutorial | null> {
    const supabase = createClient();
    
    // Check auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No auth session, cannot initialize tutorial');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_tutorials')
        .insert({
          user_id: userId,
          has_seen_welcome: false,
          completed_tours: []
        })
        .select()
        .single();

      if (error) {
        console.error('Error initializing tutorial:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in initializeUserTutorial:', error);
      return null;
    }
  },

  async updateHasSeenWelcome(userId: string): Promise<boolean> {
    const supabase = createClient();
    
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
    const supabase = createClient();
    
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
    const supabase = createClient();
    
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