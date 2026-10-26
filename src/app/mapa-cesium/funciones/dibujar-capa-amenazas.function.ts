import { CustomDataSource } from 'cesium';
import { anadirElipse } from './anadir-elipse.function';
import { anadirPoligono } from './anadir-poligono.function';
import { anadirPunto } from './anadir-punto.function';

/** Capa Amenazas: zona hostil, kill box, sombra de radar, alcance del SAM y dianas. */
export function dibujarCapaAmenazas(capa: CustomDataSource): void {
  // anadirPoligono(capa, nombre, color, [[longitud, latitud], ...] una pareja por esquina)
  anadirPoligono(capa, 'ZONA HOSTIL', '#e8504a', [[0.0, 40.6], [1.8, 40.6], [1.8, 38.6], [0.9, 38.6], [0.3, 39.4]]);
  anadirPoligono(capa, 'KILL BOX 34', '#c46ad8', [[0.1, 39.65], [0.5, 39.65], [0.5, 40.05], [0.1, 40.05]]);
  anadirPoligono(capa, 'SOMBRA RADAR EWR-1', '#8a9aa8', [[-1.7, 38.5], [-0.9, 39.1], [-0.8, 38.9], [-1.4, 38.3]]);

  // Círculo del SAM: es una elipse con los dos semiejes iguales (24 NM)
  anadirElipse(capa, 'SAM-1 · 24 NM', 0.55, 39.3, 24, 24, 0, '#e8504a');

  // anadirPunto(capa, nombre, longitud, latitud, color)
  anadirPunto(capa, 'TGT-01', 0.3, 39.85, '#e8504a');
  anadirPunto(capa, 'TGT-02', 1.2, 40.1, '#e8504a');
  anadirPunto(capa, 'TGT-03', 1.1, 39.0, '#e8504a');
}
