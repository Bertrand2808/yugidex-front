import { Injectable } from '@angular/core';

import { Card } from '../models/card';

/**
 * Card manager service
 * * This service centralizes the retrieval and manipulation of card-related data.
 * Currently, it provides static (mock) data, but it is intended to
 * interact with a REST API via HttpClient.
 */
@Injectable({
  providedIn: 'root',
})
export class CardService {

  /**
   * Get the list of all available cards
   * @returns {Card[]} An Array of the interface {@link Card}.
   * @example
   * // Example of use of this service
   * const cards = this.cardService.getCards();
   */
  getCards(): Card[] {
    return [
      { id: 89631139, name: 'Dark Magician', type: 'Normal Monster', atk: 2500 },
      { id: 89631140, name: 'Blue-Eyes White Dragon', type: 'Normal Monster', atk: 3000 },
      { id: 12345678, name: 'Exodia the Forbidden One', type: 'Effect Monster', atk: 1000 }
    ];
  }
}
