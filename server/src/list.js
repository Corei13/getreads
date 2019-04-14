const IRC = require('./irc');

(async () => {
  await IRC.initialize();
  const triggers = {
    // Horla: '@Horla',
    // Oatmeal: '@Oatmeal',
    // LawdyServer: '@LawdyServer',
    // Ook: '@Ook',
    // ps2: '@phoomphy',
    // DV8: '@DV8',
    Musicwench: '@Musicwench',
    Pondering42: '@Pondering42',
    Trainpacks: '!trainpacks',
    dny238: '@dny238',
  };
  for (const [user, trigger] of Object.entries(triggers)) {
    console.log(`Save file list of ${user} (${trigger})`);
    await IRC.getFileList(user, trigger);
    console.log(`Saved file list from ${user}`);
  }
})().catch(console.error);
