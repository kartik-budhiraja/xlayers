import { Injectable } from '@angular/core';
import { ImageService, SymbolService, LayerService } from '@xlayers/sketch-lib';
import { WebCodeGenService } from '@xlayers/web-codegen';
import { ReactAggregatorService } from './react-aggregator.service';

type WebCodeGenOptions = any;

@Injectable({
  providedIn: 'root'
})
export class ReactCodeGenService {
  constructor(
    private readonly symbolService: SymbolService,
    private readonly imageService: ImageService,
    private readonly webCodeGen: WebCodeGenService,
    private readonly reactAggretatorService: ReactAggregatorService,
    private readonly layerService: LayerService
  ) {}

  compute(
    current: SketchMSLayer,
    data: SketchMSData,
    options?: WebCodeGenOptions
  ) {
    this.webCodeGen.compute(current, data, this.compileOptions(options));
  }

  aggreate(
    current: SketchMSLayer,
    data: SketchMSData,
    options?: WebCodeGenOptions
  ) {
    return [
      {
        uri: 'README.md',
        value: this.renderReadme(data.meta.app),
        language: 'markdown',
        kind: 'text'
      }
    ].concat(this.visit(current, data, this.compileOptions(options)));
  }

  identify(current: SketchMSLayer) {
    return this.webCodeGen.identify(current);
  }

  context(current: SketchMSLayer) {
    return this.webCodeGen.context(current);
  }

  private visit(
    current: SketchMSLayer,
    data: SketchMSData,
    options?: WebCodeGenOptions
  ) {
    return this.visitContent(current, data, options).concat(
      this.reactAggretatorService.aggreate(current, options)
    );
  }

  private visitContent(
    current: SketchMSLayer,
    data: SketchMSData,
    options: WebCodeGenOptions
  ) {
    if (this.layerService.identify(current)) {
      return this.visitLayer(current, data, options);
    } else if (this.symbolService.identify(current)) {
      return this.visitSymbolMaster(current, data, options);
    } else if (this.imageService.identify(current)) {
      return this.imageService.aggreate(current, data, options);
    }
    return [];
  }

  private visitLayer(
    current: SketchMSLayer,
    data: SketchMSData,
    options: WebCodeGenOptions
  ) {
    return this.layerService
      .lookup(current, data)
      .flatMap(layer => this.visitContent(layer, data, options));
  }

  private visitSymbolMaster(
    current: SketchMSLayer,
    data: SketchMSData,
    options: WebCodeGenOptions
  ) {
    const symbolMaster = this.symbolService.lookup(current, data);
    if (symbolMaster) {
      return this.visit(symbolMaster, data, options);
    }
    return [];
  }

  private compileOptions(options: WebCodeGenOptions) {
    return {
      textTagName: 'span',
      bitmapTagName: 'img',
      blockTagName: 'div',
      xmlPrefix: 'xly-',
      cssPrefix: 'xly_',
      componentDir: 'components',
      assetDir: 'assets',
      ...options
    };
  }

  private renderReadme(name: string) {
    return `\
## How to use the ${name} Vue module

Import and use it with ReactDOM :

\`\`\`javascript
import ReactDOM from "react-dom";
import { MyComponent } from "./my-component";

ReactDOM.aggreate(
  MyComponent,
  document.getElementById(\'root\')
);
\`\`\`

>  For more information about [Reactjs](https://reactjs.org/)`;
  }
}
