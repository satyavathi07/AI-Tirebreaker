export function createRouter(routes, fallback) {
  function renderRoute() {
    const hash = window.location.hash || '#/';
    const route = routes[hash] || fallback;
    route();
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function init() {
    window.addEventListener('hashchange', renderRoute);
    renderRoute();
  }

  return {
    init,
    navigate,
  };
}
