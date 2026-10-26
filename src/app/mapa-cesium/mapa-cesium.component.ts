import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CustomDataSource, Viewer } from 'cesium';
import { configurarRelojMision } from './funciones/configurar-reloj-mision.function';
import { crearCapaFondo } from './funciones/crear-capa-fondo.function';
import { crearMapa } from './funciones/crear-mapa.function';
import { dibujarAvion } from './funciones/dibujar-avion.function';
import { dibujarCapaAco } from './funciones/dibujar-capa-aco.function';
import { dibujarCapaAmenazas } from './funciones/dibujar-capa-amenazas.function';
import { dibujarCapaRutas } from './funciones/dibujar-capa-rutas.function';
import { FondoMapaId } from './models/fondo-mapa-id.type';

// Este componente solo se ocupa de los botones y de llamar a las funciones de la carpeta funciones/.
// Cada cosa que se dibuja en el mapa vive en su propio fichero allí.
@Component({
  selector: 'app-mapa-cesium',
  styleUrl: './mapa-cesium.component.scss',
  templateUrl: './mapa-cesium.component.html',
})
export class MapaCesium implements OnDestroy {
  // El <div #contenedorMapa> del HTML: ahí se mete el mapa de Cesium
  private readonly contenedorMapa =
    viewChild.required<ElementRef<HTMLDivElement>>('contenedorMapa');
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

  // El mapa de Cesium, que se crea al arrancar
  private visor?: Viewer;

  constructor() {
    // Espera a que el HTML exista y entonces crea el mapa
    afterNextRender(() => this.ngZone.runOutsideAngular(() => this.crearVisor()));
  }

  // ---------- Crear el mapa y todo lo que lleva dentro ----------

  private crearVisor(): void {
    // 1) El mapa en sí, con su fondo (funciones/crear-mapa y funciones/crear-capa-fondo)
    const visor = crearMapa(
      this.contenedorMapa().nativeElement,
      crearCapaFondo(this.fondoActivo()),
    );
    this.visor = visor;

    // 2) Registramos las tres capas en el mapa
    visor.dataSources.add(this.capaAco);
    visor.dataSources.add(this.capaAmenazas);
    visor.dataSources.add(this.capaRutas);

    // 3) Dibujamos lo que va en cada capa (una función por capa)
    dibujarCapaAco(this.capaAco);
    dibujarCapaAmenazas(this.capaAmenazas);
    dibujarCapaRutas(this.capaRutas);
    dibujarAvion(this.capaRutas);

    // 4) El reloj y la línea de tiempo
    configurarRelojMision(visor);

    // 5) Cuando el recuadro ya tiene su tamaño definitivo, se coloca la vista inicial (la zona de crear-mapa)
    requestAnimationFrame(() => visor.camera.flyHome(0));
  }

  // ---------- Qué pasa al pulsar cada botón ----------

  onBotonAcoPulsado(): void {
    this.acoVisible.update((visible) => !visible);
    this.capaAco.show = this.acoVisible();
  }

  onBotonAmenazasPulsado(): void {
    this.amenazasVisibles.update((visible) => !visible);
    this.capaAmenazas.show = this.amenazasVisibles();
  }

  onBotonRutasPulsado(): void {
    this.rutasVisibles.update((visible) => !visible);
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
    this.visor.imageryLayers.add(crearCapaFondo(fondo));
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
    this.widgetsVisibles.update((visibles) => !visibles);
    // Al volver a mostrarse, la línea de tiempo tiene que recalcular su ancho
    requestAnimationFrame(() => this.visor?.timeline?.resize());
  }

  onBotonLogoCesiumPulsado(): void {
    this.logoVisible.update((visible) => !visible);
  }

  onBotonVerOrigenPulsado(): void {
    this.verOrigen.update((visible) => !visible);
  }

  onBotonModoVistaPulsado(): void {
    this.modo3d.update((esModo3d) => !esModo3d);
    if (this.modo3d()) this.visor?.scene.morphTo3D(1);
    else this.visor?.scene.morphTo2D(1);
  }

  ngOnDestroy(): void {
    this.visor?.destroy();
  }
}
