let progressExercise = '';

function workoutHistory(name) {
    return db.logs.flatMap(log => log.items.filter(item=>item.name===name && item.completed>0)
        .map(item=>({date:log.date, workout:log.workout, reps:item.reps, sets:item.completed, kg:Number(item.kg)||0})));
}

function showExerciseProgress(index) {
    progressExercise = selectedExercise(index);
    tab = 'historico';
    render();
    document.getElementById('load-progress').scrollIntoView();
}

function progressionHTML() {
    const names = [...new Set([
        ...plans.flatMap(plan=>plan.items.flatMap(([name])=>[name,...(alternatives[name]||[])])),
        ...db.logs.flatMap(log=>log.items.map(item=>item.name))
    ])].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const exercise = progressExercise || names.find(name=>workoutHistory(name).length) || names[0];
    const history = workoutHistory(exercise);
    const recent = history.slice(0,8).reverse();
    const peak = Math.max(1,...recent.map(record=>record.kg));
    const kg = number=>number.toLocaleString('pt-BR');
    return `<section class="card" id="load-progress"><h2>Evolução por exercício</h2>
        <label for="progress-exercise">Exercício</label>
        <select id="progress-exercise" onchange="progressExercise=this.value;render()">${names.map(name=>`<option ${name===exercise?'selected':''}>${esc(name)}</option>`).join('')}</select>
        ${recent.length ? `<h3>Carga registrada nas últimas sessões</h3><ol class="load-chart">
          ${recent.map(r=>`<li><small>${esc(r.date)} · Treino ${esc(r.workout)}</small><div class="load-meter"><span class="load-bar" aria-hidden="true" style="width:${Math.max(0,100*r.kg/peak)}%"></span><strong>${kg(r.kg)} kg</strong></div><small>${r.sets} séries concluídas · ${esc(r.reps)} de referência</small></li>`).join('')}
          </ol>` : '<p class="muted tiny">Marque uma série e salve o treino para começar a acompanhar.</p>'}</section>`;
}
