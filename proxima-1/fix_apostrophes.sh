#\!/bin/bash

# Fix unescaped apostrophes in all component files
files=(
  "src/components/About.tsx"
  "src/components/Contact.tsx"
  "src/components/EmailSignupForm.tsx"
  "src/components/Features.tsx"
  "src/components/HealthcarePros.tsx"
  "src/components/Hero.tsx"
  "src/components/OnboardingFlow.tsx"
  "src/components/OracleFullScreen.tsx"
  "src/components/PhotoAnalysis.tsx"
  "src/components/demo/DeepDiveDemo.tsx"
  "src/components/demo/InteractiveDemo.tsx"
  "src/components/demo/InteractiveWalkthrough.tsx"
  "src/components/demo/PhotoAnalysisDemo.tsx"
  "src/components/demo/QuickScanDemo.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Use sed to replace ' with &apos; but only in JSX text content
    sed -i.bak "s/\([>]\)\([^<]*\)'\([^<]*\)\([<]\)/\1\2\&apos;\3\4/g" "$file"
    # Remove backup files
    rm -f "${file}.bak"
  fi
done

echo "Done fixing apostrophes"
