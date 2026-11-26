const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/exercise-images.json')));
function app(old={}){const storage=new Map([['meutreinofullbody2_v1',JSON.stringify(old)]]),elements=new Map();const ctx=vm.createContext({console,Date,Set,Map,JSON,Math,Number,String,Object,Array,encodeURIComponent,parseInt,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{getElementById:k=>{if(!elements.has(k))elements.set(k,{innerHTML:'',scrollIntoView(){}});return elements.get(k)}},exerciseImages:manifest.exercises,exerciseClocks:new Map(),exerciseClockHTML:()=>'',executionDuration:t=>/^\d+.* s$/.test(t)?parseInt(t):30,alert:()=>{},confirm:()=>true,setInterval(){},clearInterval(){}});vm.runInContext(fs.readFileSync(path.join(root,'app/src/main/assets/progression.js'),'utf8'),ctx);vm.runInContext(code,ctx);return{run:s=>vm.runInContext(s,ctx),storage,ctx}}

let a=app();const plans=JSON.parse(a.run('JSON.stringify(plans)')),catalog=JSON.parse(a.run('JSON.stringify(gymCatalog)'));
assert.equal(plans.length,5);
for(const e of Object.values(catalog)){assert.equal(e.bilateral,true);assert.ok(['machine','cable'].includes(e.equipmentKind));assert.ok(e.muscles.length);assert.ok(e.movementFamily)}
assert.ok(!Object.keys(catalog).some(n=>/halter|unilateral|alternada|martelo|pélvica|ponte|degrau/i.test(n)));
assert.ok(!Object.keys(catalog).includes('Cadeira abdutora'));
assert.deepEqual(plans[3].items.slice(0,2).map(e=>e[0]),['Cadeira extensora','Mesa flexora deitada']);
assert.equal(catalog['Cadeira extensora'].primaryMuscle,'quadríceps');assert.equal(catalog['Mesa flexora deitada'].primaryMuscle,'posterior da coxa');
assert.equal(plans.flatMap(p=>p.items).filter(e=>e[0].startsWith('Stiff')).length,1);
for(let d=0;d<5;d++){
 a.run('day='+d);const items=plans[d].items,groups=items.map(e=>e[1]);for(const g of ['Pernas','Peito','Costas','Condicionamento'])assert.ok(groups.includes(g));
 const families=items.filter(e=>e[1]!=='Condicionamento').map(e=>catalog[e[0]].movementFamily);assert.equal(new Set(families).size,families.length,'Same movement twice within session');
 for(const g of new Set(groups)){const indices=groups.flatMap((v,i)=>v===g?[i]:[]);assert.equal(indices.at(-1)-indices[0]+1,indices.length)}
 for(let i=0;i<items.length;i++){const item=items[i];if(item[1]==='Condicionamento')continue;assert.equal(item[2],3);const html=a.run('exercise(plans[day].items['+i+'],'+i+')');assert.ok(html.includes('Trocar exercício:'));assert.ok(html.includes('Principais:'));const options=JSON.parse(a.run('JSON.stringify(availableReplacements('+i+'))'));for(const n of options){assert.equal(catalog[n].primaryMuscle,catalog[item[0]].primaryMuscle);assert.ok(!plans.flatMap(p=>p.items).some(e=>catalog[e[0]]?.movementFamily===catalog[n].movementFamily))}}
}
a.run('day=0');assert.ok(a.run("repetitionHTML('Supino reto na máquina')").includes('Seg, Qua, Sex'));assert.equal(a.run("repetitionHTML('Stiff na V-Squat')"),'');
assert.equal(a.run("swapExercise(slotKey(4),'Tríceps acima da cabeça com corda')"),true);assert.equal(a.run('selectedExercise(4)'),'Tríceps acima da cabeça com corda');a.run('day=2');assert.equal(a.run("swapExercise(slotKey(4),'Tríceps acima da cabeça com corda')"),false);
a.run('day=0');assert.equal(a.run("swapExercise(slotKey(4),'Tríceps unilateral na polia')"),false);assert.equal(a.run("swapExercise(slotKey(4),'')"),true);
const legacy=app({logs:[{date:'antigo',items:[{name:'Rosca alternada',kg:10,completed:3}]}],entries:{legacy:{kg:20}},completed:{legacy:[true]},swaps:{'academia-20261124-2-supino-com-halteres':'Supino no chão com halteres'}});assert.equal(legacy.run('db.logs.length'),1);assert.equal(legacy.run('db.entries.legacy.kg'),20);
// Graphs start empty and never seed measurements or numeric repetitions from a suggested range.
let empty=a.run('progressionHTML()');assert.ok(empty.includes('Ainda não há registros'));assert.ok(empty.includes('Peso e cintura'));assert.equal(a.run('(db.measurements||[]).length'),0);
a.run("db.logs=[{date:'01/11/2026',workout:'A',items:[{name:'Supino reto na máquina',kg:20,reps:10,completed:3}]},{date:'02/11/2026',workout:'C',items:[{name:'Supino reto na máquina',kg:25,reps:'8–12',completed:3}]}]; progressExercise='Supino reto na máquina';progressMetric='kg'");
let chart=a.run('progressionHTML()');assert.ok(chart.includes('<svg'));assert.ok(chart.includes('20 kg'));assert.ok(chart.includes('25 kg'));a.run("progressMetric='reps'");chart=a.run('progressionHTML()');assert.ok(chart.includes('10 repetições'));assert.ok(!chart.includes('8 repetições'));
a.run("document.getElementById('measurement-date').value='2026-11-26';document.getElementById('measurement-weight').value='72';document.getElementById('measurement-waist').value=''");assert.equal(a.run('saveBodyMeasurement()'),true);assert.equal(a.run('db.measurements[0].waist'),null);assert.equal(a.run('db.measurements[0].weight'),72);
a.run("document.getElementById('measurement-weight').value='71';document.getElementById('measurement-waist').value='90'");assert.equal(a.run('saveBodyMeasurement()'),true);chart=a.run("bodyMetric='weight';progressionHTML()");assert.ok(chart.includes('72 kg'));assert.ok(chart.includes('71 kg'));a.run("document.getElementById('measurement-weight').value='-1'");assert.equal(a.run('saveBodyMeasurement()'),false);
const again=app(JSON.parse(a.storage.get('meutreinofullbody2_v1')));assert.equal(again.run('db.measurements.length'),2);assert.ok(again.run("document.getElementById('tabs').innerHTML").includes('Evolução'));
const files=new Set(manifest.files.map(e=>e[1]));for(const list of Object.values(manifest.exercises))for(const img of list)assert.ok(files.has(img));
console.log('PASS: bilateral machine catalog, confirmed Thursday legs, muscles and movement families, disclosed repetitions, grouped days, safe old data, truthful empty charts, real load/reps series and persistent body measurements.');
