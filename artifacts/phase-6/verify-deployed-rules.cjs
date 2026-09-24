const root='C:/Users/su_13/AppData/Roaming/npm/node_modules/firebase-tools/lib/';
const {getGlobalDefaultAccount}=require(root+'auth');
const {requireAuth}=require(root+'requireAuth');
const {Client}=require(root+'apiv2');
const fs=require('node:fs');
async function main(){
  await requireAuth({project:'autolog-13584',...getGlobalDefaultAccount()});
  const client=new Client({urlPrefix:'https://firebaserules.googleapis.com',apiVersion:'v1'});
  const release=(await client.get('/projects/autolog-13584/releases/cloud.firestore')).body;
  const rules=(await client.get('/'+release.rulesetName)).body;
  const expected=fs.readFileSync(__dirname+'/firestore.rules','utf8').replace(/\r\n/g,'\n').trim();
  const matches=rules.source.files.some(f=>f.content.replace(/\r\n/g,'\n').trim()===expected);
  const result={rulesetName:release.rulesetName,updateTime:release.updateTime,matches};
  fs.writeFileSync(__dirname+'/rules-deployed.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
  if(!matches) process.exitCode=1;
}
main().catch(e=>{console.error(e.code || e.status || 'verification-failed');process.exitCode=1;});
