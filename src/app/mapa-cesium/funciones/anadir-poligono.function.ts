import { Cartesian3, Color, CustomDataSource } from 'cesium';
import { crearEtiqueta } from './crear-etiqueta.function';

/** Dibuja una zona con esquinas (una pareja [longitud, latitud] por esquina) y su nombre. */
export function anadirPoligono(capa: CustomDataSource, nombre: string, colorCss: string, vertices: [number, number][]): void {
  const color = Color.fromCssColorString(colorCss);
  // El texto se coloca en el centro: la media de las esquinas
  const longitudCentro = vertices.reduce((suma, [longitud]) => suma + longitud, 0) / vertices.length;
  const latitudCentro = vertices.reduce((suma, [, latitud]) => suma + latitud, 0) / vertices.length;
  capa.entities.add({
    name: nombre,
    position: Cartesian3.fromDegrees(longitudCentro, latitudCentro),
    polygon: {
      hierarchy: Cartesian3.fromDegreesArray(vertices.flat()),
      material: color.withAlpha(0.15),
      outline: true,
      outlineColor: color,
    },
    label: crearEtiqueta(nombre, color),
  });
}
