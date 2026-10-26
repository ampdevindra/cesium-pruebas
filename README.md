# cessium-pruebas

Demo de un **mapa táctico interactivo** hecho con Angular 22 y [CesiumJS](https://cesium.com/platform/cesiumjs/). Sirve para aprender cómo funciona Cesium y para decidir si es la librería adecuada. Todos los datos (zonas, ruta, horas) son de ejemplo.

![Vista general del mapa](docs/imagenes/mapa-completo.png)

## Documentación

| Documento | Qué cuenta |
|---|---|
| **Este README** | Cómo arrancar, estructura del proyecto, glosario y pendientes |
| [**cesium.md**](cesium.md) | La lógica del mapa explicada paso a paso, con código, y una tabla de "quiero cambiar X → voy a tal fichero" |

## Arrancar el proyecto

```bash
npm install
npm start
```

Se abre en `http://localhost:4300/cesium` (el puerto está en `angular.json`, dentro de `serve` → `options` → `port`).

Otros comandos:

```bash
npm run build   # compila a la carpeta dist/ (esto es lo que se despliega)
```

## Estructura del proyecto

```
cessium-pruebas/
├── README.md                 ← este documento
├── cesium.md                 ← guía de la lógica del mapa
├── docs/imagenes/            ← capturas que se ven en los documentos
├── angular.json              ← copia los ficheros de Cesium y fija el puerto 4300
├── public/
│   └── avion.svg             ← icono del avión
└── src/
    ├── styles.scss           ← estilos globales (la página ocupa toda la pantalla)
    └── app/
        ├── app.routes.ts     ← la ruta /cesium
        ├── pagina-demo/      ← maqueta de web: cabecera + menú + recuadro del mapa
        └── mapa-cesium/      ← EL MAPA
            ├── mapa-cesium.component.ts     ← botones y arranque (llama a las funciones)
            ├── mapa-cesium.component.html   ← los botones y el recuadro del mapa
            ├── mapa-cesium.component.scss   ← el aspecto de los botones
            ├── funciones/                   ← un fichero por cosa que se dibuja o configura
            │   ├── crear-mapa.function.ts
            │   ├── crear-capa-fondo.function.ts
            │   ├── crear-etiqueta.function.ts
            │   ├── anadir-elipse.function.ts
            │   ├── anadir-poligono.function.ts
            │   ├── anadir-punto.function.ts
            │   ├── dibujar-capa-aco.function.ts
            │   ├── dibujar-capa-amenazas.function.ts
            │   ├── dibujar-capa-rutas.function.ts
            │   ├── dibujar-avion.function.ts
            │   ├── calcular-hora-mision.function.ts
            │   └── configurar-reloj-mision.function.ts
            └── models/                      ← tipos y constantes
```

Si en el futuro se prueba otra librería, se crea otra carpeta al lado (`mapa-otra-libreria/`) con su propio componente y su ruta.

## Capturas

Las imágenes de los documentos están en [`docs/imagenes/`](docs/imagenes) y siguen el orden de construcción del mapa (cada una enseña solo lo que se ha hecho hasta ese paso):

| Fichero | Qué enseña | Paso en [cesium.md](cesium.md) |
|---|---|---|
| `paso-2-mapa-vacio.png` | El mapa recién creado, sin fondo | 2 |
| `paso-3-fondo.png` | El mapa con el fondo Esri | 3 |
| `fondo-esri.png`, `fondo-osm.png`, `fondo-carto.png` | Los tres fondos probados | 3 |
| `paso-4-capas-botones.png` | Los botones de las capas, aún vacías | 4 |
| `paso-5a-elipses.png` | Solo la capa ACO (elipses) | 5 |
| `paso-5b-poligonos-puntos.png` | Más la capa Amenazas (polígonos, círculo, puntos) | 5 |
| `paso-6-ruta.png` | Más la ruta | 6 |
| `paso-7-avion.png` | Más el avión | 7 |
| `paso-8-reloj-timeline.png` | Con el reloj y el timeline | 8 |
| `widgets-activados.png`, `widgets-desactivados.png` | El botón Widgets Cesium | 4 |
| `ver-origen.png` | El botón Ver origen | 1 |
| `maqueta-pagina.png` | El mapa dentro de la maqueta de web | 5 (sección) |
| `mapa-completo.png` | Todo junto | portada |

Para cambiar una imagen basta con guardar la nueva captura con el mismo nombre. Se enlazan en el Markdown así:

```md
![Texto alternativo](docs/imagenes/nombre-del-fichero.png)
```

La ruta es relativa al documento.

## Glosario

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

## Qué falta por hacer

- Panel de **hora del ATO** y contadores ("5 ACM activas · 2 misiones en vuelo").
- **Estructura de datos** de ACM y misiones con horarios, para que las zonas aparezcan y desaparezcan solas con el reloj y alimenten el diagrama de Gantt.
- **Gantt de reproducción** y control de tiempo propio (sustituir el timeline de Cesium).
- Bordes **discontinuos** en zonas y línea FLOT, corredor MRR-2.
- **Símbolos militares** estándar en lugar de iconos simples.
- Leyenda, brújula y **escala** (en Cesium no vienen hechas).
- Mapa de fondo definitivo (servidor propio, tinte azul marino como en el diseño de referencia).
- Comparar con **MapLibre + deck.gl** y con **LuciadRIA** (Hexagon, de pago; hay que pedir licencia de evaluación).
