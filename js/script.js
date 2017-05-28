import styles from '../sass/style.scss' //this works with webpack...
import leaflet_styles from '../node_modules/leaflet/dist/leaflet.css'
import 'leaflet-providers'

const L = require('leaflet'); // ...and this

const map = L.map('map', {
  zoomSnap: 0.5,
  zoomDelta: 0.5,
});

map.setView([36.7783, -119.4179], 4);
L.tileLayer.provider('CartoDB.DarkMatter').addTo(map);

console.log('Hello world!');
