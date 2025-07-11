import { supabase } from '@/lib/supabase';

// Type definitions
export interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
}

export interface FamilyHistoryEntry {
  relation: string;
  condition: string;
  age: string;
}

export interface OnboardingData {
  age: string;
  height: string;
  weight: string;
  race: string | null;
  is_male: boolean | null;
  medications: MedicationEntry[];
  personal_health_context: string;
  family_history: FamilyHistoryEntry[];
  allergies: string[];
  lifestyle_smoking_status?: string;
  lifestyle_alcohol_consumption?: string;
  lifestyle_exercise_frequency?: string;
  lifestyle_sleep_hours?: string;
  lifestyle_stress_level?: string;
  lifestyle_diet_type?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
}

// Fetch user's medical profile
export async function getUserProfile(
  userId: string, 
  email: string,
  name: string | null
): Promise<OnboardingData | null> {
  try {
    // First try to get existing profile
    let { data, error } = await supabase
      .from('medical')
      .select('*')
      .eq('id', userId)
      .single();
    

    
    // Process medications data to ensure proper structure
    if (data && data.medications) {
      // Ensure medications is an array of objects with the correct structure
      data.medications = Array.isArray(data.medications) 
        ? data.medications.map((med: any) => {
            if (typeof med === 'string') {
              try {
                // Try to parse JSON string
                const parsedMed = JSON.parse(med);
                return {
                  name: parsedMed.name || '',
                  dosage: parsedMed.dosage || '',
                  frequency: parsedMed.frequency || ''
                };
              } catch (e) {
                // If parsing fails, treat as medication name
                return {
                  name: med,
                  dosage: '',
                  frequency: ''
                };
              }
            } else if (typeof med === 'object' && med !== null) {
              return {
                name: med.name || '',
                dosage: med.dosage || '',
                frequency: med.frequency || ''
              };
            }
            // Fallback
            return {
              name: String(med),
              dosage: '',
              frequency: ''
            };
          })
        : [];
    }

    // If no profile exists, create one
    if (error && error.code === 'PGRST116') {
      const { data: newData, error: insertError } = await supabase
        .from('medical')
        .insert([
          { 
            id: userId,
            email: email,
            name: name || '',  // Use provided name or empty string if null
            age: '',
            height: '',
            weight: '',
            race: null,
            is_male: null,
            medications: [],
            personal_health_context: '',
            family_history: [],
            allergies: [],
            lifestyle_smoking_status: '',
            lifestyle_alcohol_consumption: '',
            lifestyle_exercise_frequency: '',
            lifestyle_sleep_hours: '',
            lifestyle_stress_level: '',
            lifestyle_diet_type: '',
            emergency_contact_name: '',
            emergency_contact_relation: '',
            emergency_contact_phone: '',
            emergency_contact_email: ''
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating medical profile:', insertError);
        throw insertError;
      }

      data = newData;
    } else if (error) {
      console.error('Error fetching medical profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
}

// Check if onboarding is complete
export function isOnboardingComplete(profile: OnboardingData | null): boolean {
  if (!profile) return false;

  // Check if required fields are filled
  return Boolean(profile.personal_health_context?.trim());
}

// Conversion functions
export function convertHeightToMetric(feet: number, inches: number): number {
  // Convert feet and inches to centimeters
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
}

export function convertWeightToMetric(pounds: number): number {
  // Convert pounds to kilograms
  return Math.round(pounds * 0.453592);
}

// Validation function
export function validateOnboardingData(data: Partial<OnboardingData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate age
  if (data.age) {
    const age = parseInt(data.age);
    if (isNaN(age) || age < 1 || age > 150) {
      errors.push('Age must be between 1 and 150');
    }
  }

  // Validate height
  if (data.height) {
    const height = parseInt(data.height);
    if (isNaN(height) || height < 50 || height > 300) {
      errors.push('Height must be between 50 and 300 cm');
    }
  }

  // Validate weight
  if (data.weight) {
    const weight = parseInt(data.weight);
    if (isNaN(weight) || weight < 10 || weight > 1000) {
      errors.push('Weight must be between 10 and 1000 kg');
    }
  }

  // Validate required fields
  if (!data.personal_health_context?.trim()) {
    errors.push('Personal Health Context is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Database function
export async function completeOnboarding(
  userId: string,
  data: OnboardingData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure medications array has the correct structure
    const medications = data.medications?.map(med => ({
      name: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || ''
    })) || [];
    

    
    // Update user's medical data
    const { error: medicalError } = await supabase
      .from('medical')
      .update({
        age: data.age,
        height: data.height,
        weight: data.weight,
        race: data.race,
        is_male: data.is_male,
        medications: medications,
        personal_health_context: data.personal_health_context,
        family_history: data.family_history,
        allergies: data.allergies,
        lifestyle_smoking_status: data.lifestyle_smoking_status || '',
        lifestyle_alcohol_consumption: data.lifestyle_alcohol_consumption || '',
        lifestyle_exercise_frequency: data.lifestyle_exercise_frequency || '',
        lifestyle_sleep_hours: data.lifestyle_sleep_hours || '',
        lifestyle_stress_level: data.lifestyle_stress_level || '',
        lifestyle_diet_type: data.lifestyle_diet_type || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_relation: data.emergency_contact_relation || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        emergency_contact_email: data.emergency_contact_email || ''
      })
      .eq('id', userId);

    if (medicalError) {
      console.error('Error updating medical data:', medicalError);
      return { success: false, error: medicalError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Onboarding error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
} 