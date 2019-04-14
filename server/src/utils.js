const fs = require('fs');
const split = require('split');
const unzipper = require('unzipper');
const { Readable } = require('stream');
const { createExtractorFromData } = require('node-unrar-js');

const delay = sec => new Promise(resolve => setTimeout(resolve, sec * 1000));

const reduceStream = (stream, D, F) =>
  new Promise((resolve, reject) =>
    stream
      .on('data', d => F(D, d))
      .on('end', () => resolve(D))
      .on('error', reject)
  );

const unzip = stream => stream.pipe(unzipper.ParseOne());

const unrar = async stream => {
  const chunks = await reduceStream(stream, [], (chunks, chunk) => chunks.push(chunk));
  const { buffer } = Uint8Array.from(Buffer.concat(chunks));
  const extractor = createExtractorFromData(buffer);
  const [{ state, reason, msg }, data] = extractor.extractAll();
  if (state === 'FAIL') {
    throw new Error(`[${reason}] ${msg}`);
  }
  
  const { files: [{ fileHeader: { name, }, extract: [ status, array ] }] } = data;
  if (status.state === 'FAIL') {
    throw new Error(`[${status.reason}] ${status.msg}`);
  }

  const content = new Readable();
  content.push((array));
  content.push(null);

  return { name, content };
};

const writeStream = (stream, path) =>
  new Promise((resolve, reject) => stream
    .pipe(fs.createWriteStream(path))
    .on('close', resolve)
    .on('error', reject)
  );

const readLines = stream =>
  reduceStream(stream.pipe(split(/\r?\n/)), [], (chunks, chunk) => chunks.push(chunk.trim()));

module.exports = {
  readLines,
  writeStream,
  unzip,
  unrar,
  delay
};
