/* Global Reserve — Site shell behaviour.
   Controls only: mobile navigation, registration dialog, login dialog,
   placeholder-link prevention. Does not read from or depend on js/scrub.js
   or any other screen-specific script. */

(function () {
  'use strict';

  var hamburger = document.querySelector('.site-header__hamburger');
  var mobileMenu = document.getElementById('site-mobile-menu');

  var scrollLockCount = 0;

  function lockScroll() {
    if (scrollLockCount === 0) {
      var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + 'px';
      }
    }
    scrollLockCount++;
  }

  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  /* ---------- Mobile menu ---------- */

  function openMobileMenu() {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.hidden = false;
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close menu');
  }

  function closeMobileMenu(returnFocusToHamburger) {
    if (!mobileMenu || !hamburger) return;
    if (mobileMenu.hidden) return;
    mobileMenu.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    if (returnFocusToHamburger) {
      hamburger.focus();
    }
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      if (mobileMenu.hidden) {
        openMobileMenu();
      } else {
        closeMobileMenu(false);
      }
    });

    document.addEventListener('click', function (e) {
      if (mobileMenu.hidden) return;
      if (mobileMenu.contains(e.target) || hamburger.contains(e.target)) return;
      closeMobileMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.hidden) {
        closeMobileMenu(true);
      }
    });

    var mobileMenuLinks = mobileMenu.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < mobileMenuLinks.length; i++) {
      mobileMenuLinks[i].addEventListener('click', function () {
        closeMobileMenu(false);
      });
    }
  }

  /* ---------- Dialogs ---------- */

  function resetDialog(dialog) {
    var form = dialog.querySelector('form');
    if (form) {
      form.reset();
    }
    var errors = dialog.querySelectorAll('.site-dialog__error');
    for (var i = 0; i < errors.length; i++) {
      errors[i].hidden = true;
    }
    var results = dialog.querySelectorAll('.site-dialog__result');
    for (var j = 0; j < results.length; j++) {
      results[j].hidden = true;
    }
    var invalidFields = dialog.querySelectorAll('[aria-invalid="true"]');
    for (var k = 0; k < invalidFields.length; k++) {
      invalidFields[k].removeAttribute('aria-invalid');
    }
  }

  function openDialog(dialog, opener) {
    if (!dialog) return;
    dialog._grOpener = opener || null;
    resetDialog(dialog);
    lockScroll();
    dialog.showModal();
    var firstField = dialog.querySelector('input, textarea, select');
    if (firstField) {
      firstField.focus();
    }
  }

  function wireDialog(dialog) {
    if (!dialog) return;

    dialog.addEventListener('close', function () {
      unlockScroll();
      resetDialog(dialog);
      if (dialog._grOpener) {
        dialog._grOpener.focus();
        dialog._grOpener = null;
      }
    });

    dialog.addEventListener('click', function (e) {
      var rect = dialog.getBoundingClientRect();
      var clickedInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!clickedInside) {
        dialog.close();
      }
    });

    var closeButtons = dialog.querySelectorAll('[data-close-dialog]');
    for (var i = 0; i < closeButtons.length; i++) {
      closeButtons[i].addEventListener('click', function () {
        dialog.close();
      });
    }
  }

  var registerDialog = document.getElementById('register-dialog');
  var loginDialog = document.getElementById('login-dialog');

  wireDialog(registerDialog);
  wireDialog(loginDialog);

  var openDialogButtons = document.querySelectorAll('[data-open-dialog]');
  for (var b = 0; b < openDialogButtons.length; b++) {
    openDialogButtons[b].addEventListener('click', function (e) {
      var targetId = e.currentTarget.getAttribute('data-open-dialog');
      var target = document.getElementById(targetId);
      var openedFromMobileMenu = !!(mobileMenu && mobileMenu.contains(e.currentTarget));
      if (openedFromMobileMenu) {
        closeMobileMenu(false);
      }
      openDialog(target, openedFromMobileMenu ? hamburger : e.currentTarget);
    });
  }

  /* ---------- Registration form ---------- */

  if (registerDialog) {
    var registerForm = document.getElementById('register-form');
    var registerPassword = document.getElementById('register-password');
    var registerConfirmPassword = document.getElementById('register-confirm-password');
    var registerPasswordError = document.getElementById('register-password-error');
    var registerResult = document.getElementById('register-result');

    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!registerForm.reportValidity()) {
        return;
      }

      if (registerPassword.value !== registerConfirmPassword.value) {
        registerPasswordError.hidden = false;
        registerConfirmPassword.setAttribute('aria-invalid', 'true');
        registerConfirmPassword.focus();
        return;
      }

      registerPasswordError.hidden = true;
      registerConfirmPassword.removeAttribute('aria-invalid');

      // TODO: wire up real registration endpoint
      // No network request, no storage (cookies/localStorage/sessionStorage/URL),
      // and no account is created — validation only.
      registerResult.hidden = false;
    });

    registerConfirmPassword.addEventListener('input', function () {
      if (!registerPasswordError.hidden && registerPassword.value === registerConfirmPassword.value) {
        registerPasswordError.hidden = true;
        registerConfirmPassword.removeAttribute('aria-invalid');
      }
    });
  }

  /* ---------- Login form ---------- */

  if (loginDialog) {
    var loginForm = document.getElementById('login-form');
    var loginResult = document.getElementById('login-result');

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!loginForm.reportValidity()) {
        return;
      }

      // TODO: wire up real authentication endpoint
      // No network request and no data stored — demo-only inline result.
      loginResult.hidden = false;
    });
  }

  /* ---------- Placeholder links ---------- */

  var placeholderLinks = document.querySelectorAll('.placeholder-link');
  for (var p = 0; p < placeholderLinks.length; p++) {
    placeholderLinks[p].addEventListener('click', function (e) {
      e.preventDefault();
    });
  }
})();
