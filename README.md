# Yavin

Demo de un **mapa táctico interactivo** hecho con Angular 22 y [CesiumJS](https://cesium.com/platform/cesiumjs/). Sirve para aprender cómo funciona Cesium y para decidir si es la librería adecuada. Todos los datos (zonas, ruta, horas) son de ejemplo.

Este documento explica **paso a paso** cómo está construido, en el orden en que se hace, con el código real del proyecto para que puedas localizarlo.

## Índice

1. [Arrancar el proyecto](#1-arrancar-el-proyecto)
2. [Cómo piensa Cesium (conceptos básicos)](#2-cómo-piensa-cesium-conceptos-básicos)
3. [Dónde está cada cosa](#3-dónde-está-cada-cosa)
4. [Paso a paso: construir el mapa](#4-paso-a-paso-construir-el-mapa)
5. [Meter el mapa dentro de una web](#5-meter-el-mapa-dentro-de-una-web)
6. [Trucos y errores típicos](#6-trucos-y-errores-típicos)
7. [Créditos y licencias](#7-créditos-y-licencias)
8. [Glosario](#8-glosario)
9. [Qué falta por hacer](#9-qué-falta-por-hacer)

---

## 1. Arrancar el proyecto

```bash
npm install
npm start
```

Se abre en `http://localhost:4300/cesium` (el puerto está en `angular.json`, dentro de `serve` → `options` → `port`).

Otros comandos:

```bash
npm run build   # compila a la carpeta dist/ (esto es lo que se despliega)
```

---

## 2. Cómo piensa Cesium (conceptos básicos)

Cesium dibuja un **globo terráqueo** (o un mapa plano) con WebGL. Para usarlo hay que conocer solo cinco ideas:

| Concepto | Qué es | Ejemplo en este proyecto |
|---|---|---|
| **Viewer** | El mapa completo: la ventana donde se ve todo | `new Viewer(...)` en `crearVisor` |
| **Capa de imágenes** (*imagery layer*) | El mapa de fondo: miles de cuadraditos de imagen que se piden a un servidor | Esri gris oscuro (`crearCapaFondo`) |
| **Entidad** (*entity*) | Cualquier cosa que dibujas encima: un punto, una línea, una zona, un icono, un texto | Una elipse, la ruta, el avión |
| **DataSource** | Una caja donde metes entidades. Sirve para encender o apagar un grupo a la vez | `capaAco`, `capaAmenazas`, `capaRutas` |
| **Reloj** (*clock*) | La hora del mapa. Si una entidad depende del tiempo (el avión), se mueve cuando el reloj avanza | `visor.clock` |

```mermaid
flowchart TD
    V["Viewer (el mapa)"]
    V --> F["Mapa de fondo<br/>(imagery layer)"]
    V --> D["DataSources = capas"]
    V --> C["Reloj (clock)"]
    V --> CAM["Cámara (qué zona se ve)"]
    D --> A["Capa ACO"]
    D --> B["Capa Amenazas"]
    D --> R["Capa Rutas"]
    A --> E1["Entidades: elipses"]
    B --> E2["Entidades: polígonos,<br/>círculo SAM, dianas"]
    R --> E3["Entidades: línea de ruta,<br/>puntos, avión"]
    C --> T["Widgets: reloj y timeline"]
    C -. "mueve" .-> E3
```

### Una regla de oro: las coordenadas

Las posiciones **no son píxeles**, son **longitud y latitud en grados**. Por eso el mapa se puede redimensionar o hacer zoom y todo sigue en su sitio.

> ⚠️ **Primero la longitud, después la latitud.** En Cesium es `(longitud, latitud)`, al revés de lo que se suele decir en voz alta ("latitud, longitud"). Es el fallo más típico.

Lo que sí mide píxeles (y no cambia con el zoom): el tamaño de los puntos, el icono del avión y el texto.

---

## 3. Dónde está cada cosa

```
yavin/
├── angular.json                    ← copia los ficheros de Cesium y fija el puerto 4300
├── public/
│   └── avion.svg                   ← icono del avión
└── src/
    ├── styles.scss                 ← estilos globales (la página ocupa toda la pantalla)
    └── app/
        ├── app.routes.ts           ← la ruta /cesium
        ├── pagina-demo/            ← maqueta de web: cabecera + menú + recuadro del mapa
        └── mapa-cesium/            ← EL MAPA
            ├── mapa-cesium.component.ts     ← toda la lógica de Cesium
            ├── mapa-cesium.component.html   ← los botones y el recuadro del mapa
            ├── mapa-cesium.component.scss   ← el aspecto de los botones
            └── models/                      ← tipos de TypeScript
```

Lo importante está en **`mapa-cesium.component.ts`**. Si quieres probar otra librería en el futuro, se crearía otra carpeta al lado (`mapa-otra-libreria/`) con su propio componente y su ruta.

### Quién es de quién

| Parte | ¿De quién es? |
|---|---|
| Mapa de fondo, zoom, arrastrar, 2D/3D | **Cesium** |
| Reloj y barra de tiempo de abajo, barra de iconos de arriba a la derecha, créditos | **Cesium** (widgets que vienen hechos) |
| Botones ACO, Amenazas, Rutas, fondos, Ver origen, 2D/3D | **Nuestros** (HTML + CSS + Angular) |
| Zonas, ruta, dianas, avión | **Los dibuja Cesium con nuestros datos** |

Pulsando el botón **Ver origen** dentro del mapa se marca todo esto con colores.

---

## 4. Paso a paso: construir el mapa

Este es el orden lógico. Cada paso se apoya en el anterior.

```mermaid
flowchart LR
    P1["1. Instalar<br/>Cesium"] --> P2["2. Crear<br/>el mapa"]
    P2 --> P3["3. Poner<br/>un fondo"]
    P3 --> P4["4. Crear<br/>las capas"]
    P4 --> P5["5. Dibujar<br/>zonas y puntos"]
    P5 --> P6["6. Dibujar<br/>la ruta"]
    P6 --> P7["7. Avión que<br/>se mueve"]
    P7 --> P8["8. Reloj y<br/>timeline"]
    P8 --> P9["9. Botones<br/>propios"]
```

### Paso 1. Instalar Cesium y configurarlo

```bash
npm install cesium
```

Cesium necesita unos ficheros auxiliares (código que corre en segundo plano, imágenes, estilos) que no se mezclan con tu código. Hay que decirle a Angular que los **copie** al compilar. Se hace en `angular.json`, dentro de `build` → `options`:

```json
"assets": [
  { "glob": "**/*", "input": "public" },
  { "glob": "**/*", "input": "node_modules/cesium/Build/Cesium/Assets",     "output": "/cesium/Assets" },
  { "glob": "**/*", "input": "node_modules/cesium/Build/Cesium/ThirdParty", "output": "/cesium/ThirdParty" },
  { "glob": "**/*", "input": "node_modules/cesium/Build/Cesium/Widgets",    "output": "/cesium/Widgets" },
  { "glob": "**/*", "input": "node_modules/cesium/Build/Cesium/Workers",    "output": "/cesium/Workers" }
],
"styles": [
  "node_modules/cesium/Build/Cesium/Widgets/widgets.css",
  "src/styles.scss"
]
```

- `assets` copia las cuatro carpetas de Cesium a `/cesium/` en la web resultante. **No se copian a tu repositorio**: salen de `node_modules` cada vez que compilas, y se actualizan con `npm update cesium`.
- `styles` añade el CSS de los widgets de Cesium.

Y en el componente se le dice dónde las ha de buscar (`mapa-cesium.component.ts`, arriba del todo):

```ts
(window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = '/cesium';
```

> Cesium también hace falta que el contenedor del mapa tenga altura. Ver [sección 5](#5-meter-el-mapa-dentro-de-una-web).

### Paso 2. Crear el mapa (el *Viewer*)

En el HTML hay un hueco para el mapa (`mapa-cesium.component.html`):

```html
<div #contenedorMapa class="mapa-lienzo"></div>
```

En el `.ts`, una vez que el HTML ya existe, se crea el mapa dentro de ese hueco (método `crearVisor`):

```ts
constructor() {
  afterNextRender(() => this.ngZone.runOutsideAngular(() => this.crearVisor()));
}

private crearVisor(): void {
  const visor = new Viewer(this.contenedorMapa().nativeElement, {
    animation: true,       // reloj de abajo a la izquierda
    timeline: true,        // línea de tiempo de abajo
    homeButton: true,      // botón casa: vuelve a la vista inicial
    baseLayerPicker: false, // desactivado: necesita token de Cesium Ion
    geocoder: false,        // desactivado: necesita token de Cesium Ion
    sceneMode: SceneMode.SCENE2D,   // arranca plano (2D); también existe 3D
    ...
  });
}
```

- `afterNextRender` espera a que el HTML exista antes de crear el mapa.
- `runOutsideAngular` evita que Angular se vuelva loco comprobando cambios en cada fotograma que Cesium dibuja.
- Cada widget de Cesium es una opción `true` / `false`. Todo lo que está a `false` desaparece.

**Dónde empieza el mapa** (qué zona se ve al arrancar) se fija al principio de `crearVisor`, antes de crear el `Viewer`:

```ts
Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(-2.6, 37.3, 2.4, 40.9); // oeste, sur, este, norte
Camera.DEFAULT_VIEW_FACTOR = 0;
```

Esa misma zona es a la que vuelve el botón casa.

### Paso 3. Poner un mapa de fondo

El fondo son cuadraditos de imagen que Cesium pide a un servidor según la zona y el zoom. En la URL, `{z}` es el nivel de zoom y `{x}`, `{y}` la posición del cuadradito (método `crearCapaFondo`):

```ts
new ImageryLayer(new UrlTemplateImageryProvider({
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  credit: 'Esri, HERE, Garmin, OpenStreetMap contributors',
  maximumLevel: 18,
}))
```

Fondos probados:

| Fondo | Resultado |
|---|---|
| **Esri gris oscuro** | ✅ El que mejor queda: tierra gris oscuro sobre mar casi negro. Es el que se usa por defecto |
| OpenStreetMap oscurecido | Funciona, pero es un mapa claro al que se le baja el brillo; queda ruidoso |
| CARTO (sin y con texto) | ❌ Ahora exigen una clave: sale una marca de agua "API KEY REQUIRED" |

Notas:
- El texto de `credit` (autoría) es obligatorio por licencia; Cesium lo enseña abajo.
- Antes de un uso real hay que **mirar las condiciones de cada proveedor** y probablemente montar un servidor de mapas propio.
- Cambiar de fondo en caliente (`cambiarFondo`) es quitar la capa vieja y poner la nueva, sin tocar nada de lo dibujado encima.

### Paso 4. Crear las capas

Una capa es una "caja" (`CustomDataSource`) donde se meten entidades. Se declaran como propiedades de la clase:

```ts
private readonly capaAco = new CustomDataSource('aco');
private readonly capaAmenazas = new CustomDataSource('amenazas');
private readonly capaRutas = new CustomDataSource('rutas');
```

Y se registran en el mapa, en `crearVisor`:

```ts
visor.dataSources.add(this.capaAco);
visor.dataSources.add(this.capaAmenazas);
visor.dataSources.add(this.capaRutas);
```

Para **encender o apagar** una capa entera basta con `capa.show = true / false` (ver paso 9).

### Paso 5. Dibujar zonas, círculos y puntos

Todo se dibuja con `capa.entities.add({...})`. Hay tres tipos de forma en este proyecto, cada uno con su método auxiliar.

**Elipses** (esperas, CAP, NOTAM, el círculo del SAM) — `anadirElipse`:

```ts
// anadirElipse(capa, nombre, longitud, latitud, semieje mayor (NM), semieje menor (NM), giro (grados), color)
this.anadirElipse(this.capaAco, 'HOLD BRAVO', -1.15, 39.4, 12, 6, 0, '#b8d86b');
```

Dentro, Cesium pide los semiejes en **metros**, así que se convierte desde millas náuticas (1 NM = 1852 m). Un círculo es una elipse con los dos semiejes iguales:

```ts
this.anadirElipse(this.capaAmenazas, 'SAM-1 · 24 NM', 0.55, 39.3, 24, 24, 0, '#e8504a');
```

**Polígonos** (zona hostil, kill box, sombra radar) — `anadirPoligono`: una pareja `[longitud, latitud]` por esquina.

```ts
this.anadirPoligono(this.capaAmenazas, 'KILL BOX 34', '#c46ad8',
  [[0.1, 39.65], [0.5, 39.65], [0.5, 40.05], [0.1, 40.05]]);
```

**Puntos** (dianas, puntos de la ruta) — `anadirPunto`:

```ts
this.anadirPunto(this.capaAmenazas, 'TGT-01', 0.3, 39.85, '#e8504a');
```

Cada entidad lleva también una **etiqueta** (el texto sobre la forma, método `crearEtiqueta`) y un color con transparencia (`color.withAlpha(0.12)`) para que se vea el mapa debajo.

### Paso 6. Dibujar la ruta

La ruta es una línea (`polyline`) que une las coordenadas en orden (método `dibujarCapaRutas`):

```ts
this.capaRutas.entities.add({
  name: 'Ruta B',
  polyline: {
    material: Color.fromCssColorString('#3fb8e8'),
    positions: Cartesian3.fromDegreesArray([
      -1.5, 38.0,   // BASE ALFA
      -1.2, 38.45,  // WP1
      ...
    ]),
    width: 4,
  },
});
```

Aquí las coordenadas van **todas seguidas en una lista plana**: longitud, latitud, longitud, latitud... Después se ponen los puntos con su nombre encima (`anadirPunto`).

### Paso 7. El avión que se mueve

Esto es lo más interesante. Un avión no "se mueve": se le dice **dónde está en cada hora** y Cesium calcula lo que hay en medio. Está en `dibujarAvion`, en tres partes.

**7.1. Dónde está y cuándo** (`SampledPositionProperty`): una lista de pares (hora, posición).

```ts
const posicion = new SampledPositionProperty();
posicion.addSample(this.calcularHoraMision(0),  Cartesian3.fromDegrees(-1.5, 38.0));  // 10:25 BASE ALFA
posicion.addSample(this.calcularHoraMision(7),  Cartesian3.fromDegrees(-1.0, 38.9));  // 10:32 VALLE
posicion.addSample(this.calcularHoraMision(20), Cartesian3.fromDegrees(0.3, 39.85));  // 10:45 TGT-01
```

La hora se da en minutos desde el inicio de la misión (`inicioMision`, las 10:25 UTC). Entre dos muestras, Cesium traza una línea recta.

**7.2. Hacia dónde mira.** Un icono no sabe girar solo. Se usa una función (`CallbackProperty`) que Cesium ejecuta en cada fotograma: compara dónde estaba el avión 5 segundos antes y dónde estará 5 después, calcula el rumbo y gira el icono.

```ts
const giroIcono = new CallbackProperty(tiempo => {
  ...
  const rumbo = Math.atan2(haciaElEste, haciaElNorte); // 0 = norte, sentido horario
  ultimoRumbo = Math.PI / 4 - rumbo; // el dibujo apunta 45° al noreste; Cesium gira al revés
  return ultimoRumbo;
}, false);
```

**7.3. El avión como entidad**: icono (`billboard`), estela (`path`) y texto.

```ts
this.capaRutas.entities.add({
  name: 'Avión',
  availability: new TimeIntervalCollection([new TimeInterval({ start: this.inicioMision, stop: this.finMision })]),
  position: posicion,
  billboard: { image: '/avion.svg', width: 32, height: 32, rotation: giroIcono,
               alignedAxis: Cartesian3.UNIT_Z },
  path: { leadTime: 0, trailTime: 600, width: 2, ... },  // estela de los últimos 10 min
  label: this.crearEtiqueta('AVIÓN', Color.WHITE),
});
```

- `image: '/avion.svg'` es el fichero `public/avion.svg`.
- `availability` hace que el avión **solo exista** entre el inicio y el fin de la misión. Esto mismo servirá para que las zonas aparezcan y desaparezcan según su horario.
- `alignedAxis: UNIT_Z` hace que el "arriba" del icono sea siempre el norte, también en 3D.

### Paso 8. El reloj y la línea de tiempo

El **reloj** (`visor.clock`) es el que manda la hora. La **línea de tiempo** es solo la barra que lo enseña y permite moverlo. Se configura en `configurarRelojMision`:

```ts
visor.clock.startTime = this.inicioMision.clone();   // 10:25
visor.clock.stopTime = this.finMision.clone();       // 10:45
visor.clock.currentTime = this.inicioMision.clone();
visor.clock.clockRange = ClockRange.LOOP_STOP;       // al llegar al final vuelve al principio
visor.clock.multiplier = 30;                         // 30 s simulados por cada segundo real
visor.clock.shouldAnimate = true;                    // arranca ya en marcha
visor.timeline?.zoomTo(this.inicioMision, this.finMision);
```

| Quiero... | Lo cambio así |
|---|---|
| Que no arranque solo | `shouldAnimate = false` |
| Ir más rápido o más lento | `multiplier` (1 = tiempo real) |
| Que se pare al final | `ClockRange.CLAMPED` en vez de `LOOP_STOP` |
| Saltar a una hora | `clock.currentTime = una hora` |

También hay una franja roja en la barra (el tramo dentro de la zona hostil). Cesium tiene el método para pintarla (`addHighlightRange`) pero **no lo declara en sus tipos de TypeScript**, así que está descrito a mano en `models/linea-tiempo-con-franjas.interface.ts`.

> 💡 **El timeline de Cesium se puede sustituir.** Como el que manda es el reloj, se puede quitar el widget (`timeline: false`, `animation: false`) y hacer un componente propio con botones de play, velocidad y una barra, que simplemente lea y escriba en `visor.clock`. Está pendiente de hacer.

### Paso 9. Botones propios

Los botones ACO, Amenazas y Rutas no son de Cesium: son HTML normal de Angular. Se escriben uno a uno en el HTML (`mapa-cesium.component.html`):

```html
<nav class="mapa-capas">
  <button
    type="button"
    [class.activo]="acoVisible()"
    (click)="onBotonAcoPulsado()">ACO</button>
  ...
</nav>
```

- `[class.activo]` añade la clase `activo` (botón encendido) cuando `acoVisible()` es verdadero.
- `(click)` llama al método del `.ts`.

Y el método solo enciende o apaga la capa de Cesium:

```ts
onBotonAcoPulsado(): void {
  this.acoVisible.update(visible => !visible);
  this.capaAco.show = this.acoVisible();
}
```

El aspecto está en `mapa-cesium.component.scss`: el estilo común en `nav button`, el botón encendido en `&.activo` y la posición de cada grupo en `nav.mapa-capas`, `nav.mapa-fondos` y `nav.mapa-vista`.

**Poner un botón en otro sitio** (por ejemplo, un icono arriba a la derecha) es: añadir el `<button>` dentro del `<nav>` que quieras, o crear otro `<nav>` y darle posición con `position: absolute` y `top` / `right` en el SCSS.

El cambio 2D/3D es una sola línea de Cesium:

```ts
if (this.modo3d()) this.visor?.scene.morphTo3D(1);
else this.visor?.scene.morphTo2D(1);
```

---

## 5. Meter el mapa dentro de una web

El mapa **no ocupa la pantalla entera por sí mismo**: ocupa el tamaño de su contenedor, y Cesium se reajusta solo si el contenedor cambia. La condición es que el contenedor **tenga una altura definida**; si no, el mapa mide 0 y no se ve.

`pagina-demo/` es una maqueta con recuadros negros para ver cómo queda:

```
┌───────────────────────────────────────────┐
│  CABECERA                                 │
├────────────┬──────────────────────────────┤
│            │  TÍTULO Y FILTROS            │
│   MENÚ     ├──────────────────────────────┤
│  LATERAL   │                              │
│            │         EL MAPA              │
│            │   (componente app-mapa-cesium)
│            │                              │
└────────────┴──────────────────────────────┘
```

El HTML solo pone el componente en su recuadro:

```html
<section class="pagina-mapa">
  <app-mapa-cesium/>
</section>
```

Y el SCSS usa una cuadrícula (`display: grid`) para repartir el espacio. Dos líneas son clave para que el mapa respete su recuadro:

```scss
main.pagina-contenido { min-height: 0; ... }  // sin esto el mapa empuja la página y se sale de la pantalla
section.pagina-mapa   { min-height: 0; overflow: hidden; }
```

En pantallas estrechas (menos de 800 px) el menú lateral se esconde.

**Qué escala y qué no** al cambiar el tamaño: las zonas, la ruta y las dianas están en coordenadas reales, así que escalan solas con el zoom; los puntos, el avión y los textos miden píxeles y mantienen su tamaño.

---

## 6. Trucos y errores típicos

- **Longitud primero, latitud después.** Si algo aparece en medio del océano o en África, es esto.
- **El mapa sale vacío o con altura 0**: el contenedor no tiene altura (ver sección 5).
- **Aparece el mundo entero en lugar de la zona**: la vista inicial se debe fijar con `Camera.DEFAULT_VIEW_RECTANGLE` **antes** de crear el `Viewer`. Si se hace después con `setView`, no se adapta bien a un recuadro pequeño.
- **Los semiejes de las elipses van en metros**, no en millas ni grados.
- **`baseLayerPicker` y `geocoder` piden un token de Cesium Ion** (una cuenta gratuita de Cesium). Por eso están desactivados.
- **Si cambias `angular.json`** hay que parar y volver a arrancar `npm start`.
- **Al hacer una captura de pantalla** del mapa justo tras cargar puede verse medio vacío: los cuadraditos del fondo tardan unos segundos en llegar.
- El mapa de fondo gratuito de OpenStreetMap **no se debe usar en producción** (sus normas lo restringen).

---

## 7. Créditos y licencias

> Esto es una **orientación**, no asesoramiento legal. Revisado en la web de Cesium el 25-10-2026; las condiciones pueden cambiar, y antes de un uso real las debe revisar quien gestione las licencias.

### Resumen rápido

- Los **créditos de los mapas** (Esri, OpenStreetMap...) los exige quien pone los datos. Se muestran mientras se usen mapas de terceros.
- El **logo de Cesium** solo se exige de forma explícita cuando se usa **Cesium ion** (su servicio en la nube). En una aplicación sin Cesium ion no parece obligatorio por lo que dicen sus textos, pero no lo confirman, y su guía tampoco dice que se pueda quitar.
- La licencia de la librería (Apache 2.0) no obliga a mostrar ningún logo.
- ⚠️ **Todo esto hay que revisarlo legalmente a fondo antes de un uso real.** Lo de aquí es lo que dicen las páginas de Cesium a fecha de hoy.

### Qué créditos salen en el mapa y de quién son

Abajo a la izquierda del mapa salen dos cosas distintas:

| Qué se ve | De quién es | Cómo se controla |
|---|---|---|
| **Logo "CESIUM ion"** | De Cesium. Lo pone la librería por defecto | Botón **Logo Cesium** (solo lo esconde con CSS) |
| **Enlace "Data attribution"** | Lo genera Cesium, pero su contenido son los créditos **de los mapas y datos de terceros** (Esri, OpenStreetMap...) | El texto sale del campo `credit` que se pasa al crear cada mapa de fondo (`crearCapaDesdeUrl`) |

Los créditos de los **mapas** los exige quien pone los datos: mientras se use Esri u OpenStreetMap hay que mostrarlos. Con un servidor de mapas propio hecho con datos totalmente propios no habría terceros a quienes acreditar; pero si ese servidor se construye a partir de datos abiertos (por ejemplo OpenStreetMap), la atribución a esa fuente sigue siendo obligatoria.

### Qué dice Cesium sobre su logo

Según su [guía de uso y atribución](https://cesium.com/learn/ion/content-usage-and-attribution-guide/):

- *"You must prominently display the Cesium ion logo in software or content you create with Cesium ion."* Es decir, la obligación está escrita para el software o contenido que se crea **con Cesium ion** (su servicio en la nube: terreno, mapas, 3D Tiles y geocodificador, que usan un token).
- Se puede **cambiar la colocación y la presentación** del logo, pero tiene que seguir siendo "prominente": que sea más probable que lo vea el usuario a que no.
- La guía **no dice que se pueda quitar** y tampoco aclara el caso de una aplicación que **no usa nada de Cesium ion**, que es el nuestro: los datos son de Esri y de nuestro escenario, sin token.
- Los [términos de servicio de Cesium ion](https://cesium.com/legal/terms-of-service/) añaden que no se puede quitar "un aviso de copyright, descargo de responsabilidad u otra forma de atribución" de los servicios licenciados. Están escritos para los servicios de Cesium ion, no para la librería sola.
- La licencia de la propia librería, [Apache 2.0](https://github.com/CesiumGS/cesium/blob/main/LICENSE.md), **no menciona ningún logo ni obliga a mostrarlo**. Pide conservar los avisos de copyright en el código y no concede permiso para usar sus marcas.

### Qué significa para este proyecto

- **Hoy** (sin Cesium ion, con mapas de Esri): lo que está claro es que los créditos de los mapas se deben mostrar. Sobre el logo de Cesium, por lo que dicen los textos no parece obligatorio al no usar su servicio, pero **no lo afirman de forma explícita**.
- **Si algún día se usa Cesium ion** (token, terreno, mapas o geocodificador suyos), el logo hay que mostrarlo.
- El botón **Logo Cesium** de la demo es solo para ver cómo funciona; antes de un uso real, lo prudente es preguntar a Cesium directamente (por ejemplo por su foro o su contacto comercial) y dejar la respuesta por escrito.

---

## 8. Glosario

| Término | Significado |
|---|---|
| **ACM** | *Airspace Coordination Measure*: zona del espacio aéreo con una función (espera, reabastecimiento, patrulla...) |
| **ATO** | *Air Tasking Order*: el plan aéreo del día (qué misiones y qué zonas, y cuándo) |
| **NM** | Milla náutica (1852 m) |
| **SAM** | Misil tierra-aire. El círculo rojo es su alcance |
| **FLOT** | Línea de frente de las fuerzas propias |
| **HOLD** | Zona de espera |
| **AAR** | Reabastecimiento en vuelo (TEXACO es el nombre de la zona del avión nodriza) |
| **CAP** | Patrulla aérea de combate |
| **NOTAM** | Aviso a aviadores (en el mapa, zonas con aviso activo) |
| **IP** | Punto inicial de una aproximación al objetivo |
| **TGT** | Objetivo (*target*) |
| **EWR** | Radar de alerta temprana |
| **ROZ** | Zona restringida de operaciones |
| **UTC / Z** | Hora universal. 10:25Z = 10:25 UTC |

---

## 9. Qué falta por hacer

- Panel de **hora del ATO** y contadores ("5 ACM activas · 2 misiones en vuelo").
- **Estructura de datos** de ACM y misiones con horarios, para que las zonas aparezcan y desaparezcan solas con el reloj y alimenten el diagrama de Gantt.
- **Gantt de reproducción** y control de tiempo propio (sustituir el timeline de Cesium).
- Bordes **discontinuos** en zonas y línea FLOT, corredor MRR-2.
- **Símbolos militares** estándar en lugar de iconos simples.
- Leyenda, brújula y **escala** (en Cesium no vienen hechas).
- Mapa de fondo definitivo (servidor propio, tinte azul marino como en el diseño de referencia).
- Comparar con **MapLibre + deck.gl** y con **LuciadRIA** (Hexagon, de pago; hay que pedir licencia de evaluación).
