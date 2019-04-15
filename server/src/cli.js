(async () => {
  const query = process.argv.length > 2
    ? process.argv.slice(2).join(' ')
    : await prompt({ type: 'input', message: 'Which book are you looking for?', name: 'q' }).then(({ q }) => q);



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
  ], { command: 'PRIVMSG', params: ([, text]) => text.includes('DCC SEND') });

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
