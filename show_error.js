const fs = require('fs');
const code = fs.readFileSync('./js/main.min.js', 'utf8');

const errorPos = 3207;
console.log('=== SYNTAX ERROR DETAILS ===');
console.log('Position: byte 3207 (1-based: 3208)');
console.log('Line: 1 (entire file is on 1 line)');
console.log('Character position in line: 3208');
console.log('');
console.log('=== CONTEXT (200 chars around error) ===');
console.log(code.substring(errorPos - 100, errorPos + 100));
console.log('');
console.log('=== ERROR MARKER ===');
console.log('Character at position 3207: ' + JSON.stringify(code[errorPos]));
console.log('');
// Show previous and next 5 chars
console.log('Previous 10 chars:', JSON.stringify(code.substring(errorPos - 10, errorPos)));
console.log('ERROR CHAR: ' + JSON.stringify(code[errorPos]));
console.log('Next 10 chars:', JSON.stringify(code.substring(errorPos + 1, errorPos + 11)));
