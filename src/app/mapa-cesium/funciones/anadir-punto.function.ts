import { Cartesian3, Color, CustomDataSource } from 'cesium';
import { crearEtiqueta } from './crear-etiqueta.function';

/** Dibuja un punto (una diana, un punto de la ruta...) con su nombre. */
export function anadirPunto(capa: CustomDataSource, nombre: string, longitud: number, latitud: number, colorCss: string): void {
  const color = Color.fromCssColorString(colorCss);
  capa.entities.add({
    name: nombre,
    position: Cartesian3.fromDegrees(longitud, latitud),
    // Un círculo de 10 píxeles con borde blanco
    point: { color, outlineColor: Color.WHITE, outlineWidth: 1, pixelSize: 10 },
    label: crearEtiqueta(nombre, color),
  });
}
