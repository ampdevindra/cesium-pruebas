import { ImageryLayer, OpenStreetMapImageryProvider, UrlTemplateImageryProvider } from 'cesium';
import { FondoMapaId } from '../models/fondo-mapa-id.type';

/**
 * Crea el mapa de fondo. Un fondo es un servidor que da "teselas": cuadraditos de imagen del mapa.
 * {z} es el nivel de zoom, {x} e {y} la posición del cuadradito. Cesium los pide según lo que se ve.
 */
export function crearCapaFondo(fondo: FondoMapaId): ImageryLayer {
  if (fondo === 'cartoSinTexto') return crearCapaDesdeUrl(
    'https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', '© OpenStreetMap © CARTO', ['a', 'b', 'c', 'd']);
  if (fondo === 'cartoConTexto') return crearCapaDesdeUrl(
    'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', '© OpenStreetMap © CARTO', ['a', 'b', 'c', 'd']);
  if (fondo === 'esri') return crearCapaDesdeUrl(
    'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    'Esri, HERE, Garmin, OpenStreetMap contributors', []);

  // Por defecto: OpenStreetMap normal (claro), oscurecido por nosotros y con menos color
  const capa = new ImageryLayer(new OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }));
  capa.brightness = 0.45;
  capa.saturation = 0.3;
  return capa;
}

function crearCapaDesdeUrl(url: string, creditos: string, subdominios: string[]): ImageryLayer {
  return new ImageryLayer(new UrlTemplateImageryProvider({
    credit: creditos, // texto de autoría que Cesium enseña abajo (obligatorio por licencia)
    maximumLevel: 18,
    subdomains: subdominios.length ? subdominios : undefined, // sustituyen a {s} en la url (aquí no se usa)
    url,
  }));
}
