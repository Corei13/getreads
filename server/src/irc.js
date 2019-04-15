const fs = require('fs');
const net = require('net');
const path = require('path');
const split = require('split');
const chalk = require('chalk');
const mime = require('mime-types');
const Moniker = require('moniker');
const { prompt } = require('enquirer');
const EventEmitter = require('events');
const { parse } = require('irc-message');

const { unzip, unrar, writeStream, delay } = require('./utils');


const log = ['green', 'yellow', 'blue', 'white', 'cyan', 'red', 'gray', 'dim']
  .reduce((a, c) => ({
    ...a,
    [c]: (...args) => console.log(chalk[c](args))
  }), {});

const emitter = new EventEmitter();
const events = {};
const client = net.connect({ host: 'irc.irchighway.net', port: '6667' });

const say = text => new Promise((resolve, reject) =>
  client.write(text + '\r\n', err => err ? reject(err) : resolve()));

// TODO: add timeout
const sayAndWait = async (messages, { command, params }, timeout) => {
  const hash = Math.random().toString(16).slice(2);
  events[hash] = p => (!command || command === p.command) && (!params || params(p.params));
  for (const message of messages) {
    await say(message);
  }
  const p = new Promise(resolve => emitter.once(hash, resolve));
  return !timeout
    ? p
    : Promise.race([p, delay(timeout).then(() => { throw new Error(`Timed out after ${timeout}s`); })]);
};

const connect = username => new Promise((resolve, reject) => {
  client.pipe(split()).on('data', line => {
    try {
      const { command, params } = parse(line);
      
      for (const [name, condition] of Object.entries(events)) {
        if (condition({ command, params })) {
          emitter.emit(name, { command, params });
        }
      }

      switch (command) {
        case '001':
        case '002':
        case '003':
        case '004':
        case '005':
        case '042':
        case '372':
        case '375':
        case '376':
        case '251':
        case '252':
        case '253':
        case '254':
        case '255':
        case '265':
        case '266':
        case '396':
        case '333':
        case '353':
        case '332':
        case '366':
        case 'JOIN':
        case 'QUIT':
        case 'PART':
          return log.dim(line);
          break;

        case 'NOTICE':
          return log.white(line);
          break;
        case 'PRIVMSG':
          if (params[0] === username) {
            return log.cyan(line);
          }
          return log.dim(line);
          break;
        default:
          return log.yellow(line);
          break;
      }
    } catch (err) {
      log.red(line);
    }
  });

  client
    .on('connect', resolve)
    .on('end', () => log.yellow('disconnected from server'))
    .on('error', reject);
});


const parseDCC = line => {
  const uint32ToIP = n => {
    const byte1 = n & 255,
      byte2 = ((n >> 8) & 255),
      byte3 = ((n >> 16) & 255),
      byte4 = ((n >> 24) & 255);
    return byte4 + "." + byte3 + "." + byte2 + "." + byte1;
  };

  const [, , file, ip, port, length] = line.match(/(?:[^\s"]+|"[^"]*")+/g);
  return {
    file,
    ip: uint32ToIP(parseInt(ip, 10)),
    port: parseInt(port, 10),
    length: parseInt(length, 10)
  };
};

const ping = server => sayAndWait([
  `PING ${server}`
], { command: 'PONG' });

const pingForever = async server => {
  while (true) {
    await Promise.all([ping(server), delay(15)]);
  }
};

const initialize = async () => {
  const username = Moniker.generator([Moniker.adjective, Moniker.noun], { glue: '_' }).choose();
  await connect(username);
  const { params: [, server] } = await sayAndWait([
    `NICK ${username}`,
    `USER ${username} 0 * :${username}`
  ], { command: '004' });

  pingForever(server);
  
  log.green('Joined server');
  await sayAndWait([
    'JOIN #ebooks'
  ], { command: '332' });
  log.blue('Waiting for 30s (mandatory wait time before any activity)');
  await delay(30);
  log.blue('Waited 30s. Ready to roll!');
  
  return { server };
};

const download = async path => {
  // TODO: make it a queue
  const res = await sayAndWait([
    `PRIVMSG #ebooks ${path}`
  ], { command: 'PRIVMSG', params: ([, text]) => text.includes('DCC SEND') }, 60);
  const { ip, port, length, file } = parseDCC(res.params[1]);
  return {
    stream: net.connect(port, ip, () => console.log(`Connected to ${ip}:${port}`)),
    filename: file,
    mime: mime.lookup(file),
    size: length
  };
};

const getFileList = async (user, trigger) => {
  const { stream, filename, mime } = await download(trigger);
  console.log({
    user, trigger, filename, mime
  });
  const writable = mime === 'text/plain'
    ? stream
    : mime === 'application/zip'
      ? unzip(stream)
      : mime === 'application/x-rar-compressed'
        ? (await unrar(stream)).content
        : log.yellow(`Unknown mimetype ${mime} for file ${filename} from @${user}`) || stream;

  await writeStream(writable, path.resolve(__dirname, `./data/${user}.list`));
};

module.exports = { say, initialize, download, getFileList };

// (async () => {
//   const res1 = await client.sayAndWait([
//     `PRIVMSG #ebooks @search :${query}`
//   ], { command: 'PRIVMSG', params: ([, text]) => text.includes('DCC SEND')});

//   const data = await readLines(unzip(fetch(parseDCC(res1.params[1]))));
//   const { choice } = await prompt({
//     name: 'choice',
//     message: 'Pick one',
//     type: 'select',
//     choices: data.filter(l => l.startsWith('!'))
//   });


//   const res2 = await 
//   log.green('Downloaded the book');

//   await write(fetch(parseDCC(res2.params[1])), './save.epub');
//   log.green('Saved the book as save.epub');

//   process.exit(0);
// })().catch(log.red);

// TODO: --lucky (--no-rar -f epub -p Horla,Oatmeal)
// TODO: -R --no-rar
// TODO: -f --format epub,mobi
// TODO: -t --target awz3
// TODO: -p --prefer Horla,Oatmeal
// TODO: -o --output ZimaBlue.epub
