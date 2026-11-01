// src/core/rutas.js
// 🗺️ Enrutador Central de TimeWii · Wellcare Advisor Toolkit

export const RUTAS = {
  inicio: '/',
  time: '#time',
  usa: '#usa',
  english: '#english',
  wellcare: '#wellcare',
  learn: '#learn'
};

export const NAV_LINKS = [
  { id: 'time', key: 'nav_time', label: 'U.S. Time', icon: 'fa-solid fa-clock' },
  { id: 'usa', key: 'nav_usa', label: 'United States', icon: 'fa-solid fa-map-location-dot' },
  { id: 'english', key: 'nav_english', label: 'English Phrases', icon: 'fa-solid fa-comments' },
  { id: 'wellcare', key: 'nav_wellcare', label: 'Wellcare Support', icon: 'fa-solid fa-shield-heart' },
  { id: 'learn', key: 'nav_learn', label: 'Learn & NATO', icon: 'fa-solid fa-graduation-cap' }
];

export default { RUTAS, NAV_LINKS };