import { Component, signal} from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  // Signal pour stocker la valeur des inputs de recherche
  searchQuery = signal('');
}
