const split = require('split');

const readLines = stream => new Promise((resolve, reject) => (
  chunks => stream
    .pipe(split(/\r?\n/))
    .on('data', chunk => chunks.push(chunk.trim()))
    .on('end', () => resolve(chunks))
    .on('error', reject)
)([]));

module.exports = {
  readLines
};
