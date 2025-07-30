# Complete AI Integration Guide for Predictive Features

## Overview
Transform the static predictive alert on dashboard and predictive insights page into dynamic, AI-powered features that analyze each user's actual health data to provide personalized predictions and insights.

## Architecture Overview

```
User Health Data → AI Analysis Engine → Personalized Predictions → UI Components
                                     ↓
                              Pattern Detection → Custom Questions
                                     ↓
                              Risk Assessment → Dashboard Alert
```

## Part 1: Dashboard Predictive Alert - Make It Smart

### Current State: Static "migraine in 2 days" message
### Goal: Dynamic, AI-generated alert based on user's actual patterns

### 1.1 Frontend Hook for AI Alert

```typescript
// src/hooks/useAIPredictiveAlert.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AIAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timeframe: string;
  confidence: number;
  actionUrl: string;
  preventionTip?: string;
}

export function useAIPredictiveAlert() {
  const { user } = useAuth();
  const [alert, setAlert] = useState<AIAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchAlert = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/dashboard-alert/${user.id}`);
        
        if (!response.ok) throw new Error('Failed to fetch alert');
        
        const data = await response.json();
        
        if (data.alert) {
          setAlert(data.alert);
          setLastUpdate(new Date());
        } else {
          // No significant patterns detected
          setAlert(null);
        }
      } catch (error) {
        console.error('Error fetching AI alert:', error);
        // Fallback to null instead of showing error
        setAlert(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAlert();

    // Refresh every 30 minutes
    const interval = setInterval(fetchAlert, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return { alert, isLoading, lastUpdate };
}
```

### 1.2 Update Dashboard Component

```typescript
// In src/app/dashboard/page.tsx - Replace static alert section

import { useAIPredictiveAlert } from '@/hooks/useAIPredictiveAlert';

// Inside component
const { alert: aiAlert, isLoading: alertLoading } = useAIPredictiveAlert();

// Replace the static alert section with:
{/* AI-Powered Predictive Alert */}
{alertLoading ? (
  <div className="backdrop-blur-[20px] bg-gradient-to-r from-gray-600/10 to-gray-600/10 
                  border border-gray-600/20 rounded-xl p-5 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-gray-600/20 rounded"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-600/20 rounded w-1/3"></div>
        <div className="h-3 bg-gray-600/20 rounded w-full"></div>
        <div className="h-3 bg-gray-600/20 rounded w-3/4"></div>
      </div>
    </div>
  </div>
) : aiAlert ? (
  <div className={`backdrop-blur-[20px] rounded-xl p-5 border transition-all
    ${aiAlert.severity === 'critical' 
      ? 'bg-gradient-to-r from-red-600/10 to-orange-600/10 border-red-600/20' 
      : aiAlert.severity === 'warning'
      ? 'bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border-yellow-600/20'
      : 'bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border-blue-600/20'
    }`}>
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${
        aiAlert.severity === 'critical' ? 'bg-red-500/20' :
        aiAlert.severity === 'warning' ? 'bg-yellow-500/20' :
        'bg-blue-500/20'
      }`}>
        {aiAlert.severity === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
         aiAlert.severity === 'warning' ? <Zap className="w-5 h-5 text-yellow-400" /> :
         <TrendingUp className="w-5 h-5 text-blue-400" />}
      </div>
      <div className="flex-1">
        <h3 className="text-base font-medium text-white mb-2">{aiAlert.title}</h3>
        <p className="text-sm text-gray-300 mb-2">
          {aiAlert.description}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {aiAlert.timeframe} • {aiAlert.confidence}% confidence
          </p>
          <button 
            onClick={() => router.push(aiAlert.actionUrl || '/predictive-insights')}
            className={`text-xs transition-colors ${
              aiAlert.severity === 'critical' ? 'text-red-400 hover:text-red-300' :
              aiAlert.severity === 'warning' ? 'text-yellow-400 hover:text-yellow-300' :
              'text-blue-400 hover:text-blue-300'
            }`}
          >
            {aiAlert.severity === 'critical' ? 'Take action →' : 'View details →'}
          </button>
        </div>
        {aiAlert.preventionTip && (
          <p className="text-xs text-gray-400 mt-2 italic">
            Quick tip: {aiAlert.preventionTip}
          </p>
        )}
      </div>
    </div>
  </div>
) : (
  // No alerts state - good news!
  <div className="backdrop-blur-[20px] bg-gradient-to-r from-green-600/10 to-emerald-600/10 
                  border border-green-600/20 rounded-xl p-5">
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-green-500/20">
        <Shield className="w-5 h-5 text-green-400" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-medium text-white mb-2">All Clear</h3>
        <p className="text-sm text-gray-300">
          No concerning patterns detected. Keep up your healthy habits!
        </p>
        <button 
          onClick={() => router.push('/predictive-insights')}
          className="text-xs text-green-400 hover:text-green-300 mt-2"
        >
          View your patterns →
        </button>
      </div>
    </div>
  </div>
)}
```

### 1.3 Backend AI Alert Generation

```python
# backend/api/ai/dashboard_alert.py
from datetime import datetime, timedelta
import json

@router.get("/api/ai/dashboard-alert/{user_id}")
async def generate_dashboard_alert(user_id: str):
    """
    Analyzes user's recent health data to generate the most important
    predictive alert for their dashboard.
    """
    
    # Gather comprehensive user data
    recent_data = await gather_user_health_data(user_id, days=14)
    historical_patterns = await get_user_patterns(user_id)
    
    # Check if user has enough data
    if not recent_data or len(recent_data.entries) < 5:
        return {"alert": None, "reason": "insufficient_data"}
    
    # Prepare context for AI
    context = {
        "recent_symptoms": extract_symptoms(recent_data),
        "sleep_patterns": analyze_sleep_trends(recent_data),
        "stress_indicators": detect_stress_patterns(recent_data),
        "medication_adherence": check_medication_compliance(recent_data),
        "historical_triggers": historical_patterns.known_triggers,
        "previous_predictions": get_prediction_accuracy(user_id),
        "current_date": datetime.now().isoformat(),
        "day_of_week": datetime.now().strftime("%A"),
        "weather_data": await get_weather_triggers(user_id)  # If applicable
    }
    
    # Generate alert using AI
    prompt = f"""
    Analyze this user's health data and generate ONE most important predictive alert.
    
    Context:
    {json.dumps(context, indent=2)}
    
    Rules:
    1. Only generate an alert if there's a meaningful pattern or risk detected
    2. Be specific about timeframes (e.g., "next 48 hours", "this weekend")
    3. Use supportive, non-alarming language
    4. Base predictions on actual patterns in their data
    5. Include confidence score based on pattern strength
    
    Generate:
    - severity: "info" (positive/optimization), "warning" (preventable issue), or "critical" (urgent action needed)
    - title: Clear, specific title (max 10 words)
    - description: 2-3 sentences explaining the pattern and prediction
    - timeframe: When this might occur
    - confidence: 0-100 based on pattern reliability
    - preventionTip: One immediate action they can take (optional)
    
    If no significant patterns found, return null.
    
    Output as JSON.
    """
    
    ai_response = await llm_service.generate(prompt, model="gpt-4")
    alert_data = json.loads(ai_response)
    
    if alert_data and alert_data != "null":
        # Add metadata
        alert_data["id"] = generate_alert_id()
        alert_data["actionUrl"] = f"/predictive-insights?focus={alert_data['id']}"
        alert_data["generated_at"] = datetime.now().isoformat()
        
        # Log for analytics
        await log_alert_generation(user_id, alert_data)
        
        return {"alert": alert_data}
    
    return {"alert": None}

# Helper functions
async def gather_user_health_data(user_id: str, days: int):
    """Aggregates all health data sources"""
    data = {
        "entries": await get_symptom_logs(user_id, days),
        "sleep_logs": await get_sleep_data(user_id, days),
        "mood_logs": await get_mood_data(user_id, days),
        "medications": await get_medication_logs(user_id, days),
        "quick_scans": await get_quick_scan_history(user_id, days),
        "deep_dives": await get_deep_dive_sessions(user_id, days)
    }
    return data

def extract_symptoms(data):
    """Extracts and categorizes recent symptoms"""
    symptoms = []
    for entry in data.entries:
        if entry.symptoms:
            symptoms.extend([{
                "name": s.name,
                "severity": s.severity,
                "date": entry.date,
                "body_part": s.body_part
            } for s in entry.symptoms])
    return symptoms

def analyze_sleep_trends(data):
    """Identifies sleep pattern changes"""
    if not data.sleep_logs:
        return None
    
    # Calculate averages and trends
    recent_avg = calculate_average_sleep(data.sleep_logs[-7:])
    previous_avg = calculate_average_sleep(data.sleep_logs[-14:-7])
    
    return {
        "recent_average": recent_avg,
        "trend": "declining" if recent_avg < previous_avg - 0.5 else "stable",
        "disruptions": count_sleep_disruptions(data.sleep_logs[-7:])
    }
```

## Part 2: Predictive Insights Page - Full AI Integration

### 2.1 Dynamic Predictions Hook

```typescript
// src/hooks/useAIPredictions.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AIPrediction {
  id: string;
  type: 'immediate' | 'seasonal' | 'longterm';
  severity: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  pattern: string;
  confidence: number;
  preventionProtocols: string[];
  reasoning?: string; // AI's explanation
  dataPoints?: string[]; // What data led to this
  lastUpdated: Date;
}

export function useAIPredictions() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchPredictions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ai/predictions/${user.id}`
        );

        if (!response.ok) throw new Error('Failed to fetch predictions');

        const data = await response.json();
        
        // Transform and enrich predictions
        const enrichedPredictions = data.predictions.map((p: any) => ({
          ...p,
          lastUpdated: new Date()
        }));

        setPredictions(enrichedPredictions);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching AI predictions:', err);
        
        // Could fall back to some generic predictions here
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();

    // Refresh every hour
    const interval = setInterval(fetchPredictions, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return { predictions, isLoading, error, refetch: () => {} };
}
```

### 2.2 AI Pattern Questions Hook

```typescript
// src/hooks/useAIPatternQuestions.ts
export interface AIPatternQuestion {
  id: string;
  question: string;
  category: 'sleep' | 'energy' | 'mood' | 'physical' | 'other';
  answer: string;
  deepDive: string[];
  connections: string[];
  relevanceScore: number; // How relevant to this user
  basedOn: string[]; // What data points generated this
}

export function useAIPatternQuestions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<AIPatternQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const generateQuestions = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ai/pattern-questions/${user.id}`
        );

        if (!response.ok) throw new Error('Failed to generate questions');

        const data = await response.json();
        
        // Sort by relevance
        const sortedQuestions = data.questions.sort(
          (a: any, b: any) => b.relevanceScore - a.relevanceScore
        );

        setQuestions(sortedQuestions);
      } catch (error) {
        console.error('Error generating pattern questions:', error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    generateQuestions();
  }, [user?.id]);

  return { questions, isLoading };
}
```

### 2.3 Update Predictive Insights Page

```tsx
// src/app/predictive-insights/page.tsx
import { useAIPredictions } from '@/hooks/useAIPredictions';
import { useAIPatternQuestions } from '@/hooks/useAIPatternQuestions';
import { useAIBodyPatterns } from '@/hooks/useAIBodyPatterns';

export default function PredictiveInsightsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'immediate' | 'seasonal' | 'longterm'>('immediate');
  
  // Replace mock data with AI data
  const { predictions, isLoading: predictionsLoading } = useAIPredictions();
  const { questions, isLoading: questionsLoading } = useAIPatternQuestions();
  const { patterns: bodyPatterns, isLoading: patternsLoading } = useAIBodyPatterns();
  
  const getTabPredictions = () => {
    return predictions.filter(p => p.type === activeTab);
  };

  const getIconForPrediction = (prediction: AIPrediction) => {
    // Map prediction categories to icons
    const iconMap: Record<string, React.ReactNode> = {
      'migraine': <CloudRain className="w-6 h-6" />,
      'sleep': <Moon className="w-6 h-6" />,
      'energy': <Zap className="w-6 h-6" />,
      'mood': <Brain className="w-6 h-6" />,
      'allergy': <Flower2 className="w-6 h-6" />,
      'stress': <AlertTriangle className="w-6 h-6" />,
      'cardiovascular': <Heart className="w-6 h-6" />,
      'digestive': <Coffee className="w-6 h-6" />,
      'default': <Activity className="w-6 h-6" />
    };
    
    // Extract category from title or pattern
    const category = detectCategory(prediction.title, prediction.pattern);
    return iconMap[category] || iconMap.default;
  };

  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
        {/* Keep existing background effects */}
        
        {/* Content */}
        <div className="relative z-10 px-6 py-6">
          <motion.div className="max-w-6xl mx-auto">
            {/* Keep existing header */}
            
            {/* Predictions Grid */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} className="mb-8">
                {predictionsLoading ? (
                  <PredictionsLoadingSkeleton />
                ) : (
                  <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                    <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                      {activeTab === 'immediate' && <Calendar className="w-6 h-6 text-purple-400" />}
                      {activeTab === 'seasonal' && <Leaf className="w-6 h-6 text-green-400" />}
                      {activeTab === 'longterm' && <Eye className="w-6 h-6 text-purple-400" />}
                      {activeTab === 'immediate' && 'Next 7 Days'}
                      {activeTab === 'seasonal' && 'Next 3 Months'}
                      {activeTab === 'longterm' && 'Long-term Outlook'}
                      <span className="text-sm text-gray-400 font-normal ml-auto">
                        {getTabPredictions().length} predictions
                      </span>
                    </h2>
                    
                    {getTabPredictions().length === 0 ? (
                      <EmptyPredictionsState type={activeTab} />
                    ) : (
                      <div className="space-y-6">
                        {getTabPredictions().map((prediction) => (
                          <PredictionCard
                            key={prediction.id}
                            prediction={prediction}
                            icon={getIconForPrediction(prediction)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* AI-Generated Body Patterns */}
            {!patternsLoading && bodyPatterns && (
              <motion.div className="mb-8 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
                <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-400" />
                  Your Body's Unique Patterns
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-gray-400 mb-3">You tend to...</h4>
                    <ul className="space-y-2 text-gray-300">
                      {bodyPatterns.tendencies.map((tendency, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          {tendency}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-gray-400 mb-3">Your body responds well to...</h4>
                    <ul className="space-y-2 text-gray-300">
                      {bodyPatterns.positiveResponses.map((response, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          {response}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI-Generated Pattern Explorer */}
            {!questionsLoading && questions.length > 0 && (
              <motion.div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-purple-400" />
                  Questions About Your Patterns
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {questions.slice(0, 4).map((pattern) => (
                    <PatternQuestionCard
                      key={pattern.id}
                      pattern={pattern}
                      onSelect={setSelectedPattern}
                      isSelected={selectedPattern === pattern.id}
                    />
                  ))}
                </div>

                {/* Pattern Deep Dive */}
                <AnimatePresence>
                  {selectedPattern && (
                    <PatternDeepDive
                      pattern={questions.find(q => q.id === selectedPattern)!}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </UnifiedAuthGuard>
  );
}
```

### 2.4 Backend AI Predictions Engine

```python
# backend/api/ai/predictions.py
@router.get("/api/ai/predictions/{user_id}")
async def generate_ai_predictions(user_id: str):
    """
    Generates personalized health predictions across multiple timeframes
    """
    
    # Gather comprehensive data
    user_data = await gather_full_user_data(user_id)
    
    if not user_data.has_sufficient_data:
        return {"predictions": generate_onboarding_predictions()}
    
    predictions = []
    
    # 1. Immediate predictions (next 7 days)
    immediate_context = prepare_immediate_context(user_data)
    immediate_prompt = f"""
    Analyze this user's recent health patterns and generate predictions for the next 7 days.
    
    Data:
    {json.dumps(immediate_context, indent=2)}
    
    Generate 2-4 specific predictions based on:
    - Recent symptom patterns
    - Sleep/stress/mood trends
    - Day of week patterns
    - Weather correlations (if applicable)
    - Medication adherence
    
    For each prediction include:
    - type: "immediate"
    - severity: "info" (optimization), "warning" (preventable), "alert" (urgent)
    - title: Specific, actionable title
    - description: 2-3 sentences explaining why
    - pattern: The specific pattern detected
    - confidence: 0-100 based on data strength
    - preventionProtocols: Array of 3-5 specific actions
    - category: migraine/sleep/energy/mood/stress/other
    
    Only include predictions with confidence > 60%.
    Output as JSON array.
    """
    
    immediate_predictions = await generate_predictions(immediate_prompt)
    predictions.extend(immediate_predictions)
    
    # 2. Seasonal predictions
    seasonal_context = prepare_seasonal_context(user_data)
    seasonal_prompt = f"""
    Based on historical patterns and upcoming season changes, generate predictions for next 3 months.
    
    Consider:
    - Past seasonal patterns (same time last year)
    - Allergy history
    - Weather sensitivity
    - Holiday stress patterns
    - Vitamin D patterns
    
    Context:
    {json.dumps(seasonal_context, indent=2)}
    
    Generate 1-3 seasonal predictions.
    Format same as above but type: "seasonal"
    """
    
    seasonal_predictions = await generate_predictions(seasonal_prompt)
    predictions.extend(seasonal_predictions)
    
    # 3. Long-term trajectory
    longterm_analysis = await analyze_longterm_risks(user_data)
    if longterm_analysis:
        predictions.extend(longterm_analysis)
    
    # Enrich predictions with icon mappings
    for pred in predictions:
        pred["gradient"] = get_gradient_for_severity(pred["severity"])
    
    return {
        "predictions": predictions,
        "generated_at": datetime.now().isoformat(),
        "data_quality_score": calculate_data_quality(user_data)
    }

async def generate_predictions(prompt: str) -> List[dict]:
    """Generate predictions using LLM"""
    response = await llm_service.generate(prompt, model="gpt-4")
    predictions = json.loads(response)
    
    # Validate and clean predictions
    valid_predictions = []
    for pred in predictions:
        if validate_prediction(pred):
            pred["id"] = str(uuid.uuid4())
            pred["generated_at"] = datetime.now().isoformat()
            valid_predictions.append(pred)
    
    return valid_predictions
```

### 2.5 AI Pattern Questions Generation

```python
# backend/api/ai/pattern_questions.py
@router.get("/api/ai/pattern-questions/{user_id}")
async def generate_pattern_questions(user_id: str):
    """
    Generates personalized questions about the user's health patterns
    """
    
    # Get user's unique patterns
    patterns = await analyze_user_patterns(user_id)
    anomalies = await detect_anomalies(user_id)
    correlations = await find_correlations(user_id)
    
    context = {
        "top_patterns": patterns[:10],
        "unusual_findings": anomalies,
        "strong_correlations": correlations,
        "user_concerns": await get_user_focus_areas(user_id)
    }
    
    prompt = f"""
    Based on this user's unique health patterns, generate 4-6 insightful questions they might wonder about.
    
    Patterns found:
    {json.dumps(context, indent=2)}
    
    Generate questions that:
    1. Are specific to THIS user's data (not generic)
    2. Address patterns they might not have noticed
    3. Explain timing correlations they experience
    4. Connect seemingly unrelated symptoms
    
    For each question:
    - question: Natural language question (e.g., "Why do I always feel tired on Wednesdays?")
    - category: sleep/energy/mood/physical/other
    - answer: Brief 1-2 sentence answer
    - deepDive: Array of 4-5 detailed insights
    - connections: Array of related patterns
    - relevanceScore: 0-100 based on pattern strength
    - basedOn: Array of data points that led to this question
    
    Make questions conversational and insightful.
    Output as JSON array.
    """
    
    questions = await llm_service.generate(prompt, model="gpt-4")
    parsed_questions = json.loads(questions)
    
    # Add icon mappings
    for q in parsed_questions:
        q["id"] = str(uuid.uuid4())
    
    return {
        "questions": parsed_questions,
        "generated_at": datetime.now().isoformat()
    }
```

### 2.6 AI Body Patterns Analysis

```python
# backend/api/ai/body_patterns.py
@router.get("/api/ai/body-patterns/{user_id}")
async def analyze_body_patterns(user_id: str):
    """
    Generates personalized insights about user's body patterns
    """
    
    # Comprehensive pattern analysis
    all_patterns = await get_all_user_patterns(user_id)
    
    prompt = f"""
    Analyze these health patterns and create two lists of insights.
    
    Patterns:
    {json.dumps(all_patterns, indent=2)}
    
    Generate:
    1. "tendencies" - 5-6 specific negative patterns or triggers
       Example: "Get migraines 48-72 hours after high stress events"
       
    2. "positiveResponses" - 5-6 things that consistently help
       Example: "Sleep quality improves with 30min morning walks"
    
    Make each insight:
    - Specific with numbers/timeframes when possible
    - Based on actual data patterns
    - Actionable (user can work with this knowledge)
    - Written in second person ("You tend to...")
    
    Output as JSON with two arrays.
    """
    
    response = await llm_service.generate(prompt, model="gpt-4")
    patterns = json.loads(response)
    
    return {
        "patterns": patterns,
        "lastUpdated": datetime.now().isoformat(),
        "dataPoints": len(all_patterns)
    }
```

## Part 3: Components Implementation

### 3.1 Prediction Card Component

```tsx
// src/components/predictive/PredictionCard.tsx
interface PredictionCardProps {
  prediction: AIPrediction;
  icon: React.ReactNode;
}

export function PredictionCard({ prediction, icon }: PredictionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  
  const getSeverityStyle = (severity: string) => {
    // Same as before but cleaner
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`backdrop-blur-[20px] bg-gradient-to-r ${
        prediction.gradient || 'from-gray-500/20 to-slate-500/20'
      } border ${getSeverityStyle(prediction.severity)} rounded-xl p-6 cursor-pointer transition-all`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-white/[0.05] ${getSeverityStyle(prediction.severity)}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            {prediction.title}
          </h3>
          <p className="text-gray-300 mb-2">{prediction.description}</p>
          <p className="text-sm text-gray-400 mb-3">
            Pattern: {prediction.pattern}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">
              Based on your data
            </span>
            <span className={`font-medium ${
              prediction.confidence > 80 ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {prediction.confidence}% confidence
            </span>
            {prediction.dataPoints && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReasoning(!showReasoning);
                }}
                className="text-purple-400 hover:text-purple-300"
              >
                Why? →
              </button>
            )}
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
          expanded ? 'rotate-90' : ''
        }`} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-white/[0.1]"
          >
            <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Prevention Protocol
            </h4>
            <div className="space-y-3">
              {prediction.preventionProtocols.map((protocol, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-xs text-gray-400">
                    {idx + 1}
                  </div>
                  <p className="text-gray-300">{protocol}</p>
                </div>
              ))}
            </div>
            
            {showReasoning && prediction.reasoning && (
              <div className="mt-4 p-4 bg-white/[0.03] rounded-lg">
                <h5 className="text-sm font-medium text-gray-400 mb-2">
                  AI Analysis
                </h5>
                <p className="text-sm text-gray-300">{prediction.reasoning}</p>
                {prediction.dataPoints && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Based on:</p>
                    <ul className="text-xs text-gray-400 mt-1">
                      {prediction.dataPoints.map((point, idx) => (
                        <li key={idx}>• {point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

## Part 4: Caching & Performance

```typescript
// src/lib/aiCache.ts
class AICache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutes

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < (ttl || this.TTL)) {
      return cached.data as T;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // If fetch fails but we have stale data, return it
      if (cached) {
        console.warn('Using stale cache due to fetch error:', error);
        return cached.data as T;
      }
      throw error;
    }
  }

  invalidate(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export const aiCache = new AICache();
```

## Part 5: Error States & Loading

```tsx
// src/components/predictive/PredictionsLoadingSkeleton.tsx
export function PredictionsLoadingSkeleton() {
  return (
    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-700 rounded w-48"></div>
          <div className="ml-auto h-4 bg-gray-700 rounded w-24"></div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Empty state
export function EmptyPredictionsState({ type }: { type: string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
        <Activity className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">
        No {type} predictions yet
      </h3>
      <p className="text-gray-400 mb-4 max-w-md mx-auto">
        Keep logging your health data. As we learn your patterns, 
        predictions will appear here.
      </p>
      <button 
        onClick={() => router.push('/dashboard')}
        className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 
                 text-purple-400 rounded-lg transition-colors"
      >
        Log Health Data
      </button>
    </div>
  );
}
```

## Implementation Timeline

### Week 1: Core Infrastructure
- [ ] Set up AI hooks (useAIPredictiveAlert, useAIPredictions)
- [ ] Create backend endpoints for dashboard alert
- [ ] Implement basic caching layer
- [ ] Add loading states

### Week 2: AI Integration
- [ ] Integrate LLM for prediction generation
- [ ] Build pattern analysis engine
- [ ] Create question generation system
- [ ] Test with real user data

### Week 3: UI Polish
- [ ] Update dashboard with dynamic alert
- [ ] Refactor predictive insights page
- [ ] Add animations and transitions
- [ ] Implement error handling

### Week 4: Optimization
- [ ] Add analytics tracking
- [ ] Optimize API calls
- [ ] A/B test AI prompts
- [ ] Performance monitoring

## Success Metrics
- **Alert Relevance**: >85% of users find alerts accurate
- **Engagement**: 3x increase in predictive insights page visits
- **Prevention Success**: Track if predicted events were prevented
- **API Performance**: <2s response time for predictions
- **User Satisfaction**: >4.5/5 rating for AI insights

---

This complete implementation transforms your static predictive features into a dynamic, AI-powered system that provides personalized health insights based on each user's actual data patterns.