import { Cartesian3, Color, CustomDataSource } from 'cesium';
import { anadirPunto } from './anadir-punto.function';

/** Capa Rutas: la línea azul y sus puntos con nombre. */
export function dibujarCapaRutas(capa: CustomDataSource): void {
  // La línea: una pareja [longitud, latitud] por punto, en orden de recorrido
  capa.entities.add({
    name: 'Ruta B',
    polyline: {
      material: Color.fromCssColorString('#3fb8e8'),
      positions: Cartesian3.fromDegreesArray([
        -1.5, 38.0,   // BASE ALFA
        -1.2, 38.45,  // WP1
        -1.0, 38.9,   // VALLE
        -0.9, 39.35,  // PUSH
        -0.4, 40.0,   // IP ÁGUILA
        0.3, 39.85,   // TGT-01
      ]),
      width: 4,
    },
  });

  // Los puntos con su nombre (mismas coordenadas que la línea)
  anadirPunto(capa, 'BASE ALFA', -1.5, 38.0, '#3fb8e8');
  anadirPunto(capa, 'WP1', -1.2, 38.45, '#3fb8e8');
  anadirPunto(capa, 'VALLE', -1.0, 38.9, '#3fb8e8');
  anadirPunto(capa, 'PUSH', -0.9, 39.35, '#3fb8e8');
  anadirPunto(capa, 'IP ÁGUILA', -0.4, 40.0, '#3fb8e8');
  anadirPunto(capa, 'TGT-01', 0.3, 39.85, '#3fb8e8');
}
