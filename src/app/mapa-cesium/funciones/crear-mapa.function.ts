import { Camera, ImageryLayer, Rectangle, SceneMode, Viewer } from 'cesium';

// Cesium busca aquí sus ficheros auxiliares (los que copia angular.json)
(window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = '/cesium';

/** Crea el mapa de Cesium (el "Viewer") dentro de un hueco del HTML. */
export function crearMapa(contenedor: HTMLElement, capaFondo: ImageryLayer): Viewer {
  // Vista inicial (y la del botón casa): oeste, sur, este, norte en grados.
  // Se fija antes de crear el mapa para que se adapte al tamaño real del recuadro.
  Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(-2.6, 37.3, 2.4, 40.9);
  Camera.DEFAULT_VIEW_FACTOR = 0;

  return new Viewer(contenedor, {
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
    baseLayer: capaFondo,
    sceneMode: SceneMode.SCENE2D,
  });
}
