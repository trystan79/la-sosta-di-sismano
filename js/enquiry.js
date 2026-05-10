(function () {
  const form = document.getElementById('enquiry-form');
  if (!form) return;

  const checkin = form.querySelector('#enq-checkin');
  const checkout = form.querySelector('#enq-checkout');
  const guests = form.querySelector('#enq-guests');
  const nameInput = form.querySelector('#enq-name');
  const message = form.querySelector('#enq-message');
  const buttons = form.querySelectorAll('.btn-enquire');

  const today = new Date().toISOString().split('T')[0];
  checkin.min = today;
  checkout.min = today;

  function fmtDate(value) {
    if (!value) return '';
    const lang = (document.documentElement.lang || 'en').toLowerCase();
    const locale = lang.startsWith('it') ? 'it-IT' : 'en-GB';
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function nights() {
    if (!checkin.value || !checkout.value) return 0;
    const a = new Date(checkin.value);
    const b = new Date(checkout.value);
    const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  function isItalian() {
    return (document.documentElement.lang || 'en').toLowerCase().startsWith('it');
  }

  function buildSubject() {
    const it = isItalian();
    const ci = checkin.value ? fmtDate(checkin.value) : (it ? 'date da confermare' : 'dates TBC');
    const co = checkout.value ? fmtDate(checkout.value) : (it ? 'date da confermare' : 'dates TBC');
    return it
      ? `Richiesta La Sosta di Sismano — ${ci} → ${co}`
      : `La Sosta di Sismano enquiry — ${ci} → ${co}`;
  }

  function buildBody() {
    const it = isItalian();
    const ci = checkin.value ? fmtDate(checkin.value) : (it ? 'da confermare' : 'TBC');
    const co = checkout.value ? fmtDate(checkout.value) : (it ? 'da confermare' : 'TBC');
    const n = nights();
    const g = guests.value || '2';
    const name = (nameInput.value || '').trim();
    const msg = (message.value || '').trim();

    if (it) {
      const lines = [
        `Salve, vorrei avere informazioni per un soggiorno a La Sosta di Sismano.`,
        ``,
        `Check-in: ${ci}`,
        `Check-out: ${co}`,
        n ? `Notti: ${n}` : null,
        `Ospiti: ${g}`,
        name ? `Nome: ${name}` : null,
        msg ? `` : null,
        msg ? `Messaggio: ${msg}` : null,
        ``,
        `Grazie!`
      ].filter(Boolean);
      return lines.join('\n');
    }

    const lines = [
      `Hi, I'd like to enquire about a stay at La Sosta di Sismano.`,
      ``,
      `Check-in: ${ci}`,
      `Check-out: ${co}`,
      n ? `Nights: ${n}` : null,
      `Guests: ${g}`,
      name ? `Name: ${name}` : null,
      msg ? `` : null,
      msg ? `Message: ${msg}` : null,
      ``,
      `Thanks!`
    ].filter(Boolean);
    return lines.join('\n');
  }

  function updateLinks() {
    const subject = buildSubject();
    const body = buildBody();
    const waText = `${subject}\n\n${body}`;

    buttons.forEach(function (btn) {
      const action = btn.dataset.action;
      if (action === 'whatsapp') {
        const phone = btn.dataset.phone;
        btn.href = `https://wa.me/${phone}?text=${encodeURIComponent(waText)}`;
      } else if (action === 'email') {
        const email = btn.dataset.email;
        btn.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    });
  }

  function validate(e) {
    if (!checkin.value || !checkout.value || !nameInput.value.trim()) {
      e.preventDefault();
      const it = isItalian();
      alert(it
        ? 'Inserisci le date e il tuo nome prima di inviare.'
        : 'Please fill in your dates and name before sending.');
      return false;
    }
    if (nights() <= 0) {
      e.preventDefault();
      const it = isItalian();
      alert(it
        ? 'Il check-out deve essere dopo il check-in.'
        : 'Check-out must be after check-in.');
      return false;
    }
    return true;
  }

  ['input', 'change'].forEach(function (evt) {
    form.addEventListener(evt, updateLinks);
  });
  document.addEventListener('languagechange', updateLinks);
  // Re-render after i18n switch (custom event dispatched by i18n.js if present, otherwise harmless)
  document.addEventListener('i18n:changed', updateLinks);

  buttons.forEach(function (btn) {
    btn.addEventListener('click', validate);
  });

  updateLinks();
})();
