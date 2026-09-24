// Read-only production evidence. Credentials stay inside the Firebase CLI client.
const root = 'C:/Users/su_13/AppData/Roaming/npm/node_modules/firebase-tools/lib/';
const {getGlobalDefaultAccount} = require(root + 'auth');
const {requireAuth} = require(root + 'requireAuth');
const {Client} = require(root + 'apiv2');
const {listEntries} = require(root + 'gcp/cloudlogging');
const fs = require('node:fs');
async function main() {
  await requireAuth({project:'autolog-13584', ...getGlobalDefaultAccount()});
  const logs = await listEntries('autolog-13584', 'resource.type="cloud_run_revision" AND resource.labels.service_name="registerattendance" AND timestamp>="2026-09-08T20:42:00Z" AND timestamp<="2026-09-08T20:46:00Z"', 200, 'asc');
  const safeLogs = logs.entries.map(e => ({timestamp:e.timestamp, severity:e.severity, trace:e.trace, http:e.httpRequest && {method:e.httpRequest.requestMethod,status:e.httpRequest.status,latency:e.httpRequest.latency}, details:e.jsonPayload, text:e.textPayload}));
  const hosting = new Client({urlPrefix:'https://firebasehosting.googleapis.com',apiVersion:'v1beta1'});
  const releases = (await hosting.get('/sites/autolog-13584/releases?pageSize=3')).body;
  const db = new Client({urlPrefix:'https://firestore.googleapis.com',apiVersion:'v1'});
  const base = '/projects/autolog-13584/databases/(default)/documents';
  const query = async (collection,field,value) => (await db.post(base+':runQuery',{structuredQuery:{from:[{collectionId:collection}],where:{fieldFilter:{field:{fieldPath:field},op:'EQUAL',value:{stringValue:value}}}}})).body;
  const evidence = {logs:safeLogs,releases,
    events:await query('asistencias','uid','sIOMdDcVixTzFvM8Fb7D9uZ1NFF2'),
    states:await query('attendanceState','uid','sIOMdDcVixTzFvM8Fb7D9uZ1NFF2'),
    idempotency:await query('attendanceIdempotency','uid','sIOMdDcVixTzFvM8Fb7D9uZ1NFF2')};
  fs.writeFileSync(__dirname+'/production-evidence.json',JSON.stringify(evidence,null,2));
  const html = await (await fetch('https://autolog-13584.web.app/')).text();
  fs.writeFileSync(__dirname+'/hosting-before.html',html);
  const files = (await hosting.get('/'+releases.releases[0].version.name+'/files?pageSize=1000')).body;
  fs.writeFileSync(__dirname+'/hosting-files-before.json',JSON.stringify(files,null,2));
  const jsFiles = files.files.filter(f=>f.path.endsWith('.js'));
  const matches = [];
  for (const file of jsFiles) {
    const body = await (await fetch('https://autolog-13584.web.app'+file.path)).text();
    if (/No hay registros de asistencia disponibles|getAttendanceDashboard|listAttendanceRecords/.test(body)) {
      fs.writeFileSync(__dirname+'/hosting-before-'+file.path.split('/').pop(),body);
      matches.push({path:file.path,dashboard:body.includes('getAttendanceDashboard'),records:body.includes('listAttendanceRecords'),pending:body.includes('Pendientes')});
    }
  }
  console.log(JSON.stringify({hostingMatches:matches,events:evidence.events.map(e=>({name:e.document?.name,fields:e.document && Object.fromEntries(Object.entries(e.document.fields).filter(([k])=>['tipo','fechaHoraServidor','fechaLocal','distribuidorId','nombreSnapshot','identificadorSnapshot'].includes(k)))}))},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
