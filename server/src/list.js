const IRC = require('./irc');

(async () => {
  await IRC.initialize();
  const triggers = {
    Horla: '@Horla',
    Oatmeal: '@Oatmeal',
    LawdyServer: '@LawdyServer',
    Ook: '@Ook',
    ps2: '@phoomphy',
    DV8: '@DV8',
    Musicwench: '@Musicwench',
    dny238: '@dny238',
    Trainpacks: '!trainpacks',
    Pondering42: '@Pondering42',
  };
  for (const [user, trigger] of Object.entries(triggers)) {
    console.log(`Save file list of ${user} (${trigger})`);
    try {
      await IRC.getFileList(user, trigger);
      console.log(`Saved file list from ${user}`);
    } catch (err) {
      console.warn(err);
    }
  }
})().catch(console.error);
