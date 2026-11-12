if (new URLSearchParams(location.search).get('view') === 'classic') import('./classic.js'); else import('./world.js');
