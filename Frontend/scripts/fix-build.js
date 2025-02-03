#!/usr/bin/env node
/**
 * This script applies fixes for the build errors in the project
 * - Fixes dynamic routes to use useParams instead of receiving params as props
 * - Updates typing issues with the Quiz export
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Applying fixes for build errors...');

// List of files to be fixed
const filesToFix = [
  { 
    path: 'app/quizzes/[id]/page.tsx',
    replacements: [
      { from: /export default function QuizDetailsPage\({ params }: { params: { id: string } }\)/g, to: 'export default function QuizDetailsPage() {\n  const params = useParams();\n  const quizId = params?.id as string;' },
      { from: /const quizId = params.id;/g, to: '' },
      { from: /import { useRouter } from 'next\/navigation';/g, to: 'import { useRouter, useParams } from \'next/navigation\';' }
    ]
  },
  {
    path: 'app/note-summary/note/[id]/page.tsx',
    replacements: [
      { from: /export default function NotePage\({ params }: { params: Promise<{ id: string }> }\)/g, to: 'export default function NotePage() {\n  const params = useParams();\n  const noteId = params?.id as string;' },
      { from: /const { id: noteId } = React.use\(params\);/g, to: '' },
      { from: /import { useRouter } from 'next\/navigation';/g, to: 'import { useRouter, useParams } from \'next/navigation\';' }
    ]
  },
  {
    path: 'app/note-summary/audio/[id]/page.tsx',
    replacements: [
      { from: /export default function AudioPage\({ params }: { params: Promise<{ id: string }> }\)/g, to: 'export default function AudioPage() {\n  const params = useParams();\n  const audioId = params?.id as string;' },
      { from: /const { id } = React.use\(params\);/g, to: '' },
      { from: /import { useRouter } from 'next\/navigation';/g, to: 'import { useRouter, useParams } from \'next/navigation\';' },
      { from: /setAudio\(mockAudios\[id\] \|\| null\);/g, to: 'setAudio(mockAudios[audioId] || null);' },
      { from: /\}, \[id\]\);/g, to: '}, [audioId]);' },
      { from: /\.filter\(a => a\.id !== id\)/g, to: '.filter(a => a.id !== audioId)' }
    ]
  },
  {
    path: 'app/note-summary/video/[id]/page.tsx',
    replacements: [
      { from: /export default function VideoPage\({ params }: { params: Promise<{ id: string }> }\)/g, to: 'export default function VideoPage() {\n  const params = useParams();\n  const videoId = params?.id as string;' },
      { from: /const { id } = React.use\(params\);/g, to: '' },
      { from: /import { useRouter } from 'next\/navigation';/g, to: 'import { useRouter, useParams } from \'next/navigation\';' },
      { from: /setVideo\(mockVideos\[id\] \|\| null\);/g, to: 'setVideo(mockVideos[videoId] || null);' },
      { from: /\}, \[id\]\);/g, to: '}, [videoId]);' },
      { from: /\.filter\(v => v\.id !== id\)/g, to: '.filter(v => v.id !== videoId)' }
    ]
  },
  {
    path: 'app/quizzes/quizzes.service.ts',
    replacements: [
      { from: /import \{\s*CreateQuizParams,\s*Quiz,\s*QuizAnswers/g, to: 'import {\n  CreateQuizParams,\n  QuizAnswers' },
      { from: /}\s*from\s*'\.\/types';/g, to: '}\nfrom \'./types\';\n\n// Import Quiz directly\nimport type { Quiz } from \'./types\';\n\n// Re-export Quiz for use in other components\nexport type { Quiz } from \'./types\';' },
      { from: /export \{\s*Quiz\s*\};/g, to: '' }
    ]
  }
];

// Function to fix a file
function fixFile(filePath, replacements) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️ No changes needed for: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error fixing file ${filePath}:`, error);
    return false;
  }
}

// Apply all fixes
let fixedCount = 0;

filesToFix.forEach((file) => {
  const success = fixFile(file.path, file.replacements);
  if (success) fixedCount++;
});

console.log(`\nComplete! Fixed ${fixedCount} out of ${filesToFix.length} files.`);
console.log('You can now try building the project again.');

// Provide instructions for next steps
console.log("\nTo commit these changes and push to GitHub:");
console.log("git add .");
console.log("git commit -m \"[Fix] Update dynamic routes to use useParams hook for Next.js 15 compatibility\"");
console.log("git push"); 