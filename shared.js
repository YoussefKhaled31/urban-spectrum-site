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
          if (wrapper) wrapper.style.height = `${data.current.container.offsetHeight}px`;
        },
        async leave(data) {
          data.current.container.classList.add('is-transitioning', 'fade-out');
          await new Promise(resolve => setTimeout(resolve, 260));
        },
        enter(data) {
          window.scrollTo(0, 0);
          data.next.container.classList.add('fade-in');
        },
        once(data) {
          window.scrollTo(0, 0);
          data.next.container.classList.add('fade-in');
        },
        afterEnter(data) {
          data.next.container.classList.remove('is-transitioning');
          const wrapper = data.next.container.parentNode;
          if (wrapper) wrapper.style.height = '';
        }
      }]
    });

    window.barba.hooks.enter(() => {
      window.scrollTo(0, 0);
    });

    window.barba.hooks.afterEnter((data) => {
      data.current?.container?.classList.remove('is-transitioning', 'fade-out');
      window.UrbanBarba.closeMobileNav();
      runPageInit(data.next.namespace);
    });
  });
})();
