import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ForecastComponent } from './forecast/forecast.component'
import { ContactComponent } from './contact/contact.component'
import { CovComponent } from './cov/cov.component'


const routes: Routes = [
  {
    path: '',
    component: ForecastComponent
  },
  {
    path: 'contact',
    component: ContactComponent
  },
  {
    path: 'cov19',
    component: CovComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
