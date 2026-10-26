import { Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, signal, viewChild } from '@angular/core';
import {
  CallbackProperty, Camera, Cartesian2, Cartesian3, Cartographic, ClockRange, Color, CustomDataSource, ImageryLayer, JulianDate,
  LabelStyle, Math as CesiumMath, OpenStreetMapImageryProvider, Rectangle, SampledPositionProperty, SceneMode,
  TimeInterval, TimeIntervalCollection, UrlTemplateImageryProvider, VerticalOrigin, Viewer,
} from 'cesium';
import { FondoMapaId } from './models/fondo-mapa-id.type';
import { LineaTiempoConFranjas } from './models/linea-tiempo-con-franjas.interface';

// Cesium busca aquí sus ficheros auxiliares (los que copia angular.json)
(window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = '/cesium';

@Component({
  selector: 'app-mapa-cesium',
  styleUrl: './mapa-cesium.component.scss',
  templateUrl: './mapa-cesium.component.html',
})
export class MapaCesium implements OnDestroy {
  // El <div #contenedorMapa> del HTML: ahí se mete el mapa de Cesium
  private readonly contenedorMapa = viewChild.required<ElementRef<HTMLDivElement>>('contenedorMapa');
  private readonly ngZone = inject(NgZone);

  // Qué capas están encendidas (el HTML usa esto para pintar el botón como activo)
  protected readonly acoVisible = signal(true);
  protected readonly amenazasVisibles = signal(true);
  protected readonly rutasVisibles = signal(true);
  protected readonly fondoActivo = signal<FondoMapaId>('esri');
  protected readonly logoVisible = signal(true);
  protected readonly modo3d = signal(false);
  protected readonly verOrigen = signal(false);
  protected readonly widgetsVisibles = signal(true);

  // Una "caja" de Cesium por capa. Todo lo que se añada a una caja se enciende o apaga a la vez.
  private readonly capaAco = new CustomDataSource('aco');
  private readonly capaAmenazas = new CustomDataSource('amenazas');
  private readonly capaRutas = new CustomDataSource('rutas');

  // Duración de la misión de ejemplo (hora UTC). El timeline y el reloj de Cesium van de una a otra.
  private readonly inicioMision = JulianDate.fromIso8601('2026-10-23T10:25:00Z');
  private readonly finMision = JulianDate.fromIso8601('2026-10-23T10:45:00Z');

  // El mapa de Cesium, que se crea al arrancar
  private visor?: Viewer;

  constructor() {
    // Espera a que el HTML exista y entonces crea el mapa
    afterNextRender(() => this.ngZone.runOutsideAngular(() => this.crearVisor()));
  }

  // ---------- Qué pasa al pulsar cada botón ----------

  onBotonAcoPulsado(): void {
    this.acoVisible.update(visible => !visible);
    this.capaAco.show = this.acoVisible();
  }

  onBotonAmenazasPulsado(): void {
    this.amenazasVisibles.update(visible => !visible);
    this.capaAmenazas.show = this.amenazasVisibles();
  }

  onBotonRutasPulsado(): void {
    this.rutasVisibles.update(visible => !visible);
    this.capaRutas.show = this.rutasVisibles();
  }

  onBotonFondoOsmPulsado(): void {
    this.cambiarFondo('osm');
  }

  // Cambia el mapa de fondo: quita el que hay y pone el nuevo (el dibujo de zonas y ruta no se toca)
  private cambiarFondo(fondo: FondoMapaId): void {
    this.fondoActivo.set(fondo);
    if (!this.visor) return;
    this.visor.imageryLayers.removeAll();
    this.visor.imageryLayers.add(this.crearCapaFondo(fondo));
  }

  onBotonFondoCartoSinTextoPulsado(): void {
    this.cambiarFondo('cartoSinTexto');
  }

  onBotonFondoCartoConTextoPulsado(): void {
    this.cambiarFondo('cartoConTexto');
  }

  onBotonFondoEsriPulsado(): void {
    this.cambiarFondo('esri');
  }

  onBotonWidgetsPulsado(): void {
    this.widgetsVisibles.update(visibles => !visibles);
    // Al volver a mostrarse, la línea de tiempo tiene que recalcular su ancho
    requestAnimationFrame(() => this.visor?.timeline?.resize());
  }

  onBotonLogoCesiumPulsado(): void {
    this.logoVisible.update(visible => !visible);
  }

  onBotonVerOrigenPulsado(): void {
    this.verOrigen.update(visible => !visible);
  }

  onBotonModoVistaPulsado(): void {
    this.modo3d.update(esModo3d => !esModo3d);
    if (this.modo3d()) this.visor?.scene.morphTo3D(1);
    else this.visor?.scene.morphTo2D(1);
  }

  ngOnDestroy(): void {
    this.visor?.destroy();
  }

  // ---------- Crear el mapa ----------

  private crearVisor(): void {
    // Vista inicial (y la del botón casa): oeste, sur, este, norte en grados.
    // Se fija antes de crear el mapa para que se adapte al tamaño real del recuadro.
    Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(-2.6, 37.3, 2.4, 40.9);
    Camera.DEFAULT_VIEW_FACTOR = 0;

    const visor = new Viewer(this.contenedorMapa().nativeElement, {
      // Widgets de Cesium ACTIVADOS para probarlos (true = se ven, false = se quitan)
      animation: true, // reloj de abajo a la izquierda (play/pausa del tiempo)
      fullscreenButton: true, // botón de pantalla completa (arriba a la derecha)
      homeButton: true, // botón casa: vuelve a la vista inicial de Cesium
      infoBox: true, // ventana con información al pinchar un elemento
      navigationHelpButton: true, // botón "?" con la ayuda de ratón y teclado
      sceneModePicker: true, // selector 2D / 3D / Columbus (el nuestro hace parecido)
      selectionIndicator: true, // marco verde alrededor del elemento pinchado
      timeline: true, // línea de tiempo de abajo
      // Siguen desactivados: necesitan una cuenta (token) de Cesium Ion para funcionar
      baseLayerPicker: false, // selector de mapas de fondo
      geocoder: false, // buscador de lugares
      // Mapa de fondo y modo con el que arranca
      baseLayer: this.crearCapaFondo(this.fondoActivo()),
      sceneMode: SceneMode.SCENE2D,
    });
    this.visor = visor;

    // Registramos las tres capas en el mapa y dibujamos lo que va en cada una
    visor.dataSources.add(this.capaAco);
    visor.dataSources.add(this.capaAmenazas);
    visor.dataSources.add(this.capaRutas);
    this.dibujarCapaAco();
    this.dibujarCapaAmenazas();
    this.dibujarCapaRutas();
    this.dibujarAvion();
    this.configurarRelojMision(visor);
  }

  // Un mapa de fondo es un servidor que da "teselas": cuadraditos de imagen del mapa.
  // {z} es el nivel de zoom, {x} e {y} la posición del cuadradito. Cesium los pide según lo que se ve.
  private crearCapaFondo(fondo: FondoMapaId): ImageryLayer {
    if (fondo === 'cartoSinTexto') return this.crearCapaDesdeUrl(
      'https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', '© OpenStreetMap © CARTO', ['a', 'b', 'c', 'd']);
    if (fondo === 'cartoConTexto') return this.crearCapaDesdeUrl(
      'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', '© OpenStreetMap © CARTO', ['a', 'b', 'c', 'd']);
    if (fondo === 'esri') return this.crearCapaDesdeUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      'Esri, HERE, Garmin, OpenStreetMap contributors', []);

    // Por defecto: OpenStreetMap normal (claro), oscurecido por nosotros y con menos color
    const capa = new ImageryLayer(new OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }));
    capa.brightness = 0.45;
    capa.saturation = 0.3;
    return capa;
  }

  private crearCapaDesdeUrl(url: string, creditos: string, subdominios: string[]): ImageryLayer {
    return new ImageryLayer(new UrlTemplateImageryProvider({
      credit: creditos, // texto de autoría que Cesium enseña abajo (obligatorio por licencia)
      maximumLevel: 18,
      subdomains: subdominios.length ? subdominios : undefined, // sustituyen a {s} en la url (aquí no se usa)
      url,
    }));
  }

  // ---------- Capa ACO (espacio aéreo): óvalos amarillo-verdosos y amarillos ----------

  private dibujarCapaAco(): void {
    // anadirElipse(capa, nombre, longitud, latitud, semieje mayor (NM), semieje menor (NM), giro (grados), color)
    this.anadirElipse(this.capaAco, 'HOLD BRAVO', -1.15, 39.4, 12, 6, 0, '#b8d86b');
    this.anadirElipse(this.capaAco, 'AAR TEXACO · FL290/240', -1.7, 39.0, 30, 8, 0, '#b8d86b');
    this.anadirElipse(this.capaAco, 'CAP ALFA', -0.9, 38.55, 20, 10, 0, '#b8d86b');
    this.anadirElipse(this.capaAco, 'NOTAM A0417', -0.1, 38.3, 10, 10, 0, '#d8b04a');
    this.anadirElipse(this.capaAco, 'NOTAM A0431', 0.3, 37.5, 10, 10, 0, '#d8b04a');
  }

  private anadirElipse(
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
      label: this.crearEtiqueta(nombre, color),
    });
  }

  private crearEtiqueta(texto: string, color: Color) {
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

  // ---------- Capa Amenazas: zona hostil, kill box, radar, SAM y dianas ----------

  private dibujarCapaAmenazas(): void {
    // anadirPoligono(capa, nombre, color, [[longitud, latitud], ...] una pareja por esquina)
    this.anadirPoligono(this.capaAmenazas, 'ZONA HOSTIL', '#e8504a', [[0.0, 40.6], [1.8, 40.6], [1.8, 38.6], [0.9, 38.6], [0.3, 39.4]]);
    this.anadirPoligono(this.capaAmenazas, 'KILL BOX 34', '#c46ad8', [[0.1, 39.65], [0.5, 39.65], [0.5, 40.05], [0.1, 40.05]]);
    this.anadirPoligono(this.capaAmenazas, 'SOMBRA RADAR EWR-1', '#8a9aa8', [[-1.7, 38.5], [-0.9, 39.1], [-0.8, 38.9], [-1.4, 38.3]]);

    // Círculo del SAM: es una elipse con los dos semiejes iguales (24 NM)
    this.anadirElipse(this.capaAmenazas, 'SAM-1 · 24 NM', 0.55, 39.3, 24, 24, 0, '#e8504a');

    // anadirPunto(capa, nombre, longitud, latitud, color)
    this.anadirPunto(this.capaAmenazas, 'TGT-01', 0.3, 39.85, '#e8504a');
    this.anadirPunto(this.capaAmenazas, 'TGT-02', 1.2, 40.1, '#e8504a');
    this.anadirPunto(this.capaAmenazas, 'TGT-03', 1.1, 39.0, '#e8504a');
  }

  private anadirPoligono(capa: CustomDataSource, nombre: string, colorCss: string, vertices: [number, number][]): void {
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
      label: this.crearEtiqueta(nombre, color),
    });
  }

  private anadirPunto(capa: CustomDataSource, nombre: string, longitud: number, latitud: number, colorCss: string): void {
    const color = Color.fromCssColorString(colorCss);
    capa.entities.add({
      name: nombre,
      position: Cartesian3.fromDegrees(longitud, latitud),
      // Un círculo de 10 píxeles con borde blanco
      point: { color, outlineColor: Color.WHITE, outlineWidth: 1, pixelSize: 10 },
      label: this.crearEtiqueta(nombre, color),
    });
  }

  // ---------- Capa Rutas: la línea azul y sus puntos ----------

  private dibujarCapaRutas(): void {
    // La línea: una pareja [longitud, latitud] por punto, en orden de recorrido
    this.capaRutas.entities.add({
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
    this.anadirPunto(this.capaRutas, 'BASE ALFA', -1.5, 38.0, '#3fb8e8');
    this.anadirPunto(this.capaRutas, 'WP1', -1.2, 38.45, '#3fb8e8');
    this.anadirPunto(this.capaRutas, 'VALLE', -1.0, 38.9, '#3fb8e8');
    this.anadirPunto(this.capaRutas, 'PUSH', -0.9, 39.35, '#3fb8e8');
    this.anadirPunto(this.capaRutas, 'IP ÁGUILA', -0.4, 40.0, '#3fb8e8');
    this.anadirPunto(this.capaRutas, 'TGT-01', 0.3, 39.85, '#3fb8e8');
  }

  // ---------- Avión: se mueve solo según la hora del reloj de Cesium ----------

  private dibujarAvion(): void {
    // 1) Dónde está el avión en cada momento: pares (hora, posición).
    //    Entre dos pares Cesium calcula solo las posiciones intermedias en línea recta.
    //    La hora se da en minutos desde el inicio de la misión (10:25).
    const posicion = new SampledPositionProperty();
    posicion.addSample(this.calcularHoraMision(0), Cartesian3.fromDegrees(-1.5, 38.0)); //  10:25 BASE ALFA
    posicion.addSample(this.calcularHoraMision(4), Cartesian3.fromDegrees(-1.2, 38.45)); // 10:29 WP1
    posicion.addSample(this.calcularHoraMision(7), Cartesian3.fromDegrees(-1.0, 38.9)); //  10:32 VALLE
    posicion.addSample(this.calcularHoraMision(11), Cartesian3.fromDegrees(-0.9, 39.35)); // 10:36 PUSH
    posicion.addSample(this.calcularHoraMision(16), Cartesian3.fromDegrees(-0.4, 40.0)); //  10:41 IP ÁGUILA
    posicion.addSample(this.calcularHoraMision(20), Cartesian3.fromDegrees(0.3, 39.85)); //  10:45 TGT-01

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
    this.capaRutas.entities.add({
      name: 'Avión',
      // Solo existe entre el inicio y el fin de la misión
      availability: new TimeIntervalCollection([new TimeInterval({ start: this.inicioMision, stop: this.finMision })]),
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
      label: this.crearEtiqueta('AVIÓN', Color.WHITE),
    });
  }

  private calcularHoraMision(minutosDesdeInicio: number): JulianDate {
    return JulianDate.addMinutes(this.inicioMision, minutosDesdeInicio, new JulianDate());
  }

  private configurarRelojMision(visor: Viewer): void {
    // El reloj de Cesium es quien manda la hora; el timeline es solo la barra para verla y moverla
    visor.clock.startTime = this.inicioMision.clone();
    visor.clock.stopTime = this.finMision.clone();
    visor.clock.currentTime = this.inicioMision.clone();
    visor.clock.clockRange = ClockRange.LOOP_STOP; // al llegar al final vuelve al principio
    visor.clock.multiplier = 30; // 30 segundos simulados por cada segundo real: la misión dura 40 s
    visor.clock.shouldAnimate = true; // arranca ya en marcha (false = esperar al play)

    // Ajusta la barra para que enseñe justo la misión
    visor.timeline?.zoomTo(this.inicioMision, this.finMision);

    // Franja roja en la barra: el tramo final, dentro de la zona hostil (10:41 a 10:45)
    const lineaTiempo = visor.timeline as unknown as LineaTiempoConFranjas | undefined;
    const franjaAmenaza = lineaTiempo?.addHighlightRange('#e8504a', 8, 0);
    franjaAmenaza?.setRange(this.calcularHoraMision(16), this.calcularHoraMision(20));
  }
}
