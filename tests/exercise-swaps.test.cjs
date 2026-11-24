const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/exercise-images.json')));
function app(old={}){const storage=new Map([['meutreinofullbody2_v1',JSON.stringify(old)]]),elements=new Map();const ctx=vm.createContext({console,Date,Set,Map,JSON,Math,Number,String,Object,Array,encodeURIComponent,parseInt,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{getElementById:k=>{if(!elements.has(k))elements.set(k,{innerHTML:'',scrollIntoView(){}});return elements.get(k)}},exerciseImages:manifest.exercises,exerciseClocks:new Map(),exerciseClockHTML:()=>'',executionDuration:t=>/^\d+.* s$/.test(t)?parseInt(t):30,progressionHTML:()=>'',alert:()=>{},confirm:()=>true,setInterval(){},clearInterval(){}});vm.runInContext(code,ctx);return{run:s=>vm.runInContext(s,ctx),storage,ctx}}
let a=app();
assert.equal(a.run('plans.length'),5);
const plans=JSON.parse(a.run('JSON.stringify(plans)'));
const names=plans.flatMap(p=>p.items.filter(e=>e[1]!=='Condicionamento').map(e=>e[0]));
assert.equal(names.length,44);assert.equal(new Set(names).size,44);
const prohibited=['Subida no degrau','Flexão inclinada no banco','Mesa flexora','Flexora sentada','Flexora em pé','Crucifixo na máquina','Agachamento no Smith','Desenvolvimento na máquina','Panturrilha sentado','Panturrilha em pé'];
for(const name of prohibited)assert.ok(!a.run('Object.hasOwn(gymCatalog,'+JSON.stringify(name)+')'),name);
const equipment=JSON.parse(a.run('JSON.stringify(Object.values(gymCatalog).map(e=>e.equipment))'));
assert.ok(!equipment.some(e=>/Smith|Peck|flexora|elástico|tornozeleira/i.test(e)));
for(let d=0;d<5;d++){
 a.run('day='+d);const plan=plans[d];const groups=plan.items.map(e=>e[1]);
 for(const g of ['Pernas','Peito','Costas','Ombros','Bíceps','Tríceps','Abdômen','Condicionamento'])assert.ok(groups.includes(g),'Missing full body '+d+' '+g);
 for(const group of new Set(groups)){const indices=groups.flatMap((g,i)=>g===group?[i]:[]);assert.equal(indices.at(-1)-indices[0]+1,indices.length,'Split block '+group)}
 assert.equal(groups.at(-1),'Condicionamento');assert.equal(plan.items.filter(e=>e[1]==='Condicionamento').length,1);
 for(let i=0;i<plan.items.length;i++){
  const item=plan.items[i];if(item[1]==='Condicionamento'){assert.equal(item[2],1);continue}assert.equal(item[2],3);
  const options=JSON.parse(a.run('JSON.stringify(availableReplacements('+i+'))'));
  assert.ok(options.length>0,item[0]+' has no unused choice');for(const n of options)assert.ok(!names.includes(n),'Repeating '+n);
  const output=a.run('exercise(plans[day].items['+i+'],'+i+')');assert.ok(output.includes('aria-haspopup="dialog"'));assert.ok(!output.includes('swap-picker'));assert.ok(!output.includes('<select id="swap-'));
 }
}
// Restore original entries after a swap, pause its clock, persist and exclude it elsewhere.
a.run('day=0');const originalKey=a.run('entryKey(2)');a.run('db.entries['+JSON.stringify(originalKey)+']={kg:17};db.completed['+JSON.stringify(originalKey)+']=[true]');
assert.equal(a.run("swapExercise(slotKey(2),'Supino no chão com halteres')"),true);assert.equal(a.run('selectedExercise(2)'),'Supino no chão com halteres');assert.equal(a.run('completedSetCount(2)'),0);
const newKey=a.run('entryKey(2)');a.run('exerciseClocks.set('+JSON.stringify(newKey.replaceAll(':','-')+'-rest')+',{until:Date.now()+30000,remaining:30000})');
assert.equal(a.run("swapExercise(slotKey(2),'')"),true);assert.equal(a.run('db.entries[entryKey(2)].kg'),17);assert.equal(a.run('completedSetCount(2)'),1);assert.equal(a.run('exerciseClocks.get('+JSON.stringify(newKey.replaceAll(':','-')+'-rest')+').until'),null);
assert.equal(a.run("swapExercise(slotKey(2),'Supino no chão com halteres')"),true);
a.run('day=1');assert.ok(!JSON.parse(a.run('JSON.stringify(availableReplacements(2))')).includes('Supino no chão com halteres'));assert.equal(a.run("swapExercise(slotKey(2),'Supino no chão com halteres')"),false);assert.equal(a.run("swapExercise(slotKey(2),'Mesa flexora')"),false);
const reload=app(JSON.parse(a.storage.get('meutreinofullbody2_v1')));reload.run('day=0');assert.equal(reload.run('selectedExercise(2)'),'Supino no chão com halteres');
// Moving a card must not attach the old occupant's loads or completed series.
const legacy=app({cycle:1,start:'2026-11-24',entries:{'1:1:0:4':{kg:11},'1:1:0:0:supino-reto-maquina':{kg:77}},completed:{'1:1:0:4':[true,false,true],'1:1:0:0:supino-reto-maquina':[true,true,true]},logs:[{date:'antes',items:[{name:'Supino reto na máquina',kg:77}]}],swaps:{}});
legacy.run('day=0');assert.equal(legacy.run("db.logs[0].items[0].kg"),77);assert.equal(legacy.run("db.entries['1:1:0:4'].kg"),11);assert.equal(legacy.run("db.entries['1:1:academia20261124:0:rosca-alternada:Rosca%20alternada'].kg"),11);assert.equal(legacy.run("db.completed['1:1:academia20261124:0:rosca-alternada:Rosca%20alternada'].filter(Boolean).length"),2);assert.equal(legacy.run("db.entries['1:1:academia20261124:0:supino-reto-com-barra:Supino%20reto%20com%20barra']"),undefined);
const entriesBefore=legacy.run('JSON.stringify(db.entries)');legacy.run('migrateGymRecords()');assert.equal(legacy.run('JSON.stringify(db.entries)'),entriesBefore);
// Time units and images follow the chosen movement.
a.run('day=0');assert.equal(a.run("exerciseTarget(plans[0].items[8],'Prancha lateral')"),'20–30 s');assert.equal(a.run("swapExercise(slotKey(8),'Prancha lateral')"),true);assert.ok(a.run('exercise(plans[0].items[8],8)').includes('Side_Bridge/0.jpg'));
const files=new Set(manifest.files.map(f=>f[1]));for(const photos of Object.values(manifest.exercises))for(const photo of photos)assert.ok(files.has(photo));
assert.ok(a.run("tab='cardio';render();document.getElementById('app').innerHTML").includes('<option>Bicicleta</option>'));
console.log('PASS: photographed equipment whitelist, five grouped full-body days, 44 unique strength slots, three sets, daily cardio, inline name picker, no duplicates, clocks, persistence and safe legacy migration.');
