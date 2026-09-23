// Места под фото: если файл из img/ есть — показываем его и прячем заглушку,
// если файла нет — убираем картинку, чтобы не было значка «битого» фото.
(function () {
  document.querySelectorAll('.photo__img').forEach(function (img) {
    const slot = img.closest('.photo');
    const ok = function () { if (slot) slot.classList.add('has-img'); };
    const fail = function () { img.remove(); };
    if (img.complete) {
      if (img.naturalWidth > 0) ok(); else fail();
    } else {
      img.addEventListener('load', ok);
      img.addEventListener('error', fail);
    }
  });
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
