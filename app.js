(function () {
  const STORAGE_KEY = 'opportunity_finder_data_v1';

  function toNumber(value) {
    return Number.parseInt(value, 10);
  }

  function bounded(value) {
    return Math.min(10, Math.max(1, toNumber(value)));
  }

  function calculateScore(opportunity) {
    const positive =
      opportunity.value * 0.30 +
      opportunity.feasibility * 0.25 +
      opportunity.repeatability * 0.20;

    const penalties =
      opportunity.cost * 0.10 +
      opportunity.time * 0.10 +
      opportunity.risk * 0.05;

    return Number((positive - penalties).toFixed(2));
  }

  function normalize(raw) {
    const normalized = {
      name: String(raw.name || '').trim(),
      value: bounded(raw.value),
      feasibility: bounded(raw.feasibility),
      cost: bounded(raw.cost),
      time: bounded(raw.time),
      risk: bounded(raw.risk),
      repeatability: bounded(raw.repeatability),
      experiment: String(raw.experiment || '').trim(),
    };

    normalized.score = calculateScore(normalized);
    return normalized;
  }

  function sortByScoreDescending(items) {
    return [...items].sort((a, b) => b.score - a.score);
  }

  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(normalize);
    } catch (_error) {
      return [];
    }
  }

  function renderTable(items, tableBody) {
    tableBody.innerHTML = '';

    items.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.score}</td>
        <td>${item.experiment}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  function renderRecommendation(items, recommendationEl) {
    if (!items.length) {
      recommendationEl.textContent =
        'Add at least one opportunity to get a recommendation.';
      return;
    }

    const top = items[0];
    recommendationEl.textContent =
      `Focus now: "${top.name}" (score ${top.score}). ` +
      `First action: ${top.experiment}`;
  }

  function downloadJson(items) {
    const payload = JSON.stringify(items, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'opportunity-data.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function initApp() {
    const form = document.getElementById('opportunity-form');
    const tableBody = document.querySelector('#results-table tbody');
    const recommendationEl = document.getElementById('recommendation-text');
    const clearBtn = document.getElementById('clear-btn');
    const exportBtn = document.getElementById('export-btn');

    let opportunities = sortByScoreDescending(load());

    renderTable(opportunities, tableBody);
    renderRecommendation(opportunities, recommendationEl);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const candidate = normalize({
        name: formData.get('name') || document.getElementById('name').value,
        value: formData.get('value') || document.getElementById('value').value,
        feasibility:
          formData.get('feasibility') || document.getElementById('feasibility').value,
        cost: formData.get('cost') || document.getElementById('cost').value,
        time: formData.get('time') || document.getElementById('time').value,
        risk: formData.get('risk') || document.getElementById('risk').value,
        repeatability:
          formData.get('repeatability') ||
          document.getElementById('repeatability').value,
        experiment:
          formData.get('experiment') || document.getElementById('experiment').value,
      });

      if (!candidate.name || !candidate.experiment) {
        return;
      }

      opportunities = sortByScoreDescending([...opportunities, candidate]);
      save(opportunities);
      renderTable(opportunities, tableBody);
      renderRecommendation(opportunities, recommendationEl);
      form.reset();
    });

    clearBtn.addEventListener('click', () => {
      opportunities = [];
      save(opportunities);
      renderTable(opportunities, tableBody);
      renderRecommendation(opportunities, recommendationEl);
    });

    exportBtn.addEventListener('click', () => {
      downloadJson(opportunities);
    });
  }

  if (typeof document !== 'undefined') {
    initApp();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      calculateScore,
      normalize,
      sortByScoreDescending,
    };
  }
})();
