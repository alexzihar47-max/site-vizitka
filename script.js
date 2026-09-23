// Прелоадер: держим каску минимум MIN_VISIBLE_MS, чтобы экран не мигал,
// и снимаем не позже MAX_WAIT_MS, даже если какой-то ресурс завис.
(function () {
  const root = document.documentElement;
  if (!root.classList.contains('is-loading')) return;

  const MIN_VISIBLE_MS = 900;
  const MAX_WAIT_MS = 4000;
  const FADE_MS = 450;
  let hidden = false;

  function hide() {
    if (hidden) return;
    hidden = true;
    root.classList.add('preloader-hide');
    setTimeout(function () {
      root.classList.remove('is-loading', 'preloader-hide');
    }, FADE_MS);
  }

  function onLoad() {
    setTimeout(hide, Math.max(0, MIN_VISIBLE_MS - performance.now()));
  }

  if (document.readyState === 'complete') {
    onLoad();
  } else {
    window.addEventListener('load', onLoad);
  }
  setTimeout(hide, MAX_WAIT_MS);
})();

document.addEventListener('DOMContentLoaded', function () {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const form = document.getElementById('requestForm');
  const submitBtn = document.getElementById('submitBtn');
  const resultEl = document.getElementById('formResult');

  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbx95IK1qzW2LIgArSapuitUUtnW2rdqaqtQQdEniaLhxntVgdwAGLoy6t6kMV_8BU2w/exec';

  if (!form) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();

    if (!name || !phone) {
      showResult('Пожалуйста, заполните имя и телефон.', 'error');
      return;
    }

    setLoading(true);
    clearResult();

    try {
      await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, message }),
      });

      // В режиме no-cors ответ сервера непрозрачен для JS,
      // поэтому считаем отправку успешной, если запрос не выбросил ошибку.
      showResult('Заявка отправлена, мы свяжемся с вами', 'success');
      form.reset();
    } catch (error) {
      showResult('Не удалось отправить заявку. Попробуйте ещё раз.', 'error');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.querySelector('.btn__text').textContent = isLoading
      ? 'Отправка...'
      : 'Отправить заявку';
  }

  function showResult(text, type) {
    resultEl.textContent = text;
    resultEl.classList.remove('is-success', 'is-error');
    resultEl.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  function clearResult() {
    resultEl.textContent = '';
    resultEl.classList.remove('is-success', 'is-error');
  }
});
