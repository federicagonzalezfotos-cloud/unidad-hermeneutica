<script>
    const STORAGE_KEY = 'uh_uber_mendoza_citas';
    const STORAGE_KEY_FIELD_NOTES = 'uh_uber_mendoza_field_notes';
    const STORAGE_KEY_PARTICIPANTS = 'uh_uber_mendoza_participants';
    const FAMILIES = {'ALG:': {name: 'Algoritmo', color: '#2196F3' }, 'SUB:': {name: 'Subjetividad', color: '#4CAF50' }, 'COL:': {name: 'Colectivo', color: '#FF9800' } };
    const DEFAULT_FAMILY = {name: 'General', color: '#9E9E9E' };
    let citations = [];
    let currentFilter = null;
    let currentTurns = [];
    let currentMedia = [];
    let chartInstances = { };
    let categoriesCache = null;
    let categoriesCountCache = { };
    let fieldNotes = [];
    let currentFieldNoteEditId = null;
    let participants = [];
    let currentReactions = [];
    let currentLink = '';

    // Debounce function para optimizar rendimiento
    function debounce(fn, delay) {
        let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function invalidateCaches() {
        categoriesCache = null;
    categoriesCountCache = { };
        }

    function init() {
        loadCitations();
    loadFieldNotes();
    loadParticipants();
    updateDate();
    renderCitationsList();
    renderCodeTree();
    renderDashboard();
    renderMemos();
    addTurn();
    initCharts();
    setupReactions();
    // Usar debouncing para evitar re-renders excesivos
    const debouncedCategorySuggestions = debounce(showCategorySuggestions, 100);
    const debouncedParticipantSuggestions = debounce(showParticipantSuggestions, 100);
    document.getElementById('category').addEventListener('input', debouncedCategorySuggestions);
    document.getElementById('citationLink').addEventListener('input', handleLinkInput);
    document.getElementById('citationDate').value = new Date().toISOString().split('T')[0];
    // Inicializar tab de panel-center
    switchPanelCenterTab('citations');
    setupParticipantAutocomplete();
        }

    function loadCitations() {
            const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
                try {citations = JSON.parse(stored); }
    catch (e) {citations = []; }
            }
        }

    function saveCitations() {
        invalidateCaches();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(citations));
    updateAll();
        }

    function getNextPid() {
            const ids = citations.map(c => c.participante).filter(p => p && p.match(/^P\d+$/));
    if (ids.length === 0) return 'P01';
            const nums = ids.map(id => parseInt(id.replace('P', '')));
    return 'P' + String(Math.max(...nums) + 1).padStart(2, '0');
        }

    function getFamily(code) {
            for (const [prefix, family] of Object.entries(FAMILIES)) { if (code.startsWith(prefix)) return family; }
    return DEFAULT_FAMILY;
        }

    function getCategories() {
            if (categoriesCache !== null) return categoriesCache;
    const cats = new Set();
            citations.forEach(c => { if (c.categoria) cats.add(c.categoria); });
    categoriesCache = Array.from(cats).sort();
    return categoriesCache;
        }

    function getCategoryCount(cat) {
            if (categoriesCountCache[cat] !== undefined) return categoriesCountCache[cat];
            const count = citations.filter(c => c.categoria === cat).length;
    categoriesCountCache[cat] = count;
    return count;
        }

    function isSaturated(cat) {
            const catCits = citations.filter(c => c.categoria === cat);
    if (catCits.length < 5) return false;
            const dates = [...new Set(catCits.map(c => c.fecha))].sort().slice(-3);
    return dates.length < 3;
        }

    function renderCodeTree() {
            const tree = document.getElementById('codeTree');
    const cats = getCategories();
    const families = {'ALG:': [], 'SUB:': [], 'COL:': [], 'general': [] };
            cats.forEach(cat => {
                if (cat.startsWith('ALG:')) families['ALG:'].push(cat);
    else if (cat.startsWith('SUB:')) families['SUB:'].push(cat);
    else if (cat.startsWith('COL:')) families['COL:'].push(cat);
    else families['general'].push(cat);
            });
    let html = '';
    for (const [prefix, catList] of Object.entries(families)) {
                if (catList.length === 0) continue;
    const family = FAMILIES[prefix] || DEFAULT_FAMILY;
    const cls = prefix === 'ALG:' ? 'family-alg' : prefix === 'SUB:' ? 'family-sub' : prefix === 'COL:' ? 'family-col' : 'family-general';
    html += `<div class="code-family ${cls}"><div class="family-title">${family.name}</div>`;
                catList.forEach(cat => {
                    const active = currentFilter === cat ? 'active' : '';
        const saturated = isSaturated(cat) ? 'saturated' : '';
        html += `<div class="code-item ${active} ${saturated}" onclick="filterByCode('${cat}')">
            <span>${cat}</span><span class="code-count">${getCategoryCount(cat)}</span></div>`;
                });
        html += '</div>';
            }
    tree.innerHTML = html;
        }

    // Notas de Campo Functions
    function loadFieldNotes() {
            const stored = localStorage.getItem(STORAGE_KEY_FIELD_NOTES);
    if (stored) {
                try {fieldNotes = JSON.parse(stored); }
    catch (e) {fieldNotes = []; }
            }
        }

    function saveFieldNotes() {
        localStorage.setItem(STORAGE_KEY_FIELD_NOTES, JSON.stringify(fieldNotes));
    renderFieldNotes();
        }

    // Sistema de Participantes
    function loadParticipants() {
        const stored = localStorage.getItem(STORAGE_KEY_PARTICIPANTS);
    if (stored) {
            try {participants = JSON.parse(stored); }
    catch (e) {participants = []; }
        }
    }

    function saveParticipants() {
        localStorage.setItem(STORAGE_KEY_PARTICIPANTS, JSON.stringify(participants));
    }

    function getNextParticipantCode() {
        const codes = participants.map(p => p.codigo).filter(c => c && c.match(/^P\d+$/));
    if (codes.length === 0) return 'P1';
        const nums = codes.map(c => parseInt(c.replace('P', '')));
    return 'P' + String(Math.max(...nums) + 1);
    }

    function getParticipantByCode(code) {
        return participants.find(p => p.codigo === code);
    }

    function getParticipantByName(name) {
        return participants.find(p => p.nombre.toLowerCase() === name.toLowerCase());
    }

    function addParticipant(name, phone = '') {
        if (!name) return null;
    const existing = getParticipantByName(name);
    if (existing) return existing;
    const newParticipant = {
        nombre: name,
    telefono: phone,
    codigo: getNextParticipantCode(),
    fecha_agregado: new Date().toISOString()
        };
    participants.push(newParticipant);
    saveParticipants();
    return newParticipant;
    }

    function getParticipantsList() {
        return participants.sort((a, b) => {
            const countA = citations.filter(c => c.participante === a.codigo).length;
            const countB = citations.filter(c => c.participante === b.codigo).length;
            if (countB !== countA) return countB - countA;
            return a.nombre.localeCompare(b.nombre);
        });
    }

    function saveFieldNote() {
            const text = document.getElementById('fieldNotesInput').value.trim();
    if (!text) {alert('La nota no puede estar vacía'); return; }

    if (currentFieldNoteEditId !== null) {
                // Editar nota existente
                const note = fieldNotes.find(n => n.id === currentFieldNoteEditId);
    if (note) {
        note.texto = text;
    note.fecha_modificacion = new Date().toISOString();
                }
            } else {
                // Crear nueva nota
                const note = {
        id: Date.now(),
    texto: text,
    fecha: new Date().toISOString(),
    fecha_modificacion: new Date().toISOString()
                };
    fieldNotes.unshift(note);
            }

    saveFieldNotes();
    clearFieldNoteInput();
    alert('Nota guardada');
        }

    function deleteFieldNote(id) {
            if (!confirm('¿Eliminar esta nota?')) return;
            fieldNotes = fieldNotes.filter(n => n.id !== id);
    saveFieldNotes();
        }

    function editFieldNote(id) {
            const note = fieldNotes.find(n => n.id === id);
    if (note) {
        document.getElementById('fieldNotesInput').value = note.texto;
    currentFieldNoteEditId = id;
    window.scrollTo({top: 0, behavior: 'smooth' });
            }
        }

    function clearFieldNoteInput() {
        document.getElementById('fieldNotesInput').value = '';
    currentFieldNoteEditId = null;
        }

    // Reacciones Functions
    function handleReaction(reaction) {
        if (isReactionSelecting) {
            // Selección múltiple
            const idx = currentReactions.indexOf(reaction);
            if (idx > -1) {
        currentReactions.splice(idx, 1);
            } else {
        currentReactions.push(reaction);
            }
        } else {
        // Selección única
        currentReactions = [reaction];
        }
    renderReactions();
    }

    function renderReactions() {
        const container = document.getElementById('reactionsContainer');
    const display = document.getElementById('reactionsSelected');
    if (!container) return;

    const buttons = container.querySelectorAll('.reaction-btn');
        buttons.forEach(btn => {
            const reaction = btn.dataset.reaction;
    if (currentReactions.includes(reaction)) {
        btn.classList.add('selected');
            } else {
        btn.classList.remove('selected');
            }
        });
        
        display.textContent = currentReactions.length > 0 ? 'Seleccionadas: ' + currentReactions.join(' ') : '';
    }

    function toggleReactionMode() {
        isReactionSelecting = !isReactionSelecting;
    renderReactions();
    }

    // Link Functions
    function handleLinkInput() {
        const link = document.getElementById('citationLink').value.trim();
    currentLink = link;

    const preview = document.getElementById('linkPreview');
    if (link) {
            try {
                const url = new URL(link);
    const domain = url.hostname.replace('www.', '');
    preview.innerHTML = '<a href="' + link + '" target="_blank">' + link + '</a><br><small>' + domain + '</small>';
        preview.style.display = 'block';
            } catch (e) {
            preview.style.display = 'none';
            }
        } else {
            preview.style.display = 'none';
        }
    }

        function renderFieldNotes() {
            const list = document.getElementById('fieldNotesList');
        const sval = document.getElementById('fieldNotesSearch').value.toLowerCase();

        let notes = [...fieldNotes];
        if (sval) {
            notes = notes.filter(n => n.texto.toLowerCase().includes(sval));
            }

        if (notes.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No hay notas de campo. ¡Anotá algo!</p>';
        return;
            }
        let html = '';
            notes.forEach(n => {
                const date = new Date(n.fecha);
        const dateStr = date.toLocaleDateString('es-AR');
        html += `<div class="memo-item"><div class="memo-header">
            <span>${dateStr}</span>
            <div>
                <button class="btn" style="padding:2px 6px;font-size:0.6rem;background:#e3f2fd;color:#1976D2" onclick="editFieldNote(${n.id})">Editar</button>
                <button class="btn btn-danger" style="padding:2px 6px;font-size:0.6rem" onclick="deleteFieldNote(${n.id})">Eliminar</button>
            </div>
        </div>
            <div class="memo-text">${escapeHtml(n.texto)}</div></div>`;
            });
        list.innerHTML = html;
        }

        function toggleType() {
            const isInt = document.getElementById('registrationType').value === 'intercambio';
        document.getElementById('individualSection').style.display = isInt ? 'none' : 'block';
        document.getElementById('interchangeSection').style.display = isInt ? 'block' : 'none';
        if (isInt && currentTurns.length === 0) addTurn();
        }

        function addTurn() {
            currentTurns.push({ id: Date.now() + currentTurns.length, participante: '', genero: 'masculino', mensaje: '' });
        renderTurns();
        }

        function removeTurn(id) {currentTurns = currentTurns.filter(t => t.id !== id); renderTurns(); }
        function updateTurn(id, field, val) { const t = currentTurns.find(x => x.id === id); if (t) t[field] = val; }

        function renderTurns() {
            const cont = document.getElementById('turnsContainer');
        let html = '';
            currentTurns.forEach((t, i) => {
                const even = (i + 1) % 2 === 0;
        html += `<div class="turn-row" style="opacity: ${even ? '0.8' : '1'}">
            <input type="text" placeholder="P01" value="${t.participante}" oninput="updateTurn(${t.id}, 'participante', this.value)" onblur="resolveParticipantTurn(${t.id}, this)">
                <select onchange="updateTurn(${t.id}, 'genero', this.value)"><option value="masculino" ${t.genero === 'masculino' ? 'selected' : ''}>M</option><option value="femenino" ${t.genero === 'femenino' ? 'selected' : ''}>F</option><option value="no_binario" ${t.genero === 'no_binario' ? 'selected' : ''}>NB</option><option value="no_identificado" ${t.genero === 'no_identificado' ? 'selected' : ''}>?</option></select>
                <textarea placeholder="Mensaje..." oninput="updateTurn(${t.id}, 'mensaje', this.value)">${t.mensaje}</textarea>
                <button class="btn-remove-turn" onclick="removeTurn(${t.id})">×</button></div>`;
            });
        cont.innerHTML = html;
        }

        function resolveParticipantTurn(id, el) {
            let val = el.value.trim();
            if (!val) return;
            let p = getParticipantByCode(val) || getParticipantByName(val);
            if (!p) {
                let numMatch = val.match(/^(\d+)$/);
                if (numMatch) {
                    let code = 'P' + numMatch[1].padStart(2, '0');
                    p = getParticipantByCode(code) || {codigo: code};
                } else {
                    p = getParticipantsList().find(x => x.nombre.toLowerCase().includes(val.toLowerCase()));
                }
            }
            if (p) {
                el.value = p.codigo;
                updateTurn(id, 'participante', p.codigo);
            }
        }

        function handleMedia(input) {
            const file = input.files[0]; if (!file) return;
            if (currentMedia.length >= 5) {alert('Máximo 5 archivos'); return; }
        const reader = new FileReader();
        reader.onload = function (e) {currentMedia.push({ name: file.name, type: file.type.startsWith('image/') ? 'imagen' : 'audio', data: e.target.result }); renderMedia(); };
        reader.readAsDataURL(file);
        input.value = '';
        }

        function renderMedia() {
            const cont = document.getElementById('mediaPreview');
        const cnt = document.getElementById('fileCount');
        let html = '';
            currentMedia.forEach(m => {
                if (m.type === 'imagen') html += `<img src="${m.data}" onclick="viewMedia(${currentMedia.indexOf(m)})" title="${m.name}">`;
            else html += `<div class="audio-icon">🎵<br>${m.name}</div>`;
            });
            cont.innerHTML = html;
            cnt.textContent = `${currentMedia.length} archivos`;
        }

            function viewMedia(idx) { if (currentMedia[idx].type === 'imagen') window.open(currentMedia[idx].data, '_blank'); }

            function showCategorySuggestions() {
            const inp = document.getElementById('category');
            const sug = document.getElementById('categorySuggestions');
            const val = inp.value.trim().toLowerCase();
            if (val.length < 2) {sug.style.display = 'none'; return; }
            const cats = getCategories();
            const matches = cats.filter(c => c.toLowerCase().includes(val));
            if (matches.length === 0) {sug.style.display = 'none'; return; }
            sug.innerHTML = matches.map(cat => `<div class="autocomplete-suggestion" onclick="selectCat('${cat}')"><span>${cat}</span><span style="color:#999">(${getCategoryCount(cat)})</span></div>`).join('');
            sug.style.display = 'block';
        }

            function selectCat(cat) {document.getElementById('category').value = cat; document.getElementById('categorySuggestions').style.display = 'none'; }

            function clearFilter() {currentFilter = null; renderCodeTree(); renderCitationsList(); document.getElementById('filterInfo').style.display = 'none'; }

            function filterByCode(code) {
                currentFilter = code;
            renderCodeTree();
            renderCitationsList();
            document.getElementById('filterInfo').innerHTML = `Filtrando: <strong>${code}</strong> | <span class="clear-filter" onclick="clearFilter()">Limpiar</span>`;
            document.getElementById('filterInfo').style.display = 'block';
        }

            function saveCitation() {
            const cat = document.getElementById('category').value.trim();
            if (!cat) {alert('Seleccioná o ingresá una categoría'); return; }
            const isInt = document.getElementById('registrationType').value === 'intercambio';

            // Manejo de participantes
            const participantName = document.getElementById('participantName').value.trim();
            const participantPhone = document.getElementById('participantPhone').value.trim();
            const participantCode = document.getElementById('participantId').value.trim();

            let participantData;
            if (participantName) {
                participantData = addParticipant(participantName, participantPhone);
            } else if (participantCode) {
                participantData = getParticipantByCode(participantCode);
            }

            const cit = {
                id: Date.now(), fecha: document.getElementById('citationDate').value,
            sesion: document.getElementById('citationSession').value,
            tipo_registro: document.getElementById('registrationType').value,
            participante: participantData ? participantData.codigo : (document.getElementById('participantId').value || getNextPid()),
            participante_nombre: participantData ? participantData.nombre : participantName,
            participante_telefono: participantData ? participantData.telefono : participantPhone,
            tipo_participante: document.getElementById('participantType').value,
            genero: document.getElementById('participantGender').value,
            categoria: cat, codigo_invivo: document.getElementById('invivoCode').value.trim(),
            tono: document.getElementById('tone').value, memo: document.getElementById('memo').value.trim(),
            reacciones: [...currentReactions], link: currentLink,
            media: [...currentMedia]
            };
            if (isInt) {
                cit.fragmento = null;
                cit.turnos = currentTurns.filter(t => t.mensaje.trim());
            cit.descripcion_intercambio = document.getElementById('interchangeDescription').value.trim();
            cit.cantidad_turnos = cit.turnos.length;
            if (cit.turnos.length < 2) {alert('El intercambio debe tener al menos 2 turnos'); return; }
            } else {
                cit.fragmento = document.getElementById('fragment').value.trim();
            cit.turnos = null;
            if (!cit.fragmento) {alert('La cita debe tener un fragmento'); return; }
            }
            citations.unshift(cit);
            saveCitations();
            document.getElementById('citationDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('fragment').value = ''; document.getElementById('invivoCode').value = '';
            document.getElementById('memo').value = ''; document.getElementById('category').value = '';
            document.getElementById('participantName').value = ''; document.getElementById('participantPhone').value = '';
            document.getElementById('participantId').value = ''; currentReactions = []; currentLink = '';
            renderReactions(); document.getElementById('linkPreview').style.display = 'none';
            currentTurns = []; currentMedia = []; renderTurns(); renderMedia();
            alert('Cita guardada');
        }

            function deleteCitation(id) {
            if (!confirm('¿Eliminar esta cita?')) return;
            citations = citations.filter(c => c.id !== id);
            saveCitations();
        }

            function renderCitationsList() {
            const list = document.getElementById('citationsList');
            let filtered = currentFilter ? citations.filter(c => c.categoria === currentFilter) : citations;
            const recent = filtered.slice(0, 20);
            if (recent.length === 0) {list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No hay citas</p>'; return; }
            let html = '';
            recent.forEach(c => {
                const isInt = c.tipo_registro === 'intercambio';
            const frag = isInt ? `${c.cantidad_turnos || 0} turnos` : (c.fragmento || '').substring(0, 80) + (c.fragmento && c.fragmento.length > 80 ? '...' : '');
            html += `<div class="citation-item ${isInt ? 'intercambio' : 'cita'}">
                <div class="citation-meta"><span class="meta-item">${c.fecha} ${c.sesion.charAt(0).toUpperCase() + c.sesion.slice(1)}</span>
                    <span class="badge-category">${c.categoria}</span><span class="badge-tone">${c.tono}</span>
                    ${c.codigo_invivo ? `<span class="meta-item">"${c.codigo_invivo}"</span>` : ''}
                    ${c.reacciones && c.reacciones.length > 0 ? '<span class="meta-item" style="color:#f59e0b">' + c.reacciones.join(' ') + '</span>' : ''}
                    ${c.link ? '<span class="meta-item" style="color:#2563eb">🔗</span>' : ''}
                    ${c.media.length > 0 ? '<span class="meta-item">📎</span>' : ''}
                    ${isInt ? '<span class="meta-item" style="color:#FF9800">🔄</span>' : ''}</div>
                <div class="citation-fragment">${escapeHtml(frag)}</div>
                ${c.memo ? `<div style="font-size:0.7rem;color:#888;font-style:italic">${escapeHtml(c.memo.substring(0, 100))}${c.memo.length > 100 ? '...' : ''}</div>` : ''}
                ${c.link ? `<div style="font-size:0.7rem;color:#2563eb"><a href="${c.link}" target="_blank">${escapeHtml(c.link)}</a></div>` : ''}
                <div class="citation-actions"><button class="btn btn-danger" onclick="deleteCitation(${c.id})">Eliminar</button></div></div>`;
            });
            list.innerHTML = html;
        }

            function escapeHtml(t) { if (!t) return ''; return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }

        function updateAll() {
            renderCitationsList();
        renderDashboard();
        renderMemos();
        // Solo renderizar notas si el tab está activo
        if (document.getElementById('fieldNotesSection').style.display !== 'none') {
            renderFieldNotes();
            }
        }

        function renderDashboard() {
            const oldCats = getCategories();
            const oldCounts = oldCats.map(c => getCategoryCount(c));

        document.getElementById('totalCitations').textContent = citations.length;
        document.getElementById('activeCategories').textContent = getCategories().length;
            document.getElementById('daysObserved').textContent = [...new Set(citations.map(c => c.fecha))].length;
            document.getElementById('totalMedia').textContent = citations.reduce((s, c) => s + c.media.length, 0);
            const cc = citations.filter(c => c.tipo_registro === 'cita').length;
            const ic = citations.filter(c => c.tipo_registro === 'intercambio').length;
        document.getElementById('citasCount').textContent = cc;
        document.getElementById('intercambiosCount').textContent = ic;

        const newCats = getCategories();
            const newCounts = newCats.map(c => getCategoryCount(c));

        renderCategoryChart(oldCats, oldCounts, newCats, newCounts);
        renderGenderChart();
        renderHeatmap();
        renderSaturationWarnings();
        }

        function renderCategoryChart(oldCats, oldCounts, newCats, newCounts) {
            const categoriesChanged = JSON.stringify(oldCats) !== JSON.stringify(newCats);

        if (!chartInstances.category || categoriesChanged) {
                const cats = newCats;
        const counts = newCounts;
                const colors = cats.map(c => getFamily(c).color);
        const ctx = document.getElementById('categoryChart').getContext('2d');
        if (chartInstances.category) chartInstances.category.destroy();
        chartInstances.category = new Chart(ctx, {type: 'bar', data: {labels: cats, datasets: [{label: 'Frecuencia', data: counts, backgroundColor: colors, borderColor: colors, borderWidth: 1 }] }, options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: {x: {beginAtZero: true } } } });
            } else {
            chartInstances.category.data.datasets[0].data = newCounts;
        chartInstances.category.update('none');
            }
        }

        function renderGenderChart() {
            const gc = {'masculino': 0, 'femenino': 0, 'no_binario': 0, 'no_identificado': 0 };
            citations.forEach(c => {
                if (c.tipo_registro === 'intercambio' && c.turnos && c.turnos.length > 0) {
            gc[c.turnos[0].genero || 'no_identificado'] = (gc[c.turnos[0].genero || 'no_identificado'] || 0) + 1;
                } else {gc[c.genero || 'no_identificado'] = (gc[c.genero || 'no_identificado'] || 0) + 1; }
            });
        if (chartInstances.gender) {
            chartInstances.gender.data.datasets[0].data = [gc['masculino'], gc['femenino'], gc['no_binario'], gc['no_identificado']];
        chartInstances.gender.update('none');
            } else {
                const ctx = document.getElementById('genderChart').getContext('2d');
        chartInstances.gender = new Chart(ctx, {type: 'doughnut', data: {labels: ['Masculino', 'Femenino', 'No binario', 'No identificado'], datasets: [{data: [gc['masculino'], gc['femenino'], gc['no_binario'], gc['no_identificado']], backgroundColor: ['#2196F3', '#E91E63', '#9C27B0', '#9E9E9E'], borderWidth: 1 }] }, options: {responsive: true, maintainAspectRatio: false } });
            }
        }

        function renderHeatmap() {
            const cats = getCategories();
        const ses = ['mañana', 'noche'];
        const counts = { };
            ses.forEach(s => {counts[s] = {}; cats.forEach(cat => {counts[s][cat] = citations.filter(c => c.sesion === s && c.categoria === cat).length; }); });
        let thead = '<th>Sesión / Categoría</th>';
            cats.forEach(cat => {thead += `<th>${cat.substring(0, 8)}${cat.length > 8 ? '...' : ''}</th>`; });
        let tbody = '';
            ses.forEach(s => {
            tbody += `<tr><td>${s.charAt(0).toUpperCase() + s.slice(1)}</td>`;
                cats.forEach(cat => {
                    const cnt = counts[s][cat] || 0;
        let cls = 'heatmap-cell';
                    if (cnt > 0) cls += cnt >= 5 ? ' high' : cnt >= 3 ? ' medium' : ' low';
        tbody += `<td class="${cls}">${cnt > 0 ? cnt : ''}</td>`;
                });
        tbody += '</tr>';
            });
    document.getElementById('heatmapHeaders').innerHTML = thead;
    document.getElementById('heatmapBody').innerHTML = tbody;
        }

    function renderSaturationWarnings() {
    const cont = document.getElementById('saturationWarnings');
    const saturated = getCategories().filter(c => isSaturated(c));
    if (saturated.length === 0) {cont.innerHTML = ''; return; }
    let html = '<div class="suggestion-card warning"><h4>⚠️ Posible saturación teórica:</h4>';
    saturated.forEach(c => {html += `<p style="margin:4px 0;font-size:0.7rem">${c}</p>`; });
        html += '<p style="font-size:0.55rem;margin-top:6px;color:#721c24;">Requiere tu juicio interpretativo — este indicador es orientativo.</p></div>';
    cont.innerHTML = html;
}

    function renderMemos() {
    const list = document.getElementById('memoList');
    const sel = document.getElementById('memoFilter');
    const cats = getCategories();
    let opts = '<option value="">Todas</option>';
    cats.forEach(cat => {opts += `<option value="${cat}">${cat}</option>`; });
    sel.innerHTML = opts;
    let memos = citations.filter(c => c.memo && c.memo.trim());
    const fval = sel.value;
    const sval = document.getElementById('memoSearch').value.toLowerCase();
    if (fval) memos = memos.filter(c => c.categoria === fval);
    if (sval) memos = memos.filter(c => c.memo.toLowerCase().includes(sval));
    if (memos.length === 0) {list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No hay memos</p>'; return; }
    let html = '';
    memos.forEach(c => {
        html += `<div class="memo-item"><div class="memo-header"><span>${c.fecha} ${c.sesion.charAt(0).toUpperCase() + c.sesion.slice(1)}</span><span class="badge-category">${c.categoria}</span></div>
                    ${c.codigo_invivo ? `<div style="font-style:italic;color:#666;font-size:0.65rem">"${c.codigo_invivo}"</div>` : ''}
                    <div class="memo-text">"${escapeHtml(c.memo)}"</div></div>`;
    });
    list.innerHTML = html;
}

    function filterMemos() {
    const sel = document.getElementById('memoFilter');
    const sval = document.getElementById('memoSearch').value.toLowerCase();
    const fval = sel.value;
    const list = document.getElementById('memoList');
    let memos = citations.filter(c => c.memo && c.memo.trim());
    if (fval) memos = memos.filter(c => c.categoria === fval);
    if (sval) memos = memos.filter(c => c.memo.toLowerCase().includes(sval));
    if (memos.length === 0) {list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No hay memos</p>'; return; }
    let html = '';
    memos.forEach(c => {
        html += `<div class="memo-item"><div class="memo-header"><span>${c.fecha} ${c.sesion.charAt(0).toUpperCase() + c.sesion.slice(1)}</span><span class="badge-category">${c.categoria}</span></div>
                    ${c.codigo_invivo ? `<div style="font-style:italic;color:#666;font-size:0.65rem">"${c.codigo_invivo}"</div>` : ''}
                    <div class="memo-text">"${escapeHtml(c.memo)}"</div></div>`;
    });
    list.innerHTML = html;
}

    function switchTab(name) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel-content').forEach(c => c.style.display = 'none');
    if (name === 'dashboard') {
        document.getElementById('dashboard').style.display = 'block';
    document.querySelectorAll('.tab')[0].classList.add('active');
    } else if (name === 'memos') {
        document.getElementById('memos').style.display = 'block';
    document.querySelectorAll('.tab')[1].classList.add('active');
    }
}

    function switchPanelCenterTab(name) {
        document.querySelectorAll('.panel-center .tab').forEach(t => t.classList.remove('active'));
    document.getElementById('citationsSection').style.display = 'none';
    document.getElementById('fieldNotesSection').style.display = 'none';
    if (name === 'citations') {
        document.getElementById('citationsSection').style.display = 'block';
    document.querySelectorAll('.panel-center .tab')[0].classList.add('active');
    } else if (name === 'fieldNotes') {
        document.getElementById('fieldNotesSection').style.display = 'block';
    document.querySelectorAll('.panel-center .tab')[1].classList.add('active');
    }
}

    function exportJSON() {
    const data = {version: 'v3', exportado_en: new Date().toISOString(), citas: citations };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `backup_UH_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

    function importJSON(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
    if (!data.version || (data.version !== 'v2' && data.version !== 'v3')) {alert('Formato inválido'); return; }
    let imported = data.citas || [];
            if (data.version === 'v2') imported = imported.map(c => ({...c, tipo_registro: 'cita', genero: 'no_identificado', turnos: null }));
            const existing = new Set(citations.map(c => c.id));
    let newC = 0, existC = 0;
            imported.forEach(c => { if (existing.has(c.id)) existC++; else {citations.push(c); newC++; } });
    saveCitations();
    renderCodeTree(); renderCitationsList(); renderDashboard(); renderMemos();
    alert(`Importación completada:\n- Nuevas: ${newC}\n- Ya existentes: ${existC}`);
        } catch (err) {console.error(err); alert('Error al importar'); }
    };
    reader.readAsText(file);
    input.value = '';
}

    function exportCSV() {
    const headers = ['id', 'fecha', 'sesion', 'tipo_registro', 'participante', 'tipo_participante', 'genero', 'categoria', 'codigo_invivo', 'tono', 'memo', 'cantidad_turnos', 'tiene_adjunto', 'cantidad_adjuntos', 'turnos_resumen'];
    const rows = citations.map(c => {
        let tr = '';
    if (c.tipo_registro === 'intercambio' && c.turnos) {
        tr = c.turnos.map(t => `${t.participante}(${t.genero.substring(0, 1)}): ${t.mensaje.replace(/\n/g, ' ')}`).join(' | ');
        }
    return [c.id, c.fecha, c.sesion, c.tipo_registro, c.participante, c.tipo_participante, c.genero, c.categoria, c.codigo_invivo, c.tono, `"${(c.memo || '').replace(/"/g, '""')}"`, c.cantidad_turnos || 0, c.media.length > 0 ? 'Sí' : 'No', c.media.length, `"${tr.replace(/"/g, '""')}"`].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `uh_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

    function exportDOCX() {
    const {Document, Paragraph, HeadingLevel, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, Packer} = docx;

    const doc = new Document({
        sections: [{
        properties: { },
    children: [
    new Paragraph({
        text: 'Unidad Hermenéutica - Exportación',
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    run: {size: 28, bold: true, color: '2563eb' }
                }),
    new Paragraph({
        text: `Fecha de exportación: ${new Date().toLocaleDateString('es-AR')}`,
    alignment: AlignmentType.CENTER,
    run: {size: 14, italics: true }
                }),
    new Paragraph({text: '\n' }),
    new Paragraph({
        text: `Total de citas: ${citations.length}`,
    alignment: AlignmentType.CENTER,
    run: {size: 16, bold: true }
                }),
    new Paragraph({text: '\n' })
    ]
        }]
    });

    citations.forEach(c => {
        const participantCode = c.participante_codigo || c.participante || 'P1';
    doc.sections[0].children.push(
    new Paragraph({
        text: '---',
    run: {size: 10 }
            }),
    new Paragraph({
        text: c.categoria || 'Sin categoría',
    heading: HeadingLevel.HEADING_2,
    run: {size: 20, bold: true, color: '2563eb' }
            }),
    new Paragraph({text: '\n' }),
    new Paragraph({
        text: `Fecha: ${c.fecha} | Sesión: ${c.sesion}`,
    run: {size: 12 }
            }),
    new Paragraph({
        text: `Participante: ${participantCode} (${c.tipo_participante}) | Género: ${c.genero}`,
    run: {size: 12 }
            }),
    new Paragraph({
        text: `Tono: ${c.tono} | Código In Vivo: ${c.codigo_invivo}`,
    run: {size: 12 }
            }),
    new Paragraph({
        text: c.reacciones && c.reacciones.length > 0 ? `Reacciones: ${c.reacciones.join(' ')}` : '',
    run: {size: 12, color: 'f59e0b' }
            }),
    new Paragraph({
        text: c.link ? `Link: ${c.link}` : '',
    run: {size: 12, color: '2563eb', italics: true }
            }),
    new Paragraph({text: '\n' })
    );

    if (c.tipo_registro === 'cita') {
        doc.sections[0].children.push(
            new Paragraph({
                text: c.fragmento,
                heading: HeadingLevel.HEADING_3,
                run: { size: 14, italics: true }
            })
        );
        } else if (c.tipo_registro === 'intercambio' && c.turnos) {
        doc.sections[0].children.push(
            new Paragraph({ text: '\nIntercambio:\n', run: { bold: true, size: 14 } })
        );
            c.turnos.forEach((t, i) => {
        doc.sections[0].children.push(
            new Paragraph({
                text: `${i + 1}. ${t.participante}: ${t.mensaje}`,
                run: { size: 12 }
            })
        );
            });
    if (c.descripcion) {
        doc.sections[0].children.push(
            new Paragraph({ text: '\n' + c.descripcion, run: { size: 12, italics: true } })
        );
            }
        }

    if (c.memo) {
        doc.sections[0].children.push(
            new Paragraph({ text: '\nMemo: ' + c.memo, run: { size: 12, italics: true, color: '64748b' } })
        );
        }
    doc.sections[0].children.push(new Paragraph({text: '\n' }));
    });

    Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uh_export_${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    });
}

    function exportMarkdown() {
        let md = '# Exportación Unidad Hermenéutica\n\n';
    md += `**Fecha de exportación:** ${new Date().toLocaleDateString('es-AR')}\n\n`;
    md += `**Total de citas:** ${citations.length}\n\n`;
    md += '---\n\n';

    citations.forEach((c, index) => {
        md += `## ${index + 1}. ${c.categoria || 'Sin categoría'}\n\n`;
    md += `**Fecha:** ${c.fecha} | **Sesión:** ${c.sesion}\n\n`;
    md += `**Participante:** ${c.participante} (${c.tipo_participante}) | **Género:** ${c.genero}\n\n`;
    md += `**Tono:** ${c.tono} | **Código In Vivo:** ${c.codigo_invivo}\n\n`;

    if (c.tipo_registro === 'cita') {
        md += `> ${c.fragmento}\n\n`;
        } else if (c.tipo_registro === 'intercambio' && c.turnos) {
        md += '**Intercambio:**\n\n';
            c.turnos.forEach((t, i) => {
        md += `${i + 1}. **${t.participante}**: ${t.mensaje}\n`;
            });
    md += `\n${c.descripcion || ''}\n\n`;
        }

    if (c.memo) {
        md += `**Memo:** ${c.memo}\n\n`;
        }
    md += '---\n\n';
    });

    const blob = new Blob([md], {type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `uh_export_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

    function updateDate() {
    const date = new Date();
    const opts = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = date.toLocaleDateString('es-AR', opts);
}

    function initCharts() {
    const ctx1 = document.getElementById('categoryChart').getContext('2d');
    const ctx2 = document.getElementById('genderChart').getContext('2d');
    chartInstances.category = new Chart(ctx1, {type: 'bar', data: {labels: [], datasets: [] }, options: {indexAxis: 'y', responsive: true, maintainAspectRatio: false } });
    chartInstances.gender = new Chart(ctx2, {type: 'doughnut', data: {labels: [], datasets: [] }, options: {responsive: true, maintainAspectRatio: false } });
}

    // Setup Reactions
    function setupReactions() {
        const container = document.getElementById('reactionsContainer');
    if (!container) return;
    const buttons = container.querySelectorAll('.reaction-btn');
        buttons.forEach(btn => {
        btn.addEventListener('click', function () {
            handleReaction(this.dataset.reaction);
        });
        });
    const reactionBtn = document.createElement('button');
    reactionBtn.textContent = ' múltiple';
    reactionBtn.className = 'btn btn-secondary';
    reactionBtn.style.cssText = 'margin-left: 8px; padding: 4px 8px; font-size: 0.65rem;';
    reactionBtn.title = 'Clic para cambiar entre selección única/múltiple';
    container.appendChild(reactionBtn);
    reactionBtn.addEventListener('click', function() {
        toggleReactionMode();
    this.textContent = isReactionSelecting ? ' único' : ' múltiple';
        });
    }

    function showParticipantSuggestions() {
        const input = document.getElementById('participantId');
    const suggestions = document.getElementById('participantSuggestions');
    const val = input.value.trim().toLowerCase();
    if (val.length < 2) {
        suggestions.style.display = 'none';
    return;
        }
    const list = getParticipantsList();
        const matches = list.filter(p => p.nombre.toLowerCase().includes(val) || p.codigo.toLowerCase().includes(val));
    if (matches.length === 0) {
        suggestions.style.display = 'none';
    return;
        }
        suggestions.innerHTML = matches.map(p => '<div class="autocomplete-suggestion" onclick="selectParticipant(\'' + p.nombre.replace(/'/g, "\\'") + '\', \'' + (p.telefono || '') + '\', \'' + p.codigo + '\')"><span>' + p.nombre + '</span><span style="color:#999">' + p.codigo + '</span></div>').join('');
suggestions.style.display = 'block';
    }

    function hideParticipantAutocomplete() {
        const suggestions = document.getElementById('participantSuggestions');
        if (suggestions) suggestions.style.display = 'none';
    }

function selectParticipant(name, phone, code) {
    document.getElementById('participantName').value = name;
    document.getElementById('participantPhone').value = phone || '';
    document.getElementById('participantId').value = code;
    document.getElementById('participantSuggestions').style.display = 'none';
}

// Setup Participant Autocomplete
function setupParticipantAutocomplete() {
    const input = document.getElementById('participantId');
    if (!input) return;
    const debouncedSuggestions = debounce(showParticipantSuggestions, 100);
    input.addEventListener('input', debouncedSuggestions);
}

// Init
init();
</script >
</body >

</html >

< !--NUEVAS FUNCIONALIDADES A AGREGAR-- >
< !--
    1. Campo Hora en formularios
2. Notas de Campo(tab independiente)
3. Objetivos de tesis(4 botones)
4. Copiar a Docs(citas y notas)
-->