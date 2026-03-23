import { Component, inject, signal } from '@angular/core';
import { CardService } from '../../services/card.service';
import { Card } from '../../models/card';
@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [],
  templateUrl: './cards.html',
  styleUrl: './cards.css',
})
export class Cards {

  // Signal pour stocker la liste des cartes
  cards = signal<Card[]>([]);

  // Injection moderne = pas de constructeur
  private cardService = inject(CardService);

  constructor() {
    // Charge les cartes dès que le composant est créé
    this.cards.set(this.cardService.getCards())
  }

}
