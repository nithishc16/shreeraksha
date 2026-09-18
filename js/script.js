const header = document.getElementById('siteHeader');
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

function setMenu(open) {
  mainNav?.classList.toggle('open', open);
  menuToggle?.setAttribute('aria-expanded', String(open));
  menuToggle?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}
menuToggle?.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
window.addEventListener('scroll', () => header?.classList.toggle('scrolled', window.scrollY > 8), { passive: true });

const categories = [...document.querySelectorAll('.service-category')];
const cards = [...document.querySelectorAll('.searchable-service')];
const tabs = [...document.querySelectorAll('.category-tab')];
const searchInput = document.getElementById('serviceSearch');
const searchResults = document.getElementById('searchResults');
const finderResults = document.getElementById('finderResults');
const clearSearch = document.getElementById('clearSearch');

const categoryNames = {
  auditing: 'Auditing & Compliance',
  loans: 'Loans',
  insurance: 'Insurance',
  'real-estate': 'Real Estate'
};

const filterTerms = {
  'business-setup': 'business setup',
  'tax-filing': 'tax filing',
  'home-loan': 'home loan',
  'health-insurance': 'health insurance',
  'property-buying': 'property buying'
};

function normalize(value) {
  return value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function cardMeta(card) {
  return {
    id: card.id,
    name: card.querySelector('h4')?.textContent.trim() || '',
    category: card.dataset.category || '',
    keywords: card.dataset.keywords || '',
    element: card
  };
}

const serviceMeta = cards.map(cardMeta);

function matches(meta, query) {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize(`${meta.name} ${meta.category} ${categoryNames[meta.category] || ''} ${meta.keywords}`);
  return q.split(' ').every(word => haystack.includes(word));
}

function closeSuggestions() {
  searchResults?.classList.remove('visible');
  searchInput?.setAttribute('aria-expanded', 'false');
}

function setTab(category) {
  tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.categoryTab === category));
  categories.forEach(cat => cat.classList.toggle('dimmed', category !== 'all' && cat.dataset.category !== category));
}

function resetCategoryView() {
  categories.forEach(category => {
    category.classList.remove('search-focus');
    category.querySelectorAll('.service-card').forEach(card => card.classList.remove('search-match'));
  });
}

function revealCategory(category, scroll = true) {
  const section = document.querySelector(`.service-category[data-category="${category}"]`);
  if (!section) return;
  section.classList.remove('dimmed');
  if (scroll) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function revealService(id) {
  const meta = serviceMeta.find(item => item.id === id);
  if (!meta) return;
  const section = meta.element.closest('.service-category');
  categories.forEach(cat => cat.classList.add('dimmed'));
  section.classList.remove('dimmed');
  categories.forEach(cat => {
    cat.classList.remove('search-focus');
    cat.querySelectorAll('.service-card').forEach(card => card.classList.remove('search-match'));
  });
  section.classList.add('expanded', 'search-focus');
  meta.element.classList.add('search-match', 'service-highlight');
  setTimeout(() => meta.element.classList.remove('service-highlight'), 1800);
  meta.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  closeSuggestions();
  finderResults.innerHTML = `<strong>${meta.name}</strong> · ${categoryNames[meta.category]} — shown below.`;
  finderResults.classList.add('has-results');
}

function renderSuggestions(query) {
  if (!searchResults) return;
  const q = normalize(query);
  if (!q) { closeSuggestions(); searchResults.innerHTML = ''; return; }
  const list = serviceMeta.filter(meta => matches(meta, q)).slice(0, 7);
  searchResults.innerHTML = list.length
    ? list.map(meta => `<button class="search-result" type="button" data-result-id="${meta.id}"><strong>${meta.name}</strong><small>${categoryNames[meta.category]}</small></button>`).join('')
    : '<div class="search-result"><strong>No exact service found</strong><small>Try GST, loan, insurance or property</small></div>';
  searchResults.classList.add('visible');
  searchInput.setAttribute('aria-expanded', 'true');
}

function applySearch(query) {
  const q = normalize(query);
  if (!q) {
    resetCategoryView();
    setTab('all');
    finderResults.classList.remove('has-results');
    finderResults.innerHTML = '';
    return;
  }
  const matchesList = serviceMeta.filter(meta => matches(meta, q));
  categories.forEach(category => {
    const categoryMatches = matchesList.filter(meta => meta.category === category.dataset.category);
    category.classList.toggle('search-focus', categoryMatches.length > 0);
    category.classList.toggle('dimmed', categoryMatches.length === 0);
    category.querySelectorAll('.service-card').forEach(card => card.classList.toggle('search-match', matchesList.some(meta => meta.id === card.id)));
    if (categoryMatches.length) category.classList.add('expanded');
  });
  tabs.forEach(tab => tab.classList.remove('active'));
  if (matchesList.length) {
    finderResults.innerHTML = `<strong>${matchesList.length}</strong> matching service${matchesList.length === 1 ? '' : 's'}. Click a result above to jump directly.`;
    finderResults.classList.add('has-results');
  } else {
    finderResults.innerHTML = 'No match yet. Try a simpler search such as <strong>GST</strong>, <strong>loan</strong>, <strong>health</strong> or <strong>property</strong>.';
    finderResults.classList.add('has-results');
  }
}

searchInput?.addEventListener('input', () => {
  const value = searchInput.value.trim();
  clearSearch.hidden = !value;
  renderSuggestions(value);
  applySearch(value);
});
searchInput?.addEventListener('focus', () => { if (searchInput.value.trim()) renderSuggestions(searchInput.value); });
clearSearch?.addEventListener('click', () => {
  searchInput.value = '';
  clearSearch.hidden = true;
  closeSuggestions();
  applySearch('');
  searchInput.focus();
});

searchResults?.addEventListener('click', event => {
  const button = event.target.closest('[data-result-id]');
  if (button) revealService(button.dataset.resultId);
});

document.addEventListener('click', event => {
  if (!document.querySelector('.finder-control')?.contains(event.target)) closeSuggestions();
});

finderResults?.addEventListener('click', event => {
  const button = event.target.closest('[data-result-id]');
  if (button) revealService(button.dataset.resultId);
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const category = tab.dataset.categoryTab;
    searchInput.value = '';
    clearSearch.hidden = true;
    closeSuggestions();
    finderResults.classList.remove('has-results');
    finderResults.innerHTML = '';
    resetCategoryView();
    setTab(category);
    if (category !== 'all') revealCategory(category);
  });
});

document.querySelectorAll('[data-filter]').forEach(chip => {
  chip.addEventListener('click', () => {
    const filter = chip.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === chip));
    if (filter === 'all') {
      searchInput.value = '';
      clearSearch.hidden = true;
      closeSuggestions();
      resetCategoryView();
      setTab('all');
      finderResults.classList.remove('has-results');
      finderResults.innerHTML = '';
      return;
    }
    const term = filterTerms[filter];
    searchInput.value = term;
    clearSearch.hidden = false;
    closeSuggestions();
    applySearch(term);
    const first = serviceMeta.find(meta => matches(meta, term));
    if (first) revealService(first.id);
  });
});

document.querySelectorAll('[data-expand-category]').forEach(button => {
  button.addEventListener('click', () => {
    const section = button.closest('.service-category');
    const expanded = section.classList.toggle('expanded');
    button.setAttribute('aria-expanded', String(expanded));
    button.innerHTML = expanded ? 'Show fewer services <span>↑</span>' : `View all ${categoryNames[section.dataset.category]} services <span>↓</span>`;
  });
});

document.querySelectorAll('[data-service]').forEach(link => {
  const service = link.dataset.service;
  const message = `Hello Shree Raksha Groups, I would like to enquire about ${service}.`;
  if (link.matches('.service-cta')) link.href = `https://wa.me/919148002724?text=${encodeURIComponent(message)}`;
  link.addEventListener('click', () => {
    if (link.matches('.service-cta')) link.href = `https://wa.me/919148002724?text=${encodeURIComponent(message)}`;
  });
});

document.getElementById('year').textContent = new Date().getFullYear();
