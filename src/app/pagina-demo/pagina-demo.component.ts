import { Component } from '@angular/core';
import { MapaCesium } from '../mapa-cesium/mapa-cesium.component';

@Component({
  imports: [MapaCesium],
  selector: 'app-pagina-demo',
  styleUrl: './pagina-demo.component.scss',
  templateUrl: './pagina-demo.component.html',
})
export class PaginaDemo {}
