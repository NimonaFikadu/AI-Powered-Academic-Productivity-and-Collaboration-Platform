#!/bin/bash

# Apply ESLint fixes automatically
echo "Running ESLint with auto-fix..."
npm run lint:fix

# Fix unused variables by prefixing them with underscore
echo "Fixing remaining common ESLint issues..."

# Files with unused vars - add underscore prefix
FILES_WITH_UNUSED_VARS=(
  "app/assistance/assistanceService.ts"
  "app/topics/\[id\]/page.tsx"
  "app/calendar/page.tsx" 
  "app/home/page.tsx"
  "app/insights/page.tsx"
  "app/notes-materials/UploadFileModal.tsx"
  "app/notes-materials/page.tsx"
  "components/modals/EditYourProfile.tsx"
)

for file in "${FILES_WITH_UNUSED_VARS[@]}"; do
  echo "Processing $file"
  if [ -f "$file" ]; then
    # Use sed to prefix unused variables with underscore
    sed -i 's/\b\(const \)\([a-zA-Z0-9]\+\)\( = [^;]*\)\(.*\/\/ eslint-disable-line\)/\1_\2\3\4/g' "$file"
  else
    echo "Warning: File $file not found"
  fi
done

# Final lint check
echo "Running final lint check..."
npm run lint

echo "Lint fixing completed! Check for any remaining errors above." 