import { Cartesian3, Color, CustomDataSource, Math as CesiumMath } from 'cesium';
import { crearEtiqueta } from './crear-etiqueta.function';

/** Dibuja un óvalo (o un círculo, si los dos semiejes son iguales) con su nombre. */
export function anadirElipse(
  capa: CustomDataSource, nombre: string, longitud: number, latitud: number,
  semiejeMayorMillas: number, semiejeMenorMillas: number, giroGrados: number, colorCss: string,
): void {
  const color = Color.fromCssColorString(colorCss);
  const METROS_POR_MILLA_NAUTICA = 1852;
  capa.entities.add({
    name: nombre,
    position: Cartesian3.fromDegrees(longitud, latitud),
    // La forma: relleno transparente y borde del color
    ellipse: {
      material: color.withAlpha(0.12),
      outline: true,
      outlineColor: color,
      rotation: CesiumMath.toRadians(giroGrados),
      semiMajorAxis: semiejeMayorMillas * METROS_POR_MILLA_NAUTICA,
      semiMinorAxis: semiejeMenorMillas * METROS_POR_MILLA_NAUTICA,
    },
    // El texto que aparece sobre la forma
    label: crearEtiqueta(nombre, color),
  });
}
