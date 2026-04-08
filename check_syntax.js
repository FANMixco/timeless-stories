const fs = require('fs');
const code = fs.readFileSync('./js/main.min.js', 'utf8');
console.log('File length:', code.length, 'characters');
console.log('Lines:', code.split('\n').length);

// Try to find unclosed brackets
let braces = 0, parens = 0, brackets = 0;
for (let i = 0; i < code.length; i++) {
  const c = code[i];
  if (c === '{') braces++;
  if (c === '}') braces--;
  if (c === '(') parens++;
  if (c === ')') parens--;
  if (c === '[') brackets++;
  if (c === ']') brackets--;
}
console.log('Unclosed braces:', braces);
console.log('Unclosed parens:', parens);
console.log('Unclosed brackets:', brackets);

// Get last 200 chars
console.log('Last 150 chars of file:');
console.log(code.substring(code.length - 150));
