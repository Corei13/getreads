const fs = require('fs');
const net = require('net');
const chalk = require('chalk');
const split = require('split');
const Moniker = require('moniker');
const unzipper = require('unzipper');
const { prompt } = require('enquirer');
const EventEmitter = require('events');
const { parse } = require('irc-message');


const log = ['green', 'yellow', 'blue', 'white', 'cyan', 'red', 'gray']
  .reduce((a, c) => ({
    ...a,
    [c]: (...args) => console.log(chalk[c](args))
  }), {});

const delay = sec => new Promise(resolve => setTimeout(resolve, sec * 1000));

const connect = username => new Promise((resolve, reject) => {
  const emitter = new EventEmitter();
  const events = {};
  const client = net.connect({ host: 'irc.irchighway.net', port: '6667' });

  const send = text => new Promise((resolve, reject) =>
    client.write(text + '\r\n', err => err ? reject(err) : resolve()));
  
  const sayAndWait = async (messages, { command, params }) => {
    const hash = Math.random().toString(16).slice(2);
    events[hash] = p => (!command || command === p.command) && (!params || params(p.params));
    for (const message of messages) {
      await send(message);
    }
    return new Promise(resolve => emitter.once(hash, resolve));
  };

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
          break;

        case 'NOTICE':
          return log.white(line);
          break;
        case 'PRIVMSG':
          if (params[0] === username) {
            return log.cyan(line);
          }
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
    .on('connect', () => resolve({ sayAndWait }))
    .on('end', () => log.yellow('disconnected from server'))
    .on('error', reject);
});

const readLines = stream => new Promise((resolve, reject) => (
  chunks => stream
    .pipe(split(/[\r\n]/))
    .on('data', chunk => chunks.push(chunk.trim()))
    .on('end', () => resolve(chunks))
    .on('error', reject)
)([]));

const write = (stream, path) => new Promise((resolve, reject) =>
  stream
    .pipe(fs.createWriteStream(path))
    .on('end', resolve)
    .on('error', reject)
);

const fetch = ({ ip, port }) => net
  .connect(port, ip, () => log.blue(`Connected to ${ip}:${port}`));

const unzip = stream => stream.pipe(unzipper.ParseOne());

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

(async () => {
  const query = process.argv.length > 2
    ? process.argv.slice(2).join(' ')
    : await prompt({ type: 'input', message: 'Which book are you looking for?', name: 'q' }).then(({ q }) => q);
  const username = Moniker.generator([Moniker.adjective, Moniker.noun], { glue: '_' }).choose();
  const client = await connect(username);

  await client.sayAndWait([
    `NICK ${username}`,
    `USER ${username} 0 * :${username}`
  ], { command: '001' });
  log.green('Joined server');

  await client.sayAndWait([
    'JOIN #ebooks'
  ], { command: '332' });
  log.blue('Waiting for 30s (mandatory wait time before any activity)');
  await delay(30);
  log.blue('Waited 30s');

  const res1 = await client.sayAndWait([
    `PRIVMSG #ebooks @search :${query}`
  ], { command: 'PRIVMSG', params: ([, text]) => text.includes('DCC SEND')});

  const data = await readLines(unzip(fetch(parseDCC(res1.params[1]))));
  const { choice } = await prompt({
    name: 'choice',
    message: 'Pick one',
    type: 'select',
    choices: data.filter(l => l.startsWith('!'))
  });


  const res2 = await client.sayAndWait([
    `PRIVMSG #ebooks ${choice}`
  ], { command: 'PRIVMSG', params: ([, text]) => text.includes('DCC SEND') });
  log.green('Downloaded the book');

  await write(fetch(parseDCC(res2.params[1])), './save.epub');
  log.green('Saved the book as save.epub');

  process.exit(0);
})().catch(log.red);

// TODO: --lucky (--no-rar -f epub -p Horla,Oatmeal)
// TODO: -R --no-rar
// TODO: -f --format epub,mobi
// TODO: -t --target awz3
// TODO: -p --prefer Horla,Oatmeal
// TODO: -o --output ZimaBlue.epub
