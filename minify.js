const fs = require('fs');
const { minify } = require('terser');

(async () => {
  try {
    const code = fs.readFileSync('js/main.js', 'utf8');
    const result = await minify(code, { compress: true, mangle: true });
    if (result.error) {
      console.error('Minify error:', result.error);
      process.exit(1);
    }
    fs.writeFileSync('js/main.min.js', result.code);
    console.log('Successfully minified main.js → main.min.js');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
