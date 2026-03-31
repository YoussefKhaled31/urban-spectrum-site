(function(){
  const PAGE_INIT = {
    home() {
      if (typeof window.initHomePage === 'function') {
        window.initHomePage();
      }
    },
    listings() {
      if (typeof window.initListingsPage === 'function') {
        window.initListingsPage();
      }
    }
  };

  function getNamespace() {
    const container = document.querySelector('[data-barba="container"]');
    return container ? container.dataset.barbaNamespace : '';
  }

  function scrollToPendingSection() {
    const pendingSection = sessionStorage.getItem('urbanPendingSection');
    if (!pendingSection) return;
    sessionStorage.removeItem('urbanPendingSection');
    const target = document.getElementById(pendingSection);
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  }

  function runPageInit(namespace) {
    const init = PAGE_INIT[namespace || getNamespace()];
    if (init) init();
    scrollToPendingSection();
    if (window.lucide) window.lucide.createIcons();
  }

  window.UrbanBarba = {
    goToSection(sectionId) {
      sessionStorage.setItem('urbanPendingSection', sectionId);
      if (window.barba) {
        window.barba.go('index.html');
      } else {
        window.location.href = 'index.html';
      }
    },
    openAuthOnHome() {
      sessionStorage.setItem('urbanOpenAuthOnLoad', '1');
      if (window.barba) {
        window.barba.go('index.html');
      } else {
        window.location.href = 'index.html';
      }
    },
    closeMobileNav() {
      const mobileNav = document.getElementById('mobNav');
      if (mobileNav) mobileNav.classList.remove('open');
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    runPageInit();

    if (!window.barba) return;

    window.barba.init({
      prevent: ({ el }) => {
        const href = el?.getAttribute('href') || '';
        return href.includes('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http');
      },
      transitions: [{
        name: 'urban-cross-fade',
        beforeLeave(data) {
          const wrapper = data.current.container.parentNode;
          if (wrapper) {
            wrapper.style.position = 'relative';
            wrapper.style.height = `${data.current.container.offsetHeight}px`;
          }
          data.current.container.classList.add('is-transitioning');
        },
        async leave(data) {
          data.current.container.classList.add('fade-out');
          await new Promise(resolve => setTimeout(resolve, 260));
        },
        beforeEnter(data) {
          data.next.container.classList.add('is-transitioning');
        },
        enter(data) {
          data.next.container.classList.add('fade-in');
        },
        once(data) {
          data.next.container.classList.add('fade-in');
        },
        afterEnter(data) {
          data.current.container.classList.remove('is-transitioning', 'fade-out');
          data.current.container.style.position = '';
          data.current.container.style.top = '';
          data.current.container.style.left = '';
          data.current.container.style.right = '';
          data.current.container.style.bottom = '';
          data.current.container.style.inset = '';
          data.current.container.style.width = '';
          data.current.container.style.height = '';
          data.current.container.style.display = '';

          data.next.container.classList.remove('is-transitioning');
          data.next.container.style.position = '';
          data.next.container.style.top = '';
          data.next.container.style.left = '';
          data.next.container.style.right = '';
          data.next.container.style.bottom = '';
          data.next.container.style.inset = '';
          data.next.container.style.width = '';
          data.next.container.style.height = '';
          data.next.container.style.display = '';

          const wrapper = data.next.container.parentNode;
          if (wrapper) {
            wrapper.style.height = '';
            wrapper.style.position = '';
          }
        }
      }]
    });

    window.barba.hooks.enter(() => {
      window.scrollTo(0, 0);
    });

    window.barba.hooks.afterEnter((data) => {
      window.UrbanBarba.closeMobileNav();
      runPageInit(data.next.namespace);
    });
  });
})();
