(function () {
  'use strict';

  function getDefaultLang() {
    var stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'it') return stored;
    return (navigator.language || '').substring(0, 2) === 'it' ? 'it' : 'en';
  }

  function applyLang(lang) {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    var t = translations[lang];
    if (!t) return;

    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (t[key] !== undefined) {
        els[i].innerHTML = t[key];
      }
    }

    var phs = document.querySelectorAll('[data-i18n-placeholder]');
    for (var p = 0; p < phs.length; p++) {
      var pkey = phs[p].getAttribute('data-i18n-placeholder');
      if (t[pkey] !== undefined) {
        phs[p].setAttribute('placeholder', t[pkey]);
      }
    }

    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: lang } }));

    // Update flag toggle active states
    var flags = document.querySelectorAll('.lang-btn');
    for (var j = 0; j < flags.length; j++) {
      if (flags[j].getAttribute('data-lang') === lang) {
        flags[j].classList.add('lang-active');
      } else {
        flags[j].classList.remove('lang-active');
      }
    }
  }

  function init() {
    var lang = getDefaultLang();

    // Bind flag buttons
    var flags = document.querySelectorAll('.lang-btn');
    for (var i = 0; i < flags.length; i++) {
      flags[i].addEventListener('click', function () {
        applyLang(this.getAttribute('data-lang'));
      });
    }

    applyLang(lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
