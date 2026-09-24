const root = 'C:/Users/su_13/AppData/Roaming/npm/node_modules/firebase-tools/lib/';
const {getGlobalDefaultAccount} = require(root+'auth');
const {requireAuth} = require(root+'requireAuth');
const {Client} = require(root+'apiv2');
const fs = require('node:fs');
async function main() {
  await requireAuth({project:'autolog-13584',...getGlobalDefaultAccount()});
  const client = new Client({urlPrefix:'https://cloudfunctions.googleapis.com',apiVersion:'v2'});
  const functions = [];
  for (const name of ['registerAttendance','getMyAttendance','getMyAsistiaBootstrap','getAttendanceDashboard','listAttendanceRecords','acceptAsistiaPolicies','setMyAsistiaVerificationMode','linkMyAsistiaDevice','resetAsistiaDevice','getDistributorAsistiaStatus','beginMyFacePresenceChallenge','completeMyFacePresenceSetup','externalDeviceApi']) {
    let f;
    try { f = (await client.get('/projects/autolog-13584/locations/us-central1/functions/'+name)).body; }
    catch (error) { if (error.status === 404 || error.message?.includes('404')) { functions.push({name,state:'NOT_FOUND_IN_US_CENTRAL1'}); continue; } throw error; }
    functions.push({name,updateTime:f.updateTime,state:f.state,revision:f.serviceConfig?.revision,runtime:f.buildConfig?.runtime,uri:f.url});
  }
  const gaslink = (await client.get('/projects/autolog-13584/locations/us-east4/functions/syncGaslinkSales')).body;
  functions.push({name:'syncGaslinkSales',updateTime:gaslink.updateTime,state:gaslink.state,revision:gaslink.serviceConfig?.revision});
  const hosting = new Client({urlPrefix:'https://firebasehosting.googleapis.com',apiVersion:'v1beta1'});
  const {body} = await hosting.get('/sites/autolog-13584/releases?pageSize=1');
  const r=body.releases[0];
  const result={functions,hosting:{name:r.name,releaseTime:r.releaseTime,version:r.version?.name}};
  fs.writeFileSync(__dirname+'/deployment-'+(process.argv[2] || 'before')+'.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
