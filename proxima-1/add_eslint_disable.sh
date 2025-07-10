#\!/bin/bash

# Add eslint-disable comments for BioDigitalDirect.tsx
sed -i '' '37s/^/              \/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n/' src/components/demo/BioDigitalDirect.tsx
sed -i '' '55s/^/              \/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n/' src/components/demo/BioDigitalDirect.tsx
sed -i '' '60s/^/              \/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n/' src/components/demo/BioDigitalDirect.tsx
sed -i '' '69s/^/            \/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n/' src/components/demo/BioDigitalDirect.tsx

# Add eslint-disable for BioDigitalHosted.tsx
sed -i '' '5s/^/\/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n/' src/components/demo/BioDigitalHosted.tsx

# Add eslint-disable for InteractiveDemo.tsx and InteractiveWalkthrough.tsx
sed -i '' '50s/^/    \/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n/' src/components/demo/InteractiveDemo.tsx
sed -i '' '63s/^/    \/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n/' src/components/demo/InteractiveWalkthrough.tsx

echo "ESLint disable comments added"
