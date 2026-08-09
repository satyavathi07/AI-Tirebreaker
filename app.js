import { createRouter } from './router.js';
import { renderHome } from './components/Home.js';
import { renderSavedPage } from './components/SavedPage.js';

const appRoot = document.getElementById('app');

const routes = {
  '#/': () => renderHome(appRoot, router),
  '#/saved': () => renderSavedPage(appRoot, router),
};

const router = createRouter(routes, () => routes['#/']());
router.init();
