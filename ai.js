// =============================================
// 1. Application State
// =============================================
const FAVORITES_KEY = 'food_favorites';
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');

// =============================================
// 2. State Accessors / Mutators
// =============================================
function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function toggleFavorite(meal) {
  const idx = favorites.findIndex(f => f.idMeal === meal.idMeal);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(meal);
  }
  saveFavorites();
  updateFavoriteButtons();
  renderFavorites();
}

// =============================================
// 3. DOM Node References
// =============================================
const vorschlaegeGrid = document.getElementById('vorschlaege-grid');
const refreshBtn = document.getElementById('refresh');
const favoritenRow = document.getElementById('favoriten-row');

// =============================================
// 4. DOM Node Creation Functions
// =============================================
function createRecipeCard(meal) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.mealId = meal.idMeal;
  card.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
    <h3>${meal.strMeal}</h3>
    <button class="favorite-btn">&#9829;</button>
  `;
  card.querySelector('.favorite-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleFavorite(meal);
  });
  card.addEventListener('click', () => toggleCardExpand(card, meal));
  return card;
}

// =============================================
// 5. Render Functions
// =============================================

// ----- API -----
async function fetchRecipes() {
  const urls = Array(20).fill('https://www.themealdb.com/api/json/v1/1/random.php');
  const responses = await Promise.all(urls.map(url => fetch(url).then(r => r.json())));
  const seen = new Set();
  return responses.map(d => d.meals?.[0]).filter(Boolean).filter(m => {
    if (seen.has(m.idMeal)) return false;
    seen.add(m.idMeal);
    return true;
  });
}

function buildIngredients(meal) {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) items.push(`${measure} ${ing}`);
  }
  return items;
}

// ----- Cards -----
function renderCards(meals) {
  vorschlaegeGrid.innerHTML = '';
  meals.forEach(meal => vorschlaegeGrid.appendChild(createRecipeCard(meal)));
  updateFavoriteButtons();
  sizeCards();
}

function renderFavorites() {
  favoritenRow.querySelectorAll('.card:not(.card-placeholder)').forEach(c => c.remove());
  favorites.forEach(meal => favoritenRow.appendChild(createRecipeCard(meal)));
  updateFavoriteButtons();
  updatePlaceholders();
  sizeCards();
}

function updateFavoriteButtons() {
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const card = btn.closest('.card');
    if (!card) return;
    const mealId = card.dataset.mealId;
    btn.classList.toggle('favorited', favorites.some(f => f.idMeal === mealId));
  });
}

function toggleCardExpand(card, meal) {
  const existingModal = document.querySelector('.recipe-modal');
  const existingBackdrop = document.querySelector('.card-expanded-backdrop');

  if (card.classList.contains('expanded')) {
    card.classList.remove('expanded');
    existingModal?.remove();
    existingBackdrop?.remove();
    return;
  }

  document.querySelectorAll('.card.expanded').forEach(c => c.classList.remove('expanded'));
  existingModal?.remove();
  existingBackdrop?.remove();

  card.classList.add('expanded');

  const backdrop = document.createElement('div');
  backdrop.className = 'card-expanded-backdrop';
  document.body.appendChild(backdrop);

  const ingredients = buildIngredients(meal);
  const modal = document.createElement('div');
  modal.className = 'recipe-modal';
  modal.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
    <h3>${meal.strMeal}</h3>
    <div class="card-details">
      <p><strong>Kategorie:</strong> ${meal.strCategory || '—'}</p>
      <p><strong>Herkunft:</strong> ${meal.strArea || '—'}</p>
      <h4>Zutaten</h4>
      <ul>${ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
      <h4>Zubereitung</h4>
      <p>${meal.strInstructions}</p>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => {
    card.classList.remove('expanded');
    modal.remove();
    backdrop.remove();
  };
  backdrop.addEventListener('click', close);
}

// ----- Layout -----
function updatePlaceholders() {
  const gap = 16;
  const minCardWidth = 180;
  const availWidth = favoritenRow.clientWidth;
  const numVisible = Math.max(1, Math.floor((availWidth + gap) / (minCardWidth + gap)));
  const realCards = favoritenRow.querySelectorAll('.card:not(.card-placeholder)').length;
  const current = favoritenRow.querySelectorAll('.card-placeholder');
  const needed = Math.max(0, numVisible - realCards);
  if (current.length === needed) return;
  current.forEach(c => c.remove());
  for (let i = 0; i < needed; i++) {
    const card = document.createElement('div');
    card.className = 'card card-placeholder';
    card.innerHTML = '<div class="placeholder-img"></div><div class="placeholder-title"></div>';
    favoritenRow.appendChild(card);
  }
}

function sizeCards() {
  const gap = 16;
  const minCardWidth = 180;
  [vorschlaegeGrid, favoritenRow].forEach(container => {
    const cards = container.querySelectorAll('.card');
    if (!cards.length) return;
    const availWidth = container.clientWidth;
    const numVisible = Math.max(1, Math.floor((availWidth + gap) / (minCardWidth + gap)));
    const cardWidth = Math.floor((availWidth - (numVisible - 1) * gap) / numVisible);
    cards.forEach(c => c.style.width = cardWidth + 'px');
  });
  updateArrows();
}

function scrollCards(container, dir) {
  const card = container.querySelector('.card');
  if (!card) return;
  const step = card.offsetWidth + 16;
  container.scrollBy({ left: dir * step, behavior: 'smooth' });
}

function updateArrows() {
  const leftArrow = document.getElementById('vorschlaege-links');
  const rightArrow = document.getElementById('vorschlaege-rechts');
  const atStart = vorschlaegeGrid.scrollLeft <= 1;
  const atEnd = vorschlaegeGrid.scrollLeft + vorschlaegeGrid.clientWidth >= vorschlaegeGrid.scrollWidth - 1;
  leftArrow.classList.toggle('arrow-disabled', atStart);
  rightArrow.classList.toggle('arrow-disabled', atEnd);

  const favLeft = document.getElementById('favoriten-links');
  const favRight = document.getElementById('favoriten-rechts');
  const hasScroll = favoritenRow.scrollWidth > favoritenRow.clientWidth;
  const favAtStart = favoritenRow.scrollLeft <= 1;
  const favAtEnd = favoritenRow.scrollLeft + favoritenRow.clientWidth >= favoritenRow.scrollWidth - 1;
  favLeft.classList.toggle('arrow-disabled', !hasScroll || favAtStart);
  favRight.classList.toggle('arrow-disabled', !hasScroll || favAtEnd);
}

// =============================================
// 6. Event Handlers
// =============================================
function handleRefresh() {
  vorschlaegeGrid.innerHTML = '<p style="color:var(--teal)">Loading ...</p>';
  fetchRecipes().then(meals => renderCards(meals));
}

function handleResize() {
  updatePlaceholders();
  sizeCards();
  updateArrows();
}

// =============================================
// 7. Initialization of Bindings
// =============================================
vorschlaegeGrid.addEventListener('scroll', updateArrows);
favoritenRow.addEventListener('scroll', updateArrows);

window.addEventListener('resize', handleResize);

refreshBtn.addEventListener('click', handleRefresh);

document.getElementById('vorschlaege-links').addEventListener('click', () => scrollCards(vorschlaegeGrid, -1));
document.getElementById('vorschlaege-rechts').addEventListener('click', () => scrollCards(vorschlaegeGrid, 1));
document.getElementById('favoriten-links').addEventListener('click', () => scrollCards(favoritenRow, -1));
document.getElementById('favoriten-rechts').addEventListener('click', () => scrollCards(favoritenRow, 1));

// =============================================
// 8. Initial Rendering
// =============================================
fetchRecipes().then(meals => renderCards(meals));   // API

renderFavorites();
