let progressExercise = '', progressMetric='kg', bodyMetric='weight';
function finiteValue(v){if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null}
function workoutHistory(name) {
 return db.logs.flatMap(log=>(log.items||[]).filter(item=>item.name===name&&Number(item.completed)>0).map(item=>({date:log.date,loggedAt:log.loggedAt,workout:log.workout,reps:item.reps,sets:Number(item.completed),kg:finiteValue(item.kg)})));
}
function showExerciseProgress(index){progressExercise=selectedExercise(index);tab='historico';render();document.getElementById('load-progress').scrollIntoView()}
function valueLabel(value,unit){return Number(value).toLocaleString('pt-BR',{maximumFractionDigits:2})+(unit?' '+unit:'')}
function evolutionChart(points,unit,title){
 if(!points.length)return '<p class="muted tiny">Ainda não há registros para este gráfico. Os valores aparecerão depois de você salvar seus dados.</p>';
 const width=320,height=170,left=43,right=17,top=22,bottom=35,values=points.map(p=>p.value);
 let min=Math.min(...values),max=Math.max(...values);const pad=Math.max(1,(max-min)*.15);min=Math.max(0,min-pad);max+=pad;
 const x=i=>left+(points.length===1?.5:i/(points.length-1))*(width-left-right),y=v=>top+(max-v)/(max-min)*(height-top-bottom);
 const path=points.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(p.value).toFixed(1)).join(' ');
 const delta=points.length>1?points.at(-1).value-points[0].value:null;
 return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}" style="width:100%;height:auto;margin-top:12px;background:#0a0d12;border-radius:12px">
 ${[0,.5,1].map(f=>{const v=min+(max-min)*f,cy=y(v);return `<line x1="${left}" x2="${width-right}" y1="${cy}" y2="${cy}" stroke="#29394b"/><text x="${left-5}" y="${cy+4}" text-anchor="end" fill="#a7b3c6" font-size="10">${Math.round(v*10)/10}</text>`}).join('')}
 <path d="${path}" fill="none" stroke="#c6ff3d" stroke-width="2.5"/>
 ${points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.value)}" r="4" fill="#2ee6a6"><title>${esc(p.date)}: ${valueLabel(p.value,unit)}</title></circle>`).join('')}
 <text x="${left}" y="${height-10}" fill="#a7b3c6" font-size="10">${esc(points[0].date.slice(0,10))}</text><text x="${width-right}" y="${height-10}" text-anchor="end" fill="#a7b3c6" font-size="10">${esc(points.at(-1).date.slice(0,10))}</text></svg>
 <p class="tiny"><b>Primeiro:</b> ${valueLabel(points[0].value,unit)} · <b>Último:</b> ${valueLabel(points.at(-1).value,unit)}${delta===null?'':` · <b>Variação:</b> ${delta>0?'+':''}${valueLabel(delta,unit)}`}</p>
 <details><summary class="tiny">Ver valores do gráfico</summary><ol class="tiny">${points.map(p=>`<li>${esc(p.date)}: ${valueLabel(p.value,unit)}</li>`).join('')}</ol></details>`;
}
function progressionHTML(){
 const allNames=[...new Set([...plans.flatMap(p=>p.items.filter(e=>e[1]!=='Condicionamento').map(e=>e[0])),...Object.keys(gymCatalog),...db.logs.flatMap(l=>(l.items||[]).map(i=>i.name))])].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 const exercise=allNames.includes(progressExercise)?progressExercise:allNames.find(n=>workoutHistory(n).length)||allNames[0],history=workoutHistory(exercise).slice(0,12).reverse();
 const unit=progressMetric==='kg'?'kg':'repetições';
 const points=history.flatMap(r=>{const value=progressMetric==='kg'?r.kg:(/^\d+(?:\.\d+)?$/.test(String(r.reps).trim())?finiteValue(r.reps):null);return value===null?[]:[{date:r.date,value}]});
 const savedSessions=db.logs.filter(l=>(l.items||[]).some(i=>Number(i.completed)>0)).length;
 const body=(db.measurements||[]).filter(r=>finiteValue(r[bodyMetric])!==null).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.at-b.at).slice(-12).map(r=>({date:r.date,value:Number(r[bodyMetric])}));
 return `<section class="card"><h2>Sua evolução</h2><p><b>${savedSessions}</b> treinos salvos com séries concluídas · <b>${db.cardio.length}</b> atividades de cardio.</p><p class="tiny muted">Os gráficos usam apenas registros salvos neste aparelho. Dados apagados por uma desinstalação não podem ser reconstruídos automaticamente.</p></section>
 <section class="card" id="load-progress"><h2>Gráfico por exercício</h2><label for="progress-exercise">Exercício</label><select id="progress-exercise" onchange="progressExercise=this.value;render()">${allNames.map(n=>`<option value="${esc(n)}" ${n===exercise?'selected':''}>${esc(n)}</option>`).join('')}</select>
 <label for="progress-metric">O que acompanhar</label><select id="progress-metric" onchange="progressMetric=this.value;render()"><option value="kg" ${progressMetric==='kg'?'selected':''}>Carga (kg)</option><option value="reps" ${progressMetric==='reps'?'selected':''}>Repetições realizadas</option></select>
 ${evolutionChart(points,unit,`Evolução de ${progressMetric==='kg'?'carga':'repetições'} em ${exercise}`)}
 ${!points.length?'<p class="tiny muted">No treino: informe carga e repetições realmente feitas, marque as séries e toque em “Concluir treino e salvar”. Intervalos sugeridos como 8–12 não são contados como repetições realizadas.</p>':''}</section>
 <section class="card"><h2>Peso e cintura</h2><p class="tiny muted">Registro opcional. Não há estimativa automática de gordura corporal.</p><label for="body-metric">Medida do gráfico</label><select id="body-metric" onchange="bodyMetric=this.value;render()"><option value="weight" ${bodyMetric==='weight'?'selected':''}>Peso (kg)</option><option value="waist" ${bodyMetric==='waist'?'selected':''}>Cintura (cm)</option></select>
 ${evolutionChart(body,bodyMetric==='weight'?'kg':'cm',bodyMetric==='weight'?'Evolução do peso':'Evolução da cintura')}
 <label for="measurement-date">Data</label><input id="measurement-date" type="date" value="${today()}"><div class="row"><label>Peso (kg)<input id="measurement-weight" type="number" min="1" step="0.1" placeholder="Seu peso medido"></label><label>Cintura (cm)<input id="measurement-waist" type="number" min="1" step="0.1" placeholder="Sua medida"></label></div><button class="primary" type="button" onclick="saveBodyMeasurement()">Salvar medida</button></section>`;
}
function saveBodyMeasurement(){
 const date=document.getElementById('measurement-date').value,w=document.getElementById('measurement-weight').value,c=document.getElementById('measurement-waist').value;
 const weight=w===''?null:finiteValue(w),waist=c===''?null:finiteValue(c);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||(!w&&!c)||(w&&(weight===null||weight<=0))||(c&&(waist===null||waist<=0))){alert('Informe uma data e pelo menos uma medida positiva.');return false}
 db.measurements??=[];db.measurements.push({date,weight,waist,at:Date.now()});save();render();return true;
}
