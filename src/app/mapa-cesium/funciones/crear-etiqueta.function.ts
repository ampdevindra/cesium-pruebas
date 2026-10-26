import { Cartesian2, Color, LabelGraphics, LabelStyle, VerticalOrigin } from 'cesium';

/** El texto que aparece sobre una forma del mapa (zona, punto, avión...). */
export function crearEtiqueta(texto: string, color: Color): LabelGraphics.ConstructorOptions {
  return {
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    fillColor: color.brighten(0.4, new Color()),
    font: '12px sans-serif',
    outlineColor: Color.BLACK,
    outlineWidth: 3,
    pixelOffset: new Cartesian2(0, -12),
    style: LabelStyle.FILL_AND_OUTLINE,
    text: texto,
    verticalOrigin: VerticalOrigin.BOTTOM,
  };
}
