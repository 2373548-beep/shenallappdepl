
const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, 'public', 'Question all 1 to 430.txt');
const imgDir = path.join(__dirname, 'public', 'imahges of the questions');

const text = fs.readFileSync(txtPath, 'utf8');
const blocks = text.split(/Question\s+(\d+):/i).filter(Boolean);

const questions = [];

for (let i = 0; i < blocks.length; i += 2) {
  const questionNumber = parseInt(blocks[i], 10);
  const block = blocks[i + 1];

  const isDebugQuestion = [57, 100].includes(questionNumber);

  if (isDebugQuestion) {
    console.log('\n=== DEBUG: Processing question', questionNumber);
  }

  if (!block) {
    if (isDebugQuestion) console.log('  ⚠️ No content');
    continue;
  }

  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  let question = '';
  let option_a = '';
  let option_b = '';
  let option_c = '';
  let correct_option = '';
  let currentPart = 'question';

  for (const line of lines) {
    if (/^Correct Answer:\s*([ABC])/i.test(line)) {
      const match = line.match(/^Correct Answer:\s*([ABC])/i);
      if (match) correct_option = match[1].toUpperCase();
      continue;
    }
    if (/^A\)\s*/i.test(line)) {
      currentPart = 'A';
      option_a = line.replace(/^A\)\s*/i, '').trim();
      continue;
    }
    if (/^B\)\s*/i.test(line)) {
      currentPart = 'B';
      option_b = line.replace(/^B\)\s*/i, '').trim();
      continue;
    }
    if (/^C\)\s*/i.test(line)) {
      currentPart = 'C';
      option_c = line.replace(/^C\)\s*/i, '').trim();
      continue;
    }
    if (line.startsWith('------------------------------')) continue;

    if (currentPart === 'question') {
      question += (question ? ' ' : '') + line;
    } else if (currentPart === 'A') {
      option_a += ' ' + line;
    } else if (currentPart === 'B') {
      option_b += ' ' + line;
    } else if (currentPart === 'C') {
      option_c += ' ' + line;
    }
  }

  question = question.trim();
  option_a = option_a.trim();
  option_b = option_b.trim();
  option_c = option_c.trim();

  if (isDebugQuestion) {
    console.log('  ✅ Question:', question);
    console.log('  ✅ Option A:', option_a);
    console.log('  ✅ Option B:', option_b);
    console.log('  ✅ Option C:', option_c);
    console.log('  ✅ Correct option:', correct_option);
  }

  if (question && option_a && option_b && option_c && correct_option) {
    let image_url = null;
    const imgPath = path.join(imgDir, `${questionNumber}.png`);
    if (isDebugQuestion) console.log('  📸 Checking image at:', imgPath);
    if (fs.existsSync(imgPath)) {
      image_url = `/imahges of the questions/${questionNumber}.png`;
      if (isDebugQuestion) console.log('  ✅ Found image:', image_url);
    } else {
      if (isDebugQuestion) console.log('  ❌ No image');
    }
    questions.push({ id: questionNumber, question, option_a, option_b, option_c, correct_option, category: null, image_url });
  }
}

questions.sort((a, b) => a.id - b.id);

const tsOutput = `// Generated from Question all 1 to 430.txt
import type { QuizQuestion } from "./types";
export const parsedQuestions: QuizQuestion[] = ${JSON.stringify(questions, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, 'src', 'lib', 'db', 'parsed-questions.ts'), tsOutput, 'utf8');
console.log(`✅ Successfully parsed ${questions.length} questions!`);
