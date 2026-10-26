import { ClockRange, Viewer } from 'cesium';
import { FIN_MISION } from '../models/fin-mision.const';
import { INICIO_MISION } from '../models/inicio-mision.const';
import { LineaTiempoConFranjas } from '../models/linea-tiempo-con-franjas.interface';
import { calcularHoraMision } from './calcular-hora-mision.function';

/** Configura el reloj de Cesium (quien manda la hora) y la barra de línea de tiempo que lo enseña. */
export function configurarRelojMision(visor: Viewer): void {
  visor.clock.startTime = INICIO_MISION.clone();
  visor.clock.stopTime = FIN_MISION.clone();
  visor.clock.currentTime = INICIO_MISION.clone();
  visor.clock.clockRange = ClockRange.LOOP_STOP; // al llegar al final vuelve al principio
  visor.clock.multiplier = 30; // 30 segundos simulados por cada segundo real: la misión dura 40 s
  visor.clock.shouldAnimate = true; // arranca ya en marcha (false = esperar al play)

  // Ajusta la barra para que enseñe justo la misión
  visor.timeline?.zoomTo(INICIO_MISION, FIN_MISION);

  // Franja roja en la barra: el tramo final, dentro de la zona hostil (10:41 a 10:45)
  const lineaTiempo = visor.timeline as unknown as LineaTiempoConFranjas | undefined;
  const franjaAmenaza = lineaTiempo?.addHighlightRange('#e8504a', 8, 0);
  franjaAmenaza?.setRange(calcularHoraMision(16), calcularHoraMision(20));
}
