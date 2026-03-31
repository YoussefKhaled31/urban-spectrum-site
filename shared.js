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
        async leave(data) {
          data.current.container.classList.add('fade-out');
          await new Promise(resolve => setTimeout(resolve, 260));
        },
        enter(data) {
          data.next.container.classList.add('fade-in');
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        },
        once(data) {
          data.next.container.classList.add('fade-in');
        }
      }]
    });

    window.barba.hooks.afterEnter((data) => {
      window.UrbanBarba.closeMobileNav();
      runPageInit(data.next.namespace);
    });
  });
})();
