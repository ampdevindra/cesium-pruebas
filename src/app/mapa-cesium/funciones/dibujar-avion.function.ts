import {
  CallbackProperty, Cartesian3, Cartographic, Color, CustomDataSource, JulianDate, SampledPositionProperty,
  TimeInterval, TimeIntervalCollection,
} from 'cesium';
import { FIN_MISION } from '../models/fin-mision.const';
import { INICIO_MISION } from '../models/inicio-mision.const';
import { calcularHoraMision } from './calcular-hora-mision.function';
import { crearEtiqueta } from './crear-etiqueta.function';

/** Avión: se mueve solo según la hora del reloj de Cesium. */
export function dibujarAvion(capa: CustomDataSource): void {
  // 1) Dónde está el avión en cada momento: pares (hora, posición).
  //    Entre dos pares Cesium calcula solo las posiciones intermedias en línea recta.
  //    La hora se da en minutos desde el inicio de la misión (10:25).
  const posicion = new SampledPositionProperty();
  posicion.addSample(calcularHoraMision(0), Cartesian3.fromDegrees(-1.5, 38.0)); //  10:25 BASE ALFA
  posicion.addSample(calcularHoraMision(4), Cartesian3.fromDegrees(-1.2, 38.45)); // 10:29 WP1
  posicion.addSample(calcularHoraMision(7), Cartesian3.fromDegrees(-1.0, 38.9)); //  10:32 VALLE
  posicion.addSample(calcularHoraMision(11), Cartesian3.fromDegrees(-0.9, 39.35)); // 10:36 PUSH
  posicion.addSample(calcularHoraMision(16), Cartesian3.fromDegrees(-0.4, 40.0)); //  10:41 IP ÁGUILA
  posicion.addSample(calcularHoraMision(20), Cartesian3.fromDegrees(0.3, 39.85)); //  10:45 TGT-01

  // 2) Hacia dónde mira: el rumbo se recalcula en cada fotograma comparando
  //    dónde está el avión un instante antes y un instante después.
  let ultimoRumbo = 0;
  const giroIcono = new CallbackProperty(tiempo => {
    if (!tiempo) return ultimoRumbo;
    const antes = posicion.getValue(JulianDate.addSeconds(tiempo, -5, new JulianDate()));
    const despues = posicion.getValue(JulianDate.addSeconds(tiempo, 5, new JulianDate()));
    if (!antes || !despues) return ultimoRumbo;
    const puntoAntes = Cartographic.fromCartesian(antes);
    const puntoDespues = Cartographic.fromCartesian(despues);
    const haciaElEste = (puntoDespues.longitude - puntoAntes.longitude) * Math.cos(puntoAntes.latitude);
    const haciaElNorte = puntoDespues.latitude - puntoAntes.latitude;
    const rumbo = Math.atan2(haciaElEste, haciaElNorte); // 0 = norte, sentido horario
    // El dibujo del avión apunta 45° al noreste, y Cesium gira en sentido antihorario
    ultimoRumbo = Math.PI / 4 - rumbo;
    return ultimoRumbo;
  }, false);

  // 3) El avión como elemento del mapa: icono, estela y texto
  capa.entities.add({
    name: 'Avión',
    // Solo existe entre el inicio y el fin de la misión
    availability: new TimeIntervalCollection([new TimeInterval({ start: INICIO_MISION, stop: FIN_MISION })]),
    position: posicion,
    billboard: {
      alignedAxis: Cartesian3.UNIT_Z, // el "arriba" del icono es el norte, también en 3D
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      height: 32,
      image: '/avion.svg', // fichero public/avion.svg
      rotation: giroIcono,
      width: 32,
    },
    // La estela: los últimos 10 minutos recorridos
    path: {
      leadTime: 0,
      material: Color.fromCssColorString('#ffffff').withAlpha(0.6),
      trailTime: 600,
      width: 2,
    },
    label: crearEtiqueta('AVIÓN', Color.WHITE),
  });
}
