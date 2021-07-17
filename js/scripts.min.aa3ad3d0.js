$(function () {
  const media = document.getElementById('jsAudio');
  const played = false;

  document.addEventListener('mousemove', () => {
    if (!played) {
      media.muted = false;
      media.play();
    }
  });
});
//# sourceMappingURL=scripts.min.js.map
