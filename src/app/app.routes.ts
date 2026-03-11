import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Cards } from './pages/cards/cards';

export const routes: Routes = [
  { path: '', component: Home }, // http://localhost:4200/
  { path: 'cards', component: Cards }, // http://localhost:4200/cards
  { path: '**', redirectTo: '', pathMatch: 'full' }   // tout le reste → redirige vers accueil (page 404 soft)
];
