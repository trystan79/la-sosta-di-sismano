(function () {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;

  var copy = {
    en: {
      loading: 'Loading availability...',
      setup: 'Calendar sync is ready. Live unavailable dates will appear here after the platform feed URLs are connected.',
      empty: 'No unavailable nights are currently published. Please enquire to confirm.',
      error: 'Availability could not be loaded. Please enquire to confirm your dates.',
      unavailable: 'Unavailable',
      updated: 'Updated',
      previous: 'Previous month',
      next: 'Next month'
    },
    it: {
      loading: 'Caricamento disponibilita...',
      setup: 'La sincronizzazione del calendario e pronta. Le date non disponibili appariranno qui dopo il collegamento dei feed.',
      empty: 'Al momento non risultano notti non disponibili. Contattaci per confermare.',
      error: 'Non e stato possibile caricare la disponibilita. Contattaci per confermare le date.',
      unavailable: 'Non disponibile',
      updated: 'Aggiornato',
      previous: 'Mese precedente',
      next: 'Mese successivo'
    }
  };

  function lang() {
    return (document.documentElement.lang || 'en').toLowerCase().indexOf('it') === 0 ? 'it' : 'en';
  }

  function text(key) {
    return copy[lang()][key];
  }

  function locale() {
    return lang() === 'it' ? 'it-IT' : 'en-GB';
  }

  function parseISODate(value) {
    var parts = value.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function isoDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function addMonths(date, count) {
    return new Date(date.getFullYear(), date.getMonth() + count, 1);
  }

  function monthLabel(date) {
    return date.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  }

  function weekdayLabels() {
    var base = new Date(2024, 0, 1); // Monday
    var labels = [];
    for (var i = 0; i < 7; i += 1) {
      labels.push(new Date(base.getTime() + i * DAY_MS).toLocaleDateString(locale(), { weekday: 'short' }));
    }
    return labels;
  }

  function isUnavailable(iso, ranges) {
    for (var i = 0; i < ranges.length; i += 1) {
      if (iso >= ranges[i].start && iso < ranges[i].end) return true;
    }
    return false;
  }

  function renderMonth(monthDate, ranges) {
    var month = document.createElement('section');
    month.className = 'availability-month';
    month.setAttribute('aria-label', monthLabel(monthDate));

    var title = document.createElement('h4');
    title.textContent = monthLabel(monthDate);
    month.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'availability-grid';

    weekdayLabels().forEach(function (label) {
      var day = document.createElement('div');
      day.className = 'availability-weekday';
      day.textContent = label;
      grid.appendChild(day);
    });

    var firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    var daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    var offset = (firstDay.getDay() + 6) % 7;

    for (var blank = 0; blank < offset; blank += 1) {
      var spacer = document.createElement('span');
      spacer.className = 'availability-day availability-day-empty';
      grid.appendChild(spacer);
    }

    for (var dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
      var current = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayNumber);
      var currentISO = isoDate(current);
      var dayCell = document.createElement('span');
      var unavailable = isUnavailable(currentISO, ranges);
      dayCell.className = unavailable ? 'availability-day is-unavailable' : 'availability-day';
      dayCell.textContent = String(dayNumber);
      if (unavailable) {
        dayCell.setAttribute('aria-label', currentISO + ' ' + text('unavailable'));
        dayCell.title = text('unavailable');
      }
      grid.appendChild(dayCell);
    }

    month.appendChild(grid);
    return month;
  }

  function formatGeneratedAt(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(locale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderCalendar(widget, state) {
    var body = widget.querySelector('[data-availability-body]');
    if (!body) return;

    body.innerHTML = '';

    var feedCount = Number(state.data.feedCount || 0);
    var ranges = Array.isArray(state.data.unavailable) ? state.data.unavailable : [];

    if (!feedCount) {
      var setup = document.createElement('p');
      setup.className = 'availability-message';
      setup.textContent = text('setup');
      body.appendChild(setup);
      return;
    }

    var controls = document.createElement('div');
    controls.className = 'availability-controls';

    var previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'availability-nav-button';
    previous.setAttribute('aria-label', text('previous'));
    previous.textContent = '<';
    previous.disabled = state.offset <= 0;

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'availability-nav-button';
    next.setAttribute('aria-label', text('next'));
    next.textContent = '>';

    var title = document.createElement('p');
    title.className = 'availability-range-title';
    title.textContent = monthLabel(addMonths(state.baseMonth, state.offset)) + ' / ' + monthLabel(addMonths(state.baseMonth, state.offset + 1));

    previous.addEventListener('click', function () {
      state.offset = Math.max(0, state.offset - 1);
      renderCalendar(widget, state);
    });

    next.addEventListener('click', function () {
      state.offset += 1;
      renderCalendar(widget, state);
    });

    controls.appendChild(previous);
    controls.appendChild(title);
    controls.appendChild(next);
    body.appendChild(controls);

    var months = document.createElement('div');
    months.className = 'availability-months';
    months.appendChild(renderMonth(addMonths(state.baseMonth, state.offset), ranges));
    months.appendChild(renderMonth(addMonths(state.baseMonth, state.offset + 1), ranges));
    body.appendChild(months);

    var footer = document.createElement('div');
    footer.className = 'availability-footer';

    var legend = document.createElement('span');
    legend.className = 'availability-legend';
    legend.innerHTML = '<span class="availability-swatch" aria-hidden="true"></span>' + text('unavailable');
    footer.appendChild(legend);

    if (!ranges.length) {
      var empty = document.createElement('span');
      empty.textContent = text('empty');
      footer.appendChild(empty);
    }

    var generatedAt = formatGeneratedAt(state.data.generatedAt);
    if (generatedAt) {
      var updated = document.createElement('span');
      updated.textContent = text('updated') + ': ' + generatedAt;
      footer.appendChild(updated);
    }

    body.appendChild(footer);
  }

  function initWidget(widget) {
    var body = widget.querySelector('[data-availability-body]');
    if (!body) return;

    body.textContent = text('loading');

    var today = new Date();
    var state = {
      baseMonth: new Date(today.getFullYear(), today.getMonth(), 1),
      offset: 0,
      data: null
    };

    fetch(widget.getAttribute('data-availability-url'), { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('availability request failed');
        return response.json();
      })
      .then(function (data) {
        state.data = data;
        renderCalendar(widget, state);
      })
      .catch(function () {
        body.innerHTML = '';
        var error = document.createElement('p');
        error.className = 'availability-message';
        error.textContent = text('error');
        body.appendChild(error);
      });

    document.addEventListener('i18n:changed', function () {
      if (state.data) renderCalendar(widget, state);
    });
  }

  function init() {
    var widgets = document.querySelectorAll('[data-availability-url]');
    for (var i = 0; i < widgets.length; i += 1) {
      initWidget(widgets[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
