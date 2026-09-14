/* Страница «Художник»: широкий снимок не обрезаем, а даём ему больше ширины.
   Вынесено из about.html отдельным файлом: встроенные скрипты запрещены
   политикой безопасности (script-src 'self'). */
(() => {
  const image = document.querySelector('.about-portrait img');
  const hero = document.querySelector('.about-hero');
  if (!image || !hero) return;
  const fitLayout = () => hero.classList.toggle('wide-portrait', image.naturalWidth > image.naturalHeight * 1.2);
  image.addEventListener('load', fitLayout);
  if (image.complete && image.naturalWidth) fitLayout();
})();
