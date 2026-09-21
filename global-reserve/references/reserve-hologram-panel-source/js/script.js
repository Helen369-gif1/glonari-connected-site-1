/**
 * Масштабирует холст 1920x1080 под ширину контейнера,
 * сохраняя точное соответствие Figma при ширине >= 1920px (scale = 1).
 */
(function () {
  var STAGE_WIDTH = 1920;

  var outer = document.querySelector('.stage-outer');
  var stage = document.getElementById('stage');

  if (!outer || !stage) return;

  function applyScale() {
    var scale = outer.clientWidth / STAGE_WIDTH;
    stage.style.transform = 'scale(' + scale + ')';
  }

  window.addEventListener('resize', applyScale);
  window.addEventListener('load', applyScale);
  applyScale();
})();
