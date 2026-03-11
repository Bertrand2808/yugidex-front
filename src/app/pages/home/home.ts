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

  onSearch(event: Event) {
    const valueOfQuery = (event.target as HTMLInputElement).value;
    console.log("Nouvelle valeur saisie : ", valueOfQuery);
    this.searchQuery.set(valueOfQuery);
    console.log("Signal mis à jour : ", this.searchQuery());
  }

}
