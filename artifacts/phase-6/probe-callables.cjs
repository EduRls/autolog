const fs = require('node:fs');
const payloads = {
  acceptAsistiaPolicies:{version:'2026-09',termsVersion:'2026-09'},
  setMyAsistiaVerificationMode:{mode:'PRESENCE_ONLY',decisionVersion:'2026-09'},
  linkMyAsistiaDevice:{installationId:'550e8400-e29b-41d4-a716-446655440000',platform:'android'},
  resetAsistiaDevice:{}, getDistributorAsistiaStatus:{},
  beginMyFacePresenceChallenge:{}, completeMyFacePresenceSetup:{},
  getMyAsistiaBootstrap:{}, registerAttendance:{}, getMyAttendance:{}, listAttendanceRecords:{},
};
async function main() {
  const results = await Promise.all(Object.entries(payloads).map(async ([name,data])=> {
    const response = await fetch(`https://us-central1-autolog-13584.cloudfunctions.net/${name}`, {
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({data}),
    });
    const body=await response.json();
    return {name,httpStatus:response.status,error:body.error?.status};
  }));
  fs.writeFileSync(__dirname+'/callables-production.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
  if (results.some(r=>r.httpStatus!==401 || r.error!=='UNAUTHENTICATED')) process.exitCode=1;
}
main().catch(e=>{console.error(e.code || 'probe-failed');process.exitCode=1;});
