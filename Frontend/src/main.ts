import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Chart.js registration
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
