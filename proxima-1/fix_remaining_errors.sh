#\!/bin/bash

# Fix unused imports in InteractiveDemo.tsx
sed -i '' 's/import { Play, Pause, ChevronRight, X, Lock }/import { Play, Pause, X, Lock }/' src/components/demo/InteractiveDemo.tsx
sed -i '' 's/const backToCards = () => {/const backToCards = () => { return; \/\/ unused/' src/components/demo/InteractiveDemo.tsx

# Fix unused imports in InteractiveWalkthrough.tsx  
sed -i '' 's/import { Play, Pause, ChevronRight, X, HeartPulse, Lock, Check }/import { Pause, X, HeartPulse, Check }/' src/components/demo/InteractiveWalkthrough.tsx
sed -i '' 's/const parsed = /const _parsed = /' src/components/demo/InteractiveWalkthrough.tsx

# Fix unused imports in PhotoAnalysisDemo.tsx
sed -i '' 's/import { Camera, Upload, X, AlertCircle, Clock, Play, ChevronRight }/import { Camera, Upload, X, AlertCircle, Play, ChevronRight }/' src/components/demo/PhotoAnalysisDemo.tsx

# Fix unused imports in QuickScanDemo.tsx
sed -i '' 's/import { Brain, Sparkles, ChevronRight, X, MousePointer, MessageSquare, Clock, CheckCircle }/import { Brain, Sparkles, ChevronRight, X, MousePointer, MessageSquare, CheckCircle }/' src/components/demo/QuickScanDemo.tsx
sed -i '' 's/const \[clickPosition, setClickPosition\] = /const [, ] = /' src/components/demo/QuickScanDemo.tsx
sed -i '' "s/const bioDigitalUrl = /\/\/ const bioDigitalUrl = /" src/components/demo/QuickScanDemo.tsx

# Fix OracleFullScreen index parameter
sed -i '' 's/\.map((message, index) =>/\.map((message) =>/' src/components/OracleFullScreen.tsx

# Fix middleware.ts
sed -i '' 's/} catch (profileError) {/} catch {/' src/middleware.ts

# Fix onboarding.ts
sed -i '' 's/let error = null/const error = null/' src/utils/onboarding.ts

echo "Additional fixes applied"
