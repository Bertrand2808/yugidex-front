# TD-02 — HTTP & Cartes : appeler l'API YGOProDeck
> Remplacer les données mock par de vrais appels HTTP avec HttpClient et RxJS
> Projet : `yugidex-front`

---

## Avant de commencer

Tu as un `CardService` qui retourne des données en dur. L'objectif : **appeler l'API YGOProDeck** pour avoir les vraies cartes Yu-Gi-Oh.

**Question** : l'API YGOProDeck est-elle la même que celle qu'appelle le backend Java ?

> **Oui et non**
> - Oui : le backend peut (et devrait) appeler exactement la même API YGOProDeck[](https://db.ygoprodeck.com/api/v7/cardinfo.php)
> - Non : dans un projet pro, **on ne laisse jamais le frontend appeler directement une API externe** (sécurité, cache, contrôle, authentification, limitation de taux).
> → Pour l'instant, on appelle directement depuis Angular (facile pour apprendre).
> → Plus tard, on changera l'URL pour pointer vers ton backend Java (`http://localhost:8080/api/cards` par ex.) qui fera le proxy + cache + logique métier.

**Rate limit de l'API YGOProDeck** (important !)
- 20 requêtes par seconde max
- Si tu dépasses → blocage IP pendant 1 heure
→ Dans ce TD, on appelle **une seule fois** au chargement → pas de souci.

## Étape 0 — Activer HttpClient dans l'application

[Documentation Officielle](https://angular.dev/guide/http)

Angular ne fournit pas `HttpClient` par défaut (pour garder l'app légère). Il faut l'activer globalement.

Ouvre `src/app/app.config.ts` :

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';   // ← importe ça

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),          // ← ajoute cette ligne (active HttpClient partout)
    // Plus tard : provideHttpClient(withInterceptors([...])) pour logs, auth, etc.
  ]
};
```

> **Tip Uncle Ben : Séparation des responsabilités**
On configure les "providers" globaux (comme HttpClient) une seule fois au niveau racine → tous les services et composants peuvent l'utiliser sans rien faire de plus. C'est le pattern Dependency Injection d'Angular.

**Exercice rapide** :

- Ajoute provideHttpClient() → sauvegarde → relance bun dev si besoin.
- Si tu oublies cette ligne et que tu injectes HttpClient → erreur claire dans la console :

```
NullInjectorError: No provider for HttpClient!
```

> **Tip VS Code (Mac / Windows)** :
> - Mac : Cmd + . (point) → Quick Fix → "Import HttpClient..."
> - Windows : Ctrl + . → même chose
> → VS Code propose souvent d'ajouter l'import + le provider automatiquement.

Voici une version **retravaillée et intégrée** de ta section **Étape 1 — Comprendre les Observables**, placée **avant** l’étape où on modifie le service pour l’API réelle. Elle est adaptée à des débutants (ton ami), avec des explications simples, des analogies, et des **tips** pour vous deux.

J’ai gardé l’esprit de ton brouillon, mais je l’ai rendu plus fluide, plus pédagogique, et aligné avec les **best practices 2026** (Signals en priorité pour l’UI, RxJS pour l’async, `toSignal` préféré à `async pipe` dans les nouveaux codes pour sa flexibilité + initialValue + pas d’import pipe).

---

## Étape 1 — Comprendre les Observables (avant de toucher à l’API)

### Concepts clés : Observable, subscribe, async pipe, RxJS... et pourquoi on préfère les Signals maintenant

Quand tu fais un appel HTTP avec `HttpClient`, Angular **ne te donne pas directement** la réponse (comme une Promise qui résout une fois).
Il te donne un **Observable** : un "flux" qui **promet** d’envoyer des données plus tard (ou plusieurs fois, ou jamais, ou avec des erreurs).

**Analogie simple** :
- Une **Promise** = "Je te livre une pizza dans 20 min" → une seule livraison.
- Un **Observable** = "Je te livre des pizzas toutes les fois que le cuisinier en fait une" → tu peux en recevoir 0, 1, 10... et tu peux arrêter de recevoir si tu sors du resto.

Exemple basique :

```ts
// Imaginons que getArticles() retourne un Observable
const articles$ = this.articleService.getArticles();  // ← $ = convention pour "c'est un Observable"

// Rien ne se passe encore ! L'Observable est "froid" (lazy)

// Pour recevoir les données, il faut "s'abonner" (subscribe)
articles$.subscribe({
  next: (reponse) => console.log('Articles reçus !', reponse),
  error: (err) => console.error('Oups, problème :', err),
  complete: () => console.log('Flux terminé, plus d\'articles à venir')
});
```

**Problème** : Si tu fais `subscribe()` dans un composant et que l'utilisateur change de page avant la réponse → tu as une **fuite mémoire** (l'abonnement reste actif).
→ Mauvaise idée en Angular.

### Les bonnes façons en Angular (2026)

**Méthode ancienne mais toujours valide : async pipe (dans le template)**

Le template s'abonne tout seul et se désabonne quand le composant disparaît.

```ts
// Dans le composant
articles$ = this.articleService.getArticles();  // Observable<{ data: Article[] }>

// Dans le template (HTML)
@if (articles$ | async; as data) {
  @for (article of data.data; track article.id) {
    <div>{{ article.title }}</div>
  }
} @else {
  <p>Chargement...</p>
}
```

→ Pas de `subscribe()` manuel → propre.
Mais :
- Tu dois importer `AsyncPipe` dans `imports: []` du composant
- Valeur initiale = `null` (pas pratique)
- Moins flexible si tu veux utiliser la valeur ailleurs (ex: computed, effect)

**Méthode moderne recommandée (Angular 17+ → 21)** : `toSignal()`

Transforme l'Observable en **Signal** → tout devient signal-based (plus simple, plus performant, futur-proof avec zoneless).

```ts
// Dans le composant (importe from '@angular/core/rxjs-interop')
import { toSignal } from '@angular/core/rxjs-interop';

// ...
articles = toSignal(
  this.articleService.getArticles(),
  { initialValue: { data: [] } }   // ← super pratique : valeur par défaut !
);

// articles est maintenant un ReadonlySignal<{ data: Article[] }>
```

Dans le template :

```html
@if (articles(); as response) {
  @if (response.data.length === 0) {
    <p>Aucune carte pour l'instant...</p>
  } @else {
    @for (article of response.data; track article.id) {
      <div>{{ article.title }} (ATK: {{ article.atk ?? '?' }})</div>
    }
  }
} @else {
  <p>Chargement en cours...</p>
}
```

→ Avantages clés (2026) :
- Pas besoin d'importer AsyncPipe
- Valeur initiale personnalisée (évite les `null` partout)
- Tu peux utiliser `articles()` dans des `computed()`, `effect()`, ou même le passer à un enfant
- Compatible avec le futur **zoneless** (change detection plus rapide)
- Moins de code boilerplate

> **Tip Uncle Ben** (architecture / clean code) :
> - **RxJS** = pour les flux async complexes (HTTP, timers, events, combinaisons)
> - **Signals** = pour l’état UI local / dérivé / réactif
→ Règle : RxJS dans les **services** (pour HTTP, etc.), puis `toSignal()` pour ramener dans le composant → UI 100% signals.

> **Tip VS Code** (Mac / Windows) :
> - Mac : `Cmd + .` → Quick Fix → "Import toSignal from rxjs-interop"
- Windows : `Ctrl + .` → même chose
→ Tape `toSig` → autocomplete direct.

### Pourquoi pas des Promises partout ?
Angular est construit autour des Observables depuis 2016 → écosystème RxJS énorme.
Mais avec Signals + `toSignal` / futur `resource()` (en preview 2026), on migre progressivement vers moins de RxJS dans les composants.

**Résumé en une phrase** :
Utilise `toSignal()` pour transformer tes Observables HTTP en Signals → ton template reste simple, réactif, et sans fuites mémoire.

---

## Étape 2 — Appeler l'API avec HttpClient

### Concepts clés : `HttpClient`, typage de la réponse, RxJS pipe/map

**HttpClient** est le service Angular pour faire des requêtes HTTP (GET, POST, etc.).
Il retourne toujours un **Observable** (comme vu à l'étape 1) → on le transforme avec `pipe()` et `map()` pour extraire ce qu'on veut.

**Analogie** :
`HttpClient` = le livreur.
Il t'apporte un colis emballé `{ data: [cartes], meta: ... }`.
Avec `pipe(map(...))` tu ouvres le colis et ne gardes que les cartes (`response.data`).

### 1. Définir les interfaces (dans `models/card.ts` ou directement dans `services/card.service.ts`)

Crée ou mets à jour `src/app/models/card.ts` :

```ts
// src/app/models/card.ts
export interface YgoApiResponse {
  data: Card[];          // Le tableau qu'on veut vraiment
  // meta?: { ... }      // infos pagination, etc. (optionnel pour nous)
}

export interface Card {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk: number | null;          // null pour sorts/pièges
  def: number | null;
  level: number | null;
  attribute: string | null;    // DARK, LIGHT...
  race: string;                // Spellcaster, Dragon...
  card_images?: CardImage[];   // tableau d'images (on prend souvent la première)
}

export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
}
```

> **Tip Uncle Ben** (clean code) :
Sépare les modèles dans un dossier `models/` ou `interfaces/` → réutilisables partout (service, composant, futur store).
C'est le **contrat** entre l'API et ton app : si l'API change, tu modifies un seul endroit.

### 2. Mettre à jour `CardService`

```ts
// src/app/services/card.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';   // ← importe map !

import { Card, YgoApiResponse } from '../models/card';   // adapte le chemin

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private http = inject(HttpClient);
  private readonly API_BASE = 'https://db.ygoprodeck.com/api/v7';

  // On oublie pas la doc de la méthode
  getCards(limit = 20): Observable<Card[]> {
    const url = `${this.API_BASE}/cardinfo.php?num=${limit}&offset=0`;
    return this.http.get<YgoApiResponse>(url).pipe(
      map(response => response.data)   // → on renvoie seulement le tableau Card[]
    );
  }

  /**
   * Recherche floue par nom (paramètre "fname" de l'API)
   * ex: "Dark" → Dark Magician, Dark Armed Dragon...
   */
  searchCards(query: string): Observable<Card[]> {
    if (!query.trim()) {
      return this.getCards(20);   // fallback : dernières cartes si recherche vide
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const url = `${this.API_BASE}/cardinfo.php?fname=${encodedQuery}&num=50`;  // limite à 50 pour perf
    return this.http.get<YgoApiResponse>(url).pipe(
      map(response => response.data)
    );
  }

  /**
   * Récupère UNE carte précise par son ID (passcode 8 chiffres)
   * L'API renvoie toujours { data: [une seule carte] }
   */
  getCardById(id: number): Observable<Card> {
    const url = `${this.API_BASE}/cardinfo.php?id=${id}`;
    return this.http.get<YgoApiResponse>(url).pipe(
      map(response => {
        if (response.data.length === 0) {
          throw new Error(`Aucune carte trouvée pour l'ID ${id}`);
        }
        return response.data[0];   // on prend le premier (et seul) élément
      })
    );
  }
}
```

**Notes API (2026)** :
- `fname` = fuzzy search (recherche partielle dans le nom)
- `id` = passcode exact (pas combinable avec fname ou name)
- `num` / `offset` = pagination (ex: `num=50&offset=100` pour page 3)
- Pas de paramètre `name` pour recherche partielle → `fname` est plus adapté

> **Tip Uncle Ben** (architecture) :
Les services **ne font que** : fetch + typage + transformation minimale.
Pas de logique UI (loading, error) ici → ça va dans le composant avec signaux.

### Exercice pas-à-pas

1. Mets à jour `models/card.ts` avec les interfaces ci-dessus.

2. Copie-colle le code du `CardService` (supprime l'ancien `getCards()` mock).

3. Dans `CardsComponent` (ou une page test) :
   ```ts
   cards = toSignal(this.cardService.getCards(30), { initialValue: [] });
   ```
   → Affiche `cards().length` et quelques noms dans le template.

4. Teste `searchCards` (bonus) :
   - Ajoute un input `<input (input)="onSearch($event.target.value)" />`
   - Dans le composant :
     ```ts
     onSearch(query: string) {
       this.cards = toSignal(this.cardService.searchCards(query), { initialValue: [] });
     }
     ```

5. Lance `bun dev` → va sur `/cards` → tu dois voir ~20 vraies cartes !

**Bonus rapide** (optionnel mais cool) :
- Ajoute un signal `loading = signal(true)` et passe à `false` quand `cards()` a des données.
- Affiche la première image : `<img [src]="card.card_images?.[0]?.image_url_small" alt="{{card.name}}" />`

**Pourquoi ?** C’est pour rendre ta liste de cartes plus vivante et visuelle dès maintenant (et ajouter un état de chargement réaliste) :

- **Le signal loading** :
Au début → loading = true → affiche "Chargement..." (évite un écran vide pendant 1–2 sec le temps que l’API réponde).
Quand cards() reçoit des données → passe à false automatiquement (via effect ou check dans le template).
→ Améliore l’UX : l’utilisateur sait que "ça bosse" au lieu de penser que c’est buggé.

- **L’image** `<img [src]="card.card_images?.[0]?.image_url_small" ... />` :
L’API YGOPRODeck renvoie un tableau card_images (avec image_url_small pour une version miniature légère ~100–150px).
?.[0]?. = safe navigation (opérateur Elvis) : si pas d’image ou tableau vide → pas d’erreur, juste rien.
Ça transforme ta liste "texte brut" en vraie galerie de cartes Yu-Gi-Oh! → beaucoup plus fun et proche du vrai Yugidex.
alt="{{card.name}}" = bonne pratique accessibilité (et SEO futur).

Voici la suite de ton TD, avec les deux étapes affinées pour des débutants (ton ami). J’ai intégré :

- Explications simples + analogies
- Corrections mineures (ex: `cards()` est un `ReadonlySignal<Card[]>` grâce à `toSignal` qui extrait `response.data`)
- Ajout du **loading** + **error** basique avec signaux (pour UX)
- Affichage d’images avec fallback + `loading="lazy"`
- Recherche réactive complète avec `debounceTime`, `switchMap`, `distinctUntilChanged`
- Imports RxJS + interop nécessaires
- Tips VS Code + Uncle Ben
- Exercice guidé

## Étape 3 — Afficher les cartes

### Concepts : `toSignal`, `@for`, property binding `[src]`, `@if` / `@else`

Maintenant que le service appelle l’API, on affiche les vraies cartes dans une grille sympa.

**Dans `cards.component.ts` (ou `cards.ts`)** :

```ts
// src/app/pages/cards/cards.component.ts
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardService } from '../../services/card.service';
import { Card } from '../../models/card';
import { CommonModule } from '@angular/common';  // pour @for, @if

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule],  // ← indispensable pour @for / @if
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']  // optionnel
})
export class CardsComponent {
  private cardService = inject(CardService);

  // toSignal : transforme l'Observable en Signal
  // initialValue évite null/undefined au démarrage
  cards = toSignal<Card[]>(
    this.cardService.getCards(50),  // limite à 50 pour perf + scroll infini futur
    { initialValue: [] }
  );

  // Signaux pour UX (loading / error)
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    // Quand cards change → on met à jour loading/error
    // (effect = réagit aux changements de signals)
    effect(() => {
      const data = this.cards();
      if (data?.length > 0) {
        this.loading.set(false);
      } else if (data?.length === 0 && !this.loading()) {
        this.error.set('Aucune carte trouvée');
      }
    });
  }
}
```

**Dans `cards.component.html`** :

```html
<div class="p-6 max-w-7xl mx-auto">
  <h1 class="text-3xl font-bold mb-6 text-center">Catalogue Yugidex</h1>

  @if (loading()) {
    <div class="text-center py-10">
      <p class="text-lg text-gray-600">Chargement des cartes magiques...</p>
      <!-- Tu peux ajouter un spinner Tailwind ou SVG plus tard -->
    </div>
  } @else if (error()) {
    <p class="text-center text-red-600 py-10">{{ error() }}</p>
  } @else if (cards().length === 0) {
    <p class="text-center text-gray-500 py-10">Aucune carte pour le moment...</p>
  } @else {
    <!-- Grille responsive -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      @for (card of cards(); track card.id) {
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
          <!-- Image avec fallback -->
          @if (card.card_images?.length > 0) {
            <img
              [src]="card.card_images[0].image_url_small"
              [alt]="card.name + ' artwork'"
              class="w-full h-64 object-contain bg-gray-100"
              loading="lazy"  <!-- charge seulement quand visible → perf scroll -->
            />
          } @else {
            <div class="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500">
              Pas d'image
            </div>
          }

          <div class="p-3">
            <p class="text-sm font-semibold truncate" [title]="card.name">
              {{ card.name }}
            </p>
            <p class="text-xs text-gray-600 mt-1">
              {{ card.type }}
            </p>
            @if (card.atk !== null || card.def !== null) {
              <p class="text-xs text-gray-500 mt-1">
                ATK {{ card.atk ?? '?' }} / DEF {{ card.def ?? '?' }}
              </p>
            }
          </div>
        </div>
      }
    </div>
  }
</div>
```

> **Tip Uncle Ben** (clean code) :
Utilise `@if` / `@else` pour gérer les états (loading, error, empty, data) → template clair, pas de `*ngIf` partout.
`track card.id` = optimisation perf Angular (évite de re-rendre toute la liste à chaque changement).

**Exercice** :
1. Copie le code ci-dessus.
2. Lance `bun dev` → va sur `/cards`.
3. Ouvre DevTools (F12) → onglet **Network** → cherche `cardinfo.php` → vérifie le statut 200 et la réponse JSON.
4. Scroll → observe que les images chargent paresseusement (`loading="lazy"`).

## Étape 4 — Recherche réactive

### Concepts : `debounceTime`, `switchMap`, `distinctUntilChanged`, `toObservable`

On veut une recherche **live** (au fil de la frappe), mais sans spammer l’API à chaque touche.
**Solution :** attendre que l’utilisateur arrête de taper (`debounce`) + annuler les recherches précédentes si nouvelle frappe (`switchMap`).

**Dans `cards.component.ts` (ajoute ça)** :

```ts
// Imports supplémentaires
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';  // pour retourner un Observable vide

// Dans la classe :
searchQuery = signal<string>('');

// Observable réactif à partir du signal
private search$ = toObservable(this.searchQuery).pipe(
  debounceTime(300),             // attends 300ms sans frappe
  distinctUntilChanged(),        // ignore si même valeur
  switchMap(query => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return of([]);               // < 2 lettres → reset liste
    }
    return this.cardService.searchCards(trimmed);
  })
);

// Remplace cards par la version recherche
cards = toSignal(this.search$, { initialValue: [] });
```

**Dans le template (ajoute en haut)** :

```html
<!-- Au-dessus de la grille -->
<div class="mb-6">
  <input
    type="text"
    placeholder="Chercher une carte (ex: Blue-Eyes, Dark Magician...)"
    class="w-full max-w-md mx-auto block border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    (input)="searchQuery.set($any($event.target).value)"
  />
</div>
```

> **Tip Uncle Ben** (architecture) :
`switchMap` = roi des recherches : il **switch** vers la nouvelle requête et **annule** l’ancienne automatiquement → pas de réponses dans le désordre, perf optimale.
`debounceTime` + `distinctUntilChanged` = évite les appels inutiles (ex: taper "dra" → "drag" → "drago" sans attendre).

### Exercice :
1. Ajoute le code ci-dessus.
2. Teste : tape "Dragon" → attends ~300ms → liste se met à jour.
3. Tape vite → seule la dernière recherche compte (regarde Network : peu d’appels).
4. Efface le champ → liste vide (ou fallback à `getCards()` si tu modifies `searchCards` pour ça).

**Bonus futur** : Ajoute un bouton "Voir plus" ou infinite scroll avec `offset` + `num`.

---

## Étape 5 — Page de détail d'une carte

### Concepts : paramètres de route `:id`, `input()` (route inputs), `ActivatedRoute` (optionnel), navigation avec `routerLink`

**Objectif** : Quand on clique sur une carte dans la liste `/cards`, on va sur `/cards/89631139` (ex: ID de Dark Magician) → affiche les détails complets (grande image, description, stats...).

**Pourquoi c'est cool** :
- Pas besoin de `subscribe` manuel aux params
- Le paramètre `:id` arrive **directement comme un signal input** dans le composant
- Navigation fluide (SPA) avec `routerLink`

### 1. Générer le composant détail

```bash
bunx ng g c pages/card-detail --standalone
# ou npx ng g c pages/card-detail
```

Ça crée `src/app/pages/card-detail/card-detail.component.ts` (et .html, .scss).

### 2. Ajouter la route paramétrée dans `app.routes.ts`

Pas besoin d'exemple on connait, non ?

### 3. Activer les **route inputs** (binding automatique)

Ouvre `src/app/app.config.ts` (ou `main.ts` si tu configures ailleurs) et ajoute `withComponentInputBinding()` :

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';  // ← importe withComponentInputBinding
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),  // ← ajoute cette feature !
    provideHttpClient()
  ]
};
```

> **Tip Uncle Ben** (architecture) :
`withComponentInputBinding()` = le routeur **injecte automatiquement** les params (`:id`), query params, data, resolvers... comme des `@Input()` ou `input()` dans tes composants.
Moins de code, moins d'injections, plus testable → clean code level up !

### 4. Le composant `CardDetailComponent`

```ts
// src/app/pages/card-detail/card-detail.component.ts
import { Component, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardService } from '../../services/card.service';
import { Card } from '../../models/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-detail.component.html',
  styleUrls: ['./card-detail.component.scss']
})
export class CardDetailComponent {
  // input() = signal input (Angular 17+)
  // Le nom 'id' matche exactement le param :id de la route → binding auto !
  id = input.required<number>();   // ← magique : reçoit le :id de l'URL

  private cardService = inject(CardService);

  // Charge la carte via le service (Observable → Signal)
  card = toSignal(
    this.cardService.getCardById(this.id()),  // this.id() lit le signal
    { initialValue: null }
  );
}
```

**Note** : `this.id()` est un signal → il réagit automatiquement si l'URL change (ex: navigation vers une autre carte sans recharger la page).

### 5. Le template `card-detail.component.html` (détail sympa)

```html
<div class="p-6 max-w-5xl mx-auto">
  @if (card(); as cardData) {
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      <!-- Grande image -->
      <div class="bg-gray-100 p-8 flex justify-center">
        @if (cardData.card_images?.length > 0) {
          <img
            [src]="cardData.card_images[0].image_url"
            [alt]="cardData.name + ' full artwork'"
            class="max-h-[500px] object-contain"
          />
        } @else {
          <div class="h-96 w-full bg-gray-200 flex items-center justify-center text-gray-500">
            Pas d'image disponible
          </div>
        }
      </div>

      <!-- Infos -->
      <div class="p-6">
        <h1 class="text-3xl font-bold mb-4">{{ cardData.name }}</h1>

        <p class="text-lg mb-4"><strong>Type :</strong> {{ cardData.type }}</p>

        @if (cardData.attribute) {
          <p><strong>Attribut :</strong> {{ cardData.attribute }}</p>
        }
        @if (cardData.race) {
          <p><strong>Race :</strong> {{ cardData.race }}</p>
        }
        @if (cardData.level) {
          <p><strong>Niveau :</strong> {{ cardData.level }}</p>
        }
        @if (cardData.atk !== null || cardData.def !== null) {
          <p class="text-xl font-semibold mt-4">
            ATK {{ cardData.atk ?? '?' }} / DEF {{ cardData.def ?? '?' }}
          </p>
        }

        <div class="mt-6">
          <h2 class="text-xl font-semibold mb-2">Description / Effet</h2>
          <p class="text-gray-700 whitespace-pre-line">{{ cardData.desc }}</p>
        </div>
      </div>
    </div>
  } @else if (card() === null) {
    <div class="text-center py-20">
      <p class="text-xl text-gray-600">Chargement de la carte...</p>
    </div>
  } @else {
    <p class="text-center text-red-600 py-20">Carte non trouvée (ID: {{ id() }})</p>
  }

  <!-- Bouton retour -->
  <div class="mt-8 text-center">
    <a routerLink="/cards" class="text-blue-600 hover:underline">← Retour à la liste</a>
  </div>
</div>
```

### 6. Rendre les cartes cliquables dans `cards.component.html`

Dans la boucle `@for` (autour de la div carte) :

```html
<!-- Remplace la div carte par ça (ou ajoute routerLink sur la div entière) -->
<a
  [routerLink]="['/cards', card.id]"
  class="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
>
  <!-- Ton contenu image + nom + atk/def reste ici -->
</a>
```

Ou sur la div :

```html
<div
  [routerLink]="['/cards', card.id]"
  class="... cursor-pointer"
>
  ...
</div>
```

## Exercice final du TD 2

1. Génère `card-detail` et ajoute la route `/cards/:id`.
2. Active `withComponentInputBinding()` dans `provideRouter`.
3. Implémente `CardDetailComponent` avec `id = input.required<number>()` et `card = toSignal(...)`.
4. Dans `cards.html` : rends chaque carte cliquable avec `[routerLink]="['/cards', card.id]"`.
5. Teste :
   - Clique sur une carte → va sur `/cards/89631139` → voit les détails.
   - Vérifie Network : appel à `cardinfo.php?id=...`
   - Retour via le lien ou bouton back navigateur.

**Félicitations !**
Tu as maintenant :
- Liste paginée/recherche réactive
- Détail carte avec routing param
- Tout réactif avec signals
- API réelle YGOProDeck
