import { JulianDate } from 'cesium';
import { INICIO_MISION } from '../models/inicio-mision.const';

/** Convierte "minutos desde el inicio de la misión" en una hora de Cesium. */
export function calcularHoraMision(minutosDesdeInicio: number): JulianDate {
  return JulianDate.addMinutes(INICIO_MISION, minutosDesdeInicio, new JulianDate());
}
