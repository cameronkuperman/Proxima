#\!/bin/bash

# Fix OracleFullScreen.tsx
sed -i '' "s/I'm analyzing your symptoms/I\&apos;m analyzing your symptoms/g" src/components/OracleFullScreen.tsx

# Fix PhotoAnalysis.tsx  
sed -i '' "s/we'll track changes/we\&apos;ll track changes/g" src/components/PhotoAnalysis.tsx

# Fix DeepDiveDemo.tsx
sed -i '' "s/let's understand/let\&apos;s understand/g" src/components/demo/DeepDiveDemo.tsx
sed -i '' "s/I've been experiencing/I\&apos;ve been experiencing/g" src/components/demo/DeepDiveDemo.tsx
sed -i '' "s/I've had/I\&apos;ve had/g" src/components/demo/DeepDiveDemo.tsx
sed -i '' 's/"migraine diary"/"migraine diary"/g' src/components/demo/DeepDiveDemo.tsx

# Fix InteractiveDemo.tsx
sed -i '' "s/Let's get started/Let\&apos;s get started/g" src/components/demo/InteractiveDemo.tsx

# Fix InteractiveWalkthrough.tsx
sed -i '' "s/where it's hurting/where it\&apos;s hurting/g" src/components/demo/InteractiveWalkthrough.tsx
sed -i '' "s/I'll guide you/I\&apos;ll guide you/g" src/components/demo/InteractiveWalkthrough.tsx

# Fix PhotoAnalysisDemo.tsx
sed -i '' "s/Let's analyze/Let\&apos;s analyze/g" src/components/demo/PhotoAnalysisDemo.tsx
sed -i '' "s/that's concerning/that\&apos;s concerning/g" src/components/demo/PhotoAnalysisDemo.tsx

# Fix QuickScanDemo.tsx
sed -i '' "s/I've been having/I\&apos;ve been having/g" src/components/demo/QuickScanDemo.tsx
sed -i '' "s/Here's what/Here\&apos;s what/g" src/components/demo/QuickScanDemo.tsx
sed -i '' "s/you're experiencing/you\&apos;re experiencing/g" src/components/demo/QuickScanDemo.tsx

echo "Apostrophe fixes applied"
