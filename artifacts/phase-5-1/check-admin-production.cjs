// Executes unchanged administrative handlers locally against production reads.
// This is not a browser sign-in or an HTTP callable authentication test.
const root = 'C:/Users/su_13/AppData/Roaming/npm/node_modules/firebase-tools/lib/';
const canonical = 'D:/Proyectos/Subida_fire_hosting/autolog/functions/';
const {getGlobalDefaultAccount,getAccessToken} = require(root+'auth');
const {requireAuth} = require(root+'requireAuth');
const canonicalRequire = require('node:module').createRequire(canonical+'package.json');
const {initializeApp,deleteApp} = canonicalRequire('firebase-admin/app');
const {getFirestore} = canonicalRequire('firebase-admin/firestore');
const fs = require('node:fs');
async function main() {
  const account = getGlobalDefaultAccount();
  await requireAuth({project:'autolog-13584', ...account});
  const {OAuth2Client} = require(root+'../node_modules/google-auth-library');
  const token = await getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
  const authClient = new OAuth2Client();
  authClient.setCredentials({access_token:token.access_token});
  const app = initializeApp({projectId:'autolog-13584'});
  const db = getFirestore(app);
  db.settings({authClient});
  try {
    const profiles = await db.collection('usuarios').where('rol','==','admin').limit(10).get();
    const profile = profiles.docs.find(p=>p.get('activo') !== false && p.get('accesoAutolog') !== false && p.get('tipoPersonal') !== 'DISTRIBUIDOR');
    if (!profile) throw new Error('No active administrative profile found');
    const {Client} = require(root+'apiv2');
    const identityClient = new Client({urlPrefix:'https://identitytoolkit.googleapis.com',apiVersion:'v1'});
    const authRecord = (await identityClient.post('/projects/autolog-13584/accounts:lookup',{localId:[profile.id]})).body.users?.[0];
    const {getAttendanceDashboard,listAttendanceRecords} = require(canonical+'lib/attendance/attendance-admin.callables');
    const auth = {uid:profile.id,token:{}};
    const result = {
      verification:'Local handlers with production Firestore; browser identity not asserted',
      authRecord:authRecord ? {uid:authRecord.localId,disabled:authRecord.disabled === true} : null,
      profile:{uid:profile.id,rol:profile.get('rol'),activo:profile.get('activo') ?? 'legacy-default-true',accesoAutolog:profile.get('accesoAutolog') ?? 'legacy-default-true',tipoPersonal:profile.get('tipoPersonal') ?? 'legacy-SISTEMA'},
      dashboard:await getAttendanceDashboard.run({auth,data:{}}),
      records:await listAttendanceRecords.run({auth,data:{}}),
      dated:await listAttendanceRecords.run({auth,data:{dateFrom:'2026-09-08',dateTo:'2026-09-08',search:'VGBZ-0192'}}),
    };
    fs.writeFileSync(__dirname+'/admin-production.json',JSON.stringify(result,null,2));
    console.log(JSON.stringify(result,null,2));
  } finally { await deleteApp(app); }
}
main().catch(e=>{console.error({code:e.code,message:e.message});process.exitCode=1;});
