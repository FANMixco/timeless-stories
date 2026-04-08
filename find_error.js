const fs = require('fs');
const code = fs.readFileSync('./js/main.min.js', 'utf8');

// Find the position where parens become negative
let parens = 0;
let lines = 1;
let charInLine = 1;
let errorPos = -1;

for (let i = 0; i < code.length; i++) {
  const c = code[i];
  
  if (c === '(') parens++;
  if (c === ')') {
    parens--;
    if (parens < 0) {
      errorPos = i;
      console.log('ERROR FOUND:');
      console.log('Position (0-based):', i);
      console.log('Position (1-based):', i + 1);
      console.log('Line:', lines);
      console.log('Character in line:', charInLine);
      console.log('Context (50 chars before error):');
      console.log(code.substring(i - 50, i + 50));
      break;
    }
  }
  
  if (c === '\n') {
    lines++;
    charInLine = 0;
  }
  charInLine++;
}

if (errorPos === -1) {
  console.log('No unmatched closing paren found. Checking overall balance:');
  let b=0, p=0, br=0;
  for (let c of code) {
    if (c === '{') b++; if (c === '}') b--;
    if (c === '(') p++; if (c === ')') p--;
    if (c === '[') br++; if (c === ']') br--;
  }
  console.log('Braces:', b, 'Parens:', p, 'Brackets:', br);
}
