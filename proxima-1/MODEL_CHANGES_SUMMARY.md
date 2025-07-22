# Complete Model Changes Summary

## All Endpoints and Model Modifications

### 1. Quick Scan Endpoints

#### `/api/quick-scan`
- **No changes made** - Uses backend default models
- Backend handles model selection

#### `/api/quick-scan/think-harder`
- **No changes made** - Uses backend default (typically `openai/gpt-4o-mini`)
- Backend handles the enhancement

### 2. Deep Dive Endpoints

#### `/api/deep-dive/start`
- **Primary Model**: `tngtech/deepseek-r1t-chimera:free` (changed from `deepseek/deepseek-r1-0528:free`)
- **Fallback Chain**:
  1. `tngtech/deepseek-r1t-chimera:free`
  2. `openai/gpt-4-turbo`
  3. `anthropic/claude-3-sonnet`
  4. `deepseek/deepseek-chat`
- **Implementation**: Exponential backoff retry logic

#### `/api/deep-dive/continue`
- **Fallback Model**: `deepseek/deepseek-chat`
- **Added**: `fallback_model` parameter support

#### `/api/deep-dive/complete`
- **Fallback Model**: `google/gemini-2.0-pro`
- **Added**: `fallback_model` parameter support

#### `/api/deep-dive/ultra-think`
- **Model**: `x-ai/grok-4` (explicitly specified)
- **Parameter Change**: Uses `session_id` instead of `deep_dive_id`

#### `/api/deep-dive/ask-more`
- **No model changes** - Uses session's existing model
- **Parameter Changes**: 
  - Removed `previousAnswers`
  - Target confidence: 95%
  - Max questions: 5

### 3. Oracle AI Chat

#### `/api/chat`
- **Model**: `openai/gpt-4o-mini` (explicitly specified in OracleAIModal)
- **No changes to existing implementation**

## Files Modified

### Deep Dive Client (`src/lib/deepdive-client.ts`)
- Changed default model in `startDeepDive`
- Added `fallback_model` parameter to `continueDeepDive`
- Added `fallback_model` parameter to `completeDeepDive`
- Updated `askMeMore` parameters

### Deep Dive Chat Component (`src/components/DeepDiveChat.tsx`)
- Updated model array for retry logic
- Added fallback models to API calls
- Fixed Ultra Think to use `session_id`

### Oracle AI Modal (`src/components/OracleAIModal.tsx`)
- Explicitly specifies `openai/gpt-4o-mini` for chat

### Quick Scan Results (`src/components/QuickScanResults.tsx`)
- Fixed confidence calculation (85% → 88%, not 173%)
- No model changes for Quick Scan endpoints

## Summary of Model Strategy

1. **Quick Scan**: Relies on backend defaults (no frontend model specification)
2. **Deep Dive**: Aggressive fallback strategy with 4 different models
3. **Ultra Think**: Always uses Grok 4 for maximum reasoning
4. **Oracle Chat**: Always uses GPT-4o-mini for quick responses

## Confidence Calculation Fix

The issue where confidence showed 173% instead of 88% has been fixed by:
- Properly calculating enhanced confidence as `original + improvement`
- Adding fallback values to prevent undefined arithmetic
- Ensuring confidence never exceeds reasonable bounds