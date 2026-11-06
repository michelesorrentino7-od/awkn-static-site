(function () {
  var menuButtons = document.querySelectorAll(".header__mobile__hamburger");
  var drawer = document.querySelector("header-drawer");
  var closeButtons = document.querySelectorAll(".drawer__close");

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    menuButtons.forEach(function (button) {
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  menuButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      setMenu(true);
    });
  });

  closeButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  document.querySelectorAll("[class*='video-slider-video'] video").forEach(function (video) {
    video.controls = false;
    video.addEventListener("click", function () {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });
  });
})();
