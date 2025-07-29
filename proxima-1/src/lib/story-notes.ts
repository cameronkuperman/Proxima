// Story Notes Service for managing personal notes on health stories
import { getSupabaseClient } from './supabase-client';

export interface StoryNote {
  id: string;
  user_id: string;
  story_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteData {
  story_id: string;
  note_text: string;
}

export const storyNotesService = {
  async getNoteForStory(storyId: string): Promise<StoryNote | null> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('story_notes')
        .select('*')
        .eq('story_id', storyId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching story note:', error);
        return null;
      }
      
      return data as StoryNote | null;
    } catch (error) {
      console.error('Error in getNoteForStory:', error);
      return null;
    }
  },

  async createNote(userId: string, noteData: CreateNoteData): Promise<StoryNote | null> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('story_notes')
        .insert({
          user_id: userId,
          story_id: noteData.story_id,
          note_text: noteData.note_text
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating story note:', error);
        return null;
      }
      
      return data as StoryNote;
    } catch (error) {
      console.error('Error in createNote:', error);
      return null;
    }
  },

  async updateNote(noteId: string, noteText: string): Promise<StoryNote | null> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('story_notes')
        .update({ note_text: noteText })
        .eq('id', noteId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating story note:', error);
        return null;
      }
      
      return data as StoryNote;
    } catch (error) {
      console.error('Error in updateNote:', error);
      return null;
    }
  },

  async deleteNote(noteId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('story_notes')
        .delete()
        .eq('id', noteId);
      
      if (error) {
        console.error('Error deleting story note:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteNote:', error);
      return false;
    }
  },

  async getAllNotesForUser(userId: string): Promise<StoryNote[]> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('story_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all notes:', error);
        return [];
      }
      
      return data as StoryNote[];
    } catch (error) {
      console.error('Error in getAllNotesForUser:', error);
      return [];
    }
  }
};

export type { CreateNoteData };