const root = 'C:/Users/su_13/AppData/Roaming/npm/node_modules/firebase-tools/lib/';
const {getGlobalDefaultAccount} = require(root+'auth');
const {requireAuth} = require(root+'requireAuth');
const {Client} = require(root+'apiv2');
const fs = require('node:fs');
async function main() {
  await requireAuth({project:'autolog-13584',...getGlobalDefaultAccount()});
  const client = new Client({urlPrefix:'https://firebaserules.googleapis.com',apiVersion:'v1'});
  const release = (await client.get('/projects/autolog-13584/releases/cloud.firestore')).body;
  const rules = (await client.get('/'+release.rulesetName)).body;
  for (const file of rules.source.files) {
    if (fs.existsSync(__dirname+'/active-firestore.rules') &&
        fs.readFileSync(__dirname+'/active-firestore.rules','utf8') !== file.content) {
      throw new Error('Active rules changed since audit; deployment must stop.');
    }
    fs.writeFileSync(__dirname+'/active-firestore.rules',file.content);
  }
  fs.writeFileSync(__dirname+'/rules-version.json',JSON.stringify({rulesetName:release.rulesetName,updateTime:release.updateTime},null,2));
  console.log(JSON.stringify({rulesetName:release.rulesetName,updateTime:release.updateTime}));
}
main().catch(e=>{console.error(e.status || e.code || 'rules-read-failed');process.exitCode=1;});
