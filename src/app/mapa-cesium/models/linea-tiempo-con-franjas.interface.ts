import { JulianDate } from 'cesium';

/**
 * Cesium tiene este método en la línea de tiempo pero no lo declara en sus tipos de TypeScript,
 * así que lo describimos aquí para poder usarlo con tipos.
 */
export interface LineaTiempoConFranjas {
  addHighlightRange(color: string, alturaPx: number, base: number): { setRange(inicio: JulianDate, fin: JulianDate): void };
}
