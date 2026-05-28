// =============================================
// 1. Application State
// =============================================
const state = { animating: false, timeout: null, editKey: null };

// =============================================
// 2. State Accessors / Mutators
// =============================================
function setzeAktiv(li) {
  rezepteListe.querySelectorAll('.aktiv').forEach(el => el.classList.remove('aktiv'));
  if (li) li.classList.add('aktiv');
}

// =============================================
// 3. DOM Node References
// =============================================
const ausklappenButton = document.getElementById('ausklappen');
const rezeptbuch = document.getElementById('rezeptbuch');
const neuesRezept = document.getElementById('neues-rezept');
const loeschenFormular = document.getElementById('loeschen-formular');
const speichernRezept = document.getElementById('speichern-rezept');
const rezepteListe = document.getElementById('rezepte');
const bearbeitenRezept = document.getElementById('bearbeiten-rezept');
const loeschenRezept = document.getElementById('loeschen-rezept');
const anzeigenRezept = document.querySelector('#anzeige .anzeigen-rezept');

// =============================================
// 4. DOM Node Creation Functions
// =============================================
function createRecipeListItem(data, key) {
  const li = document.createElement('li');
  li.textContent = data.titel;
  li.dataset.rezept = key;
  return li;
}

// =============================================
// 5. Render Functions
// =============================================
function expand() {
  state.animating = true;
  rezeptbuch.classList.add('ausgeklappt');

  const offset = window.innerWidth * 0.95 - 10;

  rezeptbuch.style.transition = 'none';
  rezeptbuch.style.transform = `translateX(${offset}px)`;
  void rezeptbuch.offsetHeight;

  rezeptbuch.style.transition = 'transform 0.4s ease-in-out';
  rezeptbuch.style.transform = 'translateX(0)';

  state.timeout = setTimeout(() => {
    rezeptbuch.style.transition = '';
    rezeptbuch.style.transform = '';
    state.animating = false;
    state.timeout = null;
  }, 400);
}

function collapse() {
  state.animating = true;
  if (state.timeout) {
    clearTimeout(state.timeout);
    state.timeout = null;
  }

  const offset = window.innerWidth * 0.95 - 10;

  rezeptbuch.style.transition = 'transform 0.4s ease-in-out';
  rezeptbuch.style.transform = `translateX(${offset}px)`;

  state.timeout = setTimeout(() => {
    rezeptbuch.style.transition = 'none';
    rezeptbuch.classList.remove('ausgeklappt', 'editor-offen', 'anzeige-offen');
    void rezeptbuch.offsetHeight;
    rezeptbuch.style.transition = '';
    rezeptbuch.style.transform = '';
    state.animating = false;
    state.timeout = null;
    state.editKey = null;
    setzeAktiv(null);
  }, 400);
}

function showRecipe(key) {
  const data = JSON.parse(localStorage.getItem(key));
  if (!data) return;
  anzeigenRezept.innerHTML = `
    <h3>Zutaten</h3>
    <p>${data.zutaten}</p>
    <h3>Rezept</h3>
    <p>${data.beschreibung}</p>
  `;
  rezeptbuch.dataset.aktuellesRezept = key;
  rezeptbuch.classList.remove('editor-offen');
  rezeptbuch.classList.add('anzeige-offen');
}

function loadSavedRecipes() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith('rezept_')) continue;
    const data = JSON.parse(localStorage.getItem(key));
    if (!data) continue;
    rezepteListe.appendChild(createRecipeListItem(data, key));
  }
}

// =============================================
// 6. Event Handlers
// =============================================
function handleAusklappen() {
  if (state.animating) return;
  if (rezeptbuch.classList.contains('ausgeklappt')) {
    collapse();
  } else {
    expand();
  }
}

function handleNeuesRezept() {
  if (!rezeptbuch.classList.contains('ausgeklappt')) return;
  setzeAktiv(null);
  rezeptbuch.classList.remove('anzeige-offen');
  rezeptbuch.classList.add('editor-offen');
  state.editKey = null;
}

function handleSpeichernRezept() {
  const titel = document.getElementById('rezepttitel');
  if (!titel.value.trim()) {
    alert('Achtung: Leerer Titel');
    return;
  }
  const key = 'rezept_' + titel.value.trim();

  if (state.editKey && state.editKey !== key) {
    localStorage.removeItem(state.editKey);
    const oldLi = rezepteListe.querySelector(`[data-rezept="${state.editKey}"]`);
    if (oldLi) oldLi.remove();
  }

  localStorage.setItem(key, JSON.stringify({
    titel: titel.value.trim(),
    zutaten: document.getElementById('zutaten').value.trim(),
    beschreibung: document.getElementById('rezeptbeschreibung').value.trim()
  }));

  let li = rezepteListe.querySelector(`[data-rezept="${key}"]`);
  if (!li) {
    li = document.createElement('li');
    rezepteListe.appendChild(li);
  }
  li.textContent = titel.value.trim();
  li.dataset.rezept = key;

  setzeAktiv(null);
  state.editKey = null;
  titel.value = '';
  document.getElementById('zutaten').value = '';
  document.getElementById('rezeptbeschreibung').value = '';
  rezeptbuch.classList.remove('editor-offen');
}

function handleLoeschenFormular() {
  setzeAktiv(null);
  document.getElementById('rezepttitel').value = '';
  document.getElementById('zutaten').value = '';
  document.getElementById('rezeptbeschreibung').value = '';
}

function handleRezepteListeClick(e) {
  const li = e.target.closest('li');
  if (!li) return;
  const key = li.dataset.rezept;
  if (!key) return;
  setzeAktiv(li);
  showRecipe(key);
}

function handleBearbeitenRezept() {
  const key = rezeptbuch.dataset.aktuellesRezept;
  if (!key) return;
  const data = JSON.parse(localStorage.getItem(key));
  if (!data) return;
  document.getElementById('rezepttitel').value = data.titel;
  document.getElementById('zutaten').value = data.zutaten;
  document.getElementById('rezeptbeschreibung').value = data.beschreibung;
  setzeAktiv(null);
  state.editKey = key;
  rezeptbuch.classList.remove('anzeige-offen');
  rezeptbuch.classList.add('editor-offen');
}

function handleLoeschenRezept() {
  const key = rezeptbuch.dataset.aktuellesRezept;
  if (!key) return;
  localStorage.removeItem(key);
  const li = rezepteListe.querySelector(`[data-rezept="${key}"]`);
  if (li) li.remove();
  setzeAktiv(null);
  rezeptbuch.classList.remove('anzeige-offen');
  state.editKey = null;
}

// =============================================
// 7. Initialization of Bindings
// =============================================
ausklappenButton.addEventListener('click', handleAusklappen);
neuesRezept.addEventListener('click', handleNeuesRezept);
speichernRezept.addEventListener('click', handleSpeichernRezept);
loeschenFormular.addEventListener('click', handleLoeschenFormular);
rezepteListe.addEventListener('click', handleRezepteListeClick);
bearbeitenRezept.addEventListener('click', handleBearbeitenRezept);
loeschenRezept.addEventListener('click', handleLoeschenRezept);

// =============================================
// 8. Initial Rendering
// =============================================
loadSavedRecipes();
