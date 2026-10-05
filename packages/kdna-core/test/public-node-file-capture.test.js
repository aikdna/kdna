'use strict';
// Bounded subprocesses cover the public string file path and descriptor cleanup.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const {createRequire}=require('node:module'),crypto=require('node:crypto');
const packageFile=process.env.KDNA_PUBLIC_RUNTIME?path.join(process.env.KDNA_PUBLIC_RUNTIME,'package.json'):path.resolve(__dirname,'../package.json');
const req=createRequire(packageFile),coreDir=path.dirname(req.resolve('@aikdna/kdna-core/package.json'));

const childSource=String.raw`
  'use strict';
  const fsp=require('node:fs/promises'),fs=require('node:fs'),crypto=require('node:crypto');
  const {createRequire}=require('node:module');
  const req=createRequire(process.argv[1]),entry=req.resolve('@aikdna/kdna-core/node');
  const trace=[];let descriptor;
  const open=fsp.open;
  fsp.open=async function(...args){
    trace.push({event:'open',flags:args[1]});
    const fd=await Reflect.apply(open,this,args);descriptor=fd;
    const methods={stat:fd.stat,read:fd.read,close:fd.close};
    fd.stat=async function(...parts){const s=await Reflect.apply(methods.stat,this,parts);trace.push({event:'stat',isFile:s.isFile()});return s;};
    fd.read=async function(...parts){const r=await Reflect.apply(methods.read,this,parts);trace.push({event:'read',bytesRead:r.bytesRead});return r;};
    fd.close=async function(...parts){const v=await Reflect.apply(methods.close,this,parts);trace.push({event:'close',fd:fd.fd});return v;};
    return fd;
  };
  req('@aikdna/kdna-core/node').admitNode(process.argv[2]).then(result=>{
    const view=result.status==='accepted'?req('@aikdna/kdna-core/read-boundary').inspectSnapshot(result.snapshot):null;
    process.stdout.write(JSON.stringify({entry,result,view:view?{ir_sha256:crypto.createHash('sha256').update(JSON.stringify(view.ir)).digest('hex'),digests:view.digests}:null,trace,fd_after:descriptor?.fd,expected_flags:fs.constants.O_RDONLY|fs.constants.O_NONBLOCK})+'\n');
  },error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
`;

function runChild(packageFile,fifo){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['-e',childSource,packageFile,fifo],{detached:true,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='',timedOut=false,closed=false,drainTimer,outputExceeded=false;
    const killGroup=()=>{try{process.kill(-child.pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')throw e;}};
    const timer=setTimeout(()=>{
      timedOut=true;killGroup();
      drainTimer=setTimeout(()=>reject(new Error('Child process group did not drain after SIGKILL')),2000);
    },4000);
    for(const [stream,name] of [[child.stdout,'stdout'],[child.stderr,'stderr']])stream.on('data',data=>{
      if(name==='stdout')stdout+=data;else stderr+=data;
      if(stdout.length+stderr.length>65536){outputExceeded=true;killGroup();}
    });
    child.on('error',error=>{clearTimeout(timer);if(drainTimer)clearTimeout(drainTimer);reject(error);});
    child.on('close',(code,signal)=>{
      closed=true;clearTimeout(timer);if(drainTimer)clearTimeout(drainTimer);
      let groupAbsent=false;try{process.kill(-child.pid,0);}catch(e){if(e.code==='ESRCH')groupAbsent=true;else{reject(e);return;}}
      resolve({code,signal,stdout,stderr,timedOut,outputExceeded,groupAbsent,drained:closed});
    });
  });
}

test('public Node string input rejects a FIFO without a writer and closes its file handle', {skip:process.platform==='win32',timeout:10000}, async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kdna-node-capture-'));
  try{
    const fifo=path.join(dir,'no-writer.fifo');
    const created=spawnSync('mkfifo',[fifo],{encoding:'utf8',timeout:1000});
    if(created.error?.code==='ENOENT'){t.skip('POSIX mkfifo is unavailable');return;}
    assert.equal(created.error,undefined);assert.equal(created.status,0,created.stderr);assert.equal(fs.lstatSync(fifo).isFIFO(),true);
    const run=await runChild(packageFile,fifo);
    assert.equal(run.drained,true);assert.equal(run.groupAbsent,true);assert.equal(run.outputExceeded,false);assert.equal(run.timedOut,false,'Public file capture exceeded the bounded child deadline');
    assert.equal(run.code,0,run.stderr);assert.equal(run.signal,null);assert.equal(run.stderr,'');
    const row=JSON.parse(run.stdout);
    assert.equal(row.entry,path.join(coreDir,'src/public-contract/node.js'));
    assert.equal(row.result.status,'rejected');assert.equal(row.result.reason,'READ_CORE_INVALID');
    assert.deepEqual(row.trace,[{event:'open',flags:row.expected_flags},{event:'stat',isFile:false},{event:'close',fd:-1}]);
    assert.equal(row.fd_after,-1);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('public Node string capture preserves an existing native binding model through regular and symlink files', {skip:process.platform==='win32',timeout:10000}, async()=>{
  const N=require('./native-binding-test-model.js');
  const {versionTuple}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
  const bytes=N.F.encode(N.recursion(versionTuple),req);
  const accepted=await req('@aikdna/kdna-core/node').admitNode(bytes);
  assert.equal(accepted.status,'accepted');
  const expected=req('@aikdna/kdna-core/read-boundary').inspectSnapshot(accepted.snapshot);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kdna-node-regular-'));
  try{
    const file=path.join(dir,'native.kdna'),link=path.join(dir,'native-link.kdna');
    fs.writeFileSync(file,bytes);fs.symlinkSync(file,link);
    for(const input of [file,link]){
      const run=await runChild(packageFile,input);
      assert.equal(run.drained,true);assert.equal(run.groupAbsent,true);assert.equal(run.outputExceeded,false);assert.equal(run.timedOut,false);assert.equal(run.code,0,run.stderr);assert.equal(run.signal,null);assert.equal(run.stderr,'');
      const row=JSON.parse(run.stdout);
      assert.equal(row.entry,path.join(coreDir,'src/public-contract/node.js'));
      assert.equal(row.result.status,'accepted');assert.equal(row.view.ir_sha256,crypto.createHash('sha256').update(JSON.stringify(expected.ir)).digest('hex'));assert.deepEqual(row.view.digests,expected.digests);
      assert.deepEqual(row.trace[0],{event:'open',flags:row.expected_flags});
      assert.deepEqual(row.trace.filter(x=>x.event==='stat'),[{event:'stat',isFile:true}]);
      assert.equal(row.trace.filter(x=>x.event==='read').reduce((n,x)=>n+x.bytesRead,0),bytes.length);
      assert.deepEqual(row.trace.filter(x=>x.event==='close'),[{event:'close',fd:-1}]);assert.equal(row.fd_after,-1);
    }
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
