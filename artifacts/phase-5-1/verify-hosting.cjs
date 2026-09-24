const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const hash = value => createHash('sha256').update(value).digest('hex');
async function main() {
  const www = path.resolve(__dirname,'../../www');
  const selected = ['index.html',...fs.readdirSync(www).filter(name=>name.endsWith('.js') && /getAttendanceDashboard|listAttendanceRecords/.test(fs.readFileSync(path.join(www,name),'utf8')))];
  const result = [];
  for (const name of selected) {
    const local = fs.readFileSync(path.join(www,name));
    const response = await fetch('https://autolog-13584.web.app/'+name,{headers:{'Cache-Control':'no-cache'}});
    const remote = Buffer.from(await response.arrayBuffer());
    result.push({name,status:response.status,localSha256:hash(local),remoteSha256:hash(remote),matches:local.equals(remote)});
  }
  fs.writeFileSync(__dirname+'/hosting-verification.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
  if (result.some(r=>!r.matches)) process.exitCode=1;
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
