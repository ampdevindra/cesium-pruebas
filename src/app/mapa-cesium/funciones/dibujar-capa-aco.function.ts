import { CustomDataSource } from 'cesium';
import { anadirElipse } from './anadir-elipse.function';

/** Capa ACO (espacio aéreo): óvalos amarillo-verdosos (esperas, patrullas) y amarillos (avisos NOTAM). */
export function dibujarCapaAco(capa: CustomDataSource): void {
  // anadirElipse(capa, nombre, longitud, latitud, semieje mayor (NM), semieje menor (NM), giro (grados), color)
  anadirElipse(capa, 'HOLD BRAVO', -1.15, 39.4, 12, 6, 0, '#b8d86b');
  anadirElipse(capa, 'AAR TEXACO · FL290/240', -1.7, 39.0, 30, 8, 0, '#b8d86b');
  anadirElipse(capa, 'CAP ALFA', -0.9, 38.55, 20, 10, 0, '#b8d86b');
  anadirElipse(capa, 'NOTAM A0417', -0.1, 38.3, 10, 10, 0, '#d8b04a');
  anadirElipse(capa, 'NOTAM A0431', 0.3, 37.5, 10, 10, 0, '#d8b04a');
}
