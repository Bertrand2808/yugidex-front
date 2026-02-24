# TD-01 — Angular : Bases
> Comprendre la structure d'un projet Angular 21 et créer tes premiers composants
> Projet : `yugidex-front`

---

## Avant de commencer — Lancer l'application

On va utiliser bun à la place de npm.

```bash
# Si tu crées le projet maintenant (pas notre cas)
ng new yugidex-front --package-manager=bun --style=scss --routing=true

# Ensuite dans le dossier du projet
bun install          # ≈ npm install
bun run start        # ≈ npm start
# ou même juste :
bun dev              # raccourci très courant avec Bun

# Ouvre http://localhost:4200 dans ton navigateur
```

Normalement, la page de démarrage Angular s'affiche, on va comprendre comment elle fonctionne.

---

## Étape 0 — La structure du projet

### Concepts : organisation Angular, fichiers de configuration

```
yugidex-front/
├── src/
│   ├── app/
│   │   ├── app.ts           ← composant racine
│   │   ├── app.html         ← template du composant racine
│   │   ├── app.css          ← styles du composant racine
│   │   ├── app.config.ts    ← configuration de l'application
│   │   └── app.routes.ts    ← définition des routes
│   ├── styles.css           ← styles globaux (importe Tailwind)
│   ├── index.html           ← page HTML hôte
│   └── main.ts              ← point d'entrée (bootstrap)
├── angular.json             ← config Angular CLI
└── package.json             ← dépendances npm
```

**Questions à explorer** :
1. Ouvre `src/index.html` — tu vois `<app-root>`. D'où vient ce tag ?
2. Ouvre `src/app/app.ts` — que fait le décorateur `@Component` ?
3. Ouvre `src/app/app.html` — quel contenu est déjà là ?

1. **`<app-root>`** vient du champ `selector: 'app-root'` dans le composant. Angular remplace ce tag par le template du composant.
2. Le décorateur `@Component` est une fonction qui prend un objet en paramètre et qui ajoute des métadonnées au composant.
3. Le contenu de `app.html` est le template du composant.

### Résumé : c'est quoi Angular ?

Concrètement, Angular fonctionne avec des composants. Ces composants sont comme des briques LEGO intelligente. Une brique a :
- Sa **forme** (HTML template)
- Sa **couleur** (CSS/SCSS)
- Son **cerveau** (TypeScript)

> Bah c'est quoi la différence avec une application html/css/js classique?

La différence majeure avec du **HTML/CSS/JS** classique, c'est que **tout est encapsulé et réutilisable** : tu crées une brique "Carte Pokémon" une fois, et tu peux l'afficher 50 fois sur la page boutique, 3 fois dans le panier, etc. sans dupliquer le code.

---

## Étape 1 — Comprendre un composant

### Concepts : `@Component`, selector, template, styles, standalone

Un composant Angular = 3 fichiers qui vont ensemble :

```typescript
// app.ts — la LOGIQUE
@Component({
  selector: 'app-root',
  //         ^^^^^^^^^
  //         Le tag HTML qui représente ce composant : <app-root>

  standalone: true,
  //          ^^^^
  //          Angular 21 : composants autonomes (pas besoin de NgModule)

  imports: [RouterOutlet],
  //         ^^^^^^^^^^^
  //         Ce composant utilise RouterOutlet → il faut l'importer

  templateUrl: './app.html',
  //            ^^^^^^^^^^^
  //            Fichier HTML du template

  styleUrl: './app.css'
  //         ^^^^^^^^^
  //         Fichier CSS du composant (encapsulé, n'affecte pas les autres)
})
export class App {
  title = signal('yugidex-front');
  //       ^^^^^^
  //       Un "signal" Angular = valeur réactive (voir Étape 3)
}
```

```html
<!-- app.html — le TEMPLATE -->
<!-- Contenu de la page. Accès aux propriétés de la classe avec {{ }} -->
<h1>{{ title() }}</h1>
<!--  ^^^^^^^^^
      On "appelle" le signal pour lire sa valeur (comme une fonction) -->
```

**Exercice** : remplace le contenu de `app.html` par :
```html
<h1>YugiDex</h1>
<p>Mon Pokédex Yu-Gi-Oh !</p>
```

Observe que la page se met à jour automatiquement dans le navigateur (**Hot Reload**).

---

## Étape 2 — Créer un composant

### Concepts : `ng generate`, arborescence, conventions de nommage

Angular CLI génère les fichiers pour toi :

```bash
# Créer un composant "navbar"
npx ng generate component components/navbar

# Raccourci
npx ng g c components/navbar
```

Ça crée :
```
src/app/components/navbar/
├── navbar.ts
├── navbar.html
├── navbar.css
└── navbar.spec.ts    ← fichier de test (on y reviendra)
```

**Convention** : un composant par dossier, dossier en kebab-case, fichier sans suffixe `.component` (Angular 21).

### Tâches à faire

**Exercice** : génère trois composants :
- `components/navbar` — barre de navigation
- `pages/home` — page d'accueil
- `pages/cards` — page catalogue de cartes

**Exercice 2** : dans `navbar.html`, crée une navbar simple avec Tailwind :

```html
<!-- Hint : utilise les classes Tailwind suivantes -->
<!-- bg-gray-900 text-white p-4 flex justify-between items-center -->
<!-- Pour les liens : text-yellow-400 hover:text-yellow-200 -->

<!-- À toi de structurer le HTML ! Le résultat attendu : -->
<!-- [ YugiDex ]          [ Accueil | Cartes | Decks ] -->
```

> **Tailwind** : au lieu d'écrire du CSS, tu utilises des classes utilitaires directement dans le HTML. `bg-gray-900` = `background-color: #111827`. [Référence Tailwind](https://tailwindcss.com/docs)

---

## Étape 3 — Les Signals

**Objectif** : Comprendre comment Angular sait automatiquement quand et quoi mettre à jour à l'écran quand une donnée change.
On va découvrir ça **pas à pas**, comme une petite histoire.

### Timeline : Comment les Signals fonctionnent en 5 étapes simples

**Étape 1 — Avant les signals (le monde d’avant)**
Imaginons que tu as un compteur de cartes dans le panier :

```ts
cartCount = 0;
```

Tu changes la valeur :

```ts
this.cartCount = this.cartCount + 1;
```

→ **Rien ne se passe à l'écran** ! Angular ne sait pas automatiquement qu'il doit rafraîchir le HTML.
Avant, il fallait utiliser des outils comme `ChangeDetectorRef` ou RxJS pour forcer la mise à jour. C’était lourd.

**Étape 2 — On crée un signal (le héros principal)**

Un **signal**, c’est une valeur **intelligente** qui dit à Angular :
« Hé, surveille-moi ! Chaque fois que je change, préviens tout le monde qui m’utilise. »

On crée un signal comme ça :

```ts
import { signal } from '@angular/core'; // ← import le signal

cartCount = signal(0);   // ← c'est tout !
// cartCount est maintenant un "signal writable" initialisé à 0
```

→ `signal(valeurInitiale)` crée un **signal modifiable**.

**Étape 3 — Lire la valeur d’un signal (important !)**
Pour **lire** la valeur, on appelle le signal **comme une fonction** (avec `()` ) :

```ts
console.log( this.cartCount() );     // affiche 0
```

Dans le **template HTML** aussi, on met toujours `()` comme si on appelait une fonction :

```html
<p>Cartes dans le panier : {{ cartCount() }}</p>
```

**Étape 4 — Modifier le signal (les deux façons classiques)**

Il y a **deux méthodes** pour changer la valeur :

1. `.set(valeur)` → je remplace complètement
2. `.update(fonction)` → je calcule à partir de l’ancienne valeur (souvent plus sûr)

```ts
// Méthode 1 : tout remplacer
this.cartCount.set(5);               // panier = 5 cartes

// Méthode 2 : mise à jour basée sur l’ancienne valeur (la plus utilisée !)
this.cartCount.update( ancien => ancien + 1 );   // +1 carte
```

→ Dès que tu fais `.set()` ou `.update()`, **Angular sait automatiquement** qu’il doit recharger les endroits du HTML qui utilisent `cartCount()` → l’écran se met à jour tout seul !

**Étape 5 — Les computed : des valeurs qui dépendent d’autres (la vraie magie)**

Parfois on veut une valeur qui **dépend** d’un autre signal.
Exemple : « nombre de cartes × prix unitaire = total ».

On utilise `computed()` :

```ts
import { computed } from '@angular/core';

pricePerCard = signal(4.99);           // prix d'une carte

totalPrice = computed(() => {
  return this.cartCount() * this.pricePerCard();
});
```

→ `totalPrice` est **lu** comme un signal normal : `totalPrice()`

```html
<p>Total panier : {{ totalPrice() | number:'1.2-2' }} €</p>
```

**Règles importantes des computed (à retenir) :**
- C’est **automatique** : si `cartCount` ou `pricePerCard` change → `totalPrice` se recalcule tout seul
- C’est **paresseux** (lazy) : le calcul ne se fait **que** quand on lit `totalPrice()`
- C’est **read-only** : on ne peut **pas** faire `totalPrice.set(100)` → erreur !

### Exemple complet : un mini panier de carte Pokémon

```ts
// cart.component.ts
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-cart',
  standalone: true,
  template: `
    <h2>Panier Pokémon</h2>

    <p>Nombre de cartes : {{ cartCount() }}</p>
    <p>Prix par carte : {{ pricePerCard() | number:'1.2-2' }} €</p>
    <p><strong>Total : {{ totalPrice() | number:'1.2-2' }} €</strong></p>

    <button (click)="addOneCard()">Ajouter une carte</button>
  `
})
export class CartComponent {
  cartCount     = signal(0);
  pricePerCard  = signal(4.99);

  totalPrice = computed(() => this.cartCount() * this.pricePerCard());

  addOneCard() {
    this.cartCount.update(count => count + 1);
    // ← Dès que cette ligne s'exécute → Angular met à jour :
    //    - le {{ cartCount() }}
    //    - le {{ totalPrice() }}
  }
}
```

### Résumé en une phrase par notion

- **signal()** = une valeur intelligente et modifiable
- **.set()** ou **.update()** = changer la valeur → l'écran suit tout seul
- **computed()** = une valeur calculée qui dépend d'autres signaux → recalcul auto + lecture avec `()`
- Dans le HTML → toujours `signalName()` (jamais sans les parenthèses !)

### Tâches à faire

**Exercice** : dans le composant `home`, crée un signal `searchQuery = signal('')`. Affiche sa valeur dans le template.

Ajoute un champ de texte (de recherche) qui met à jour le signal à chaque frappe :

```html
<!-- Hint : utilise (input) pour réagir à chaque frappe clavier -->
<!-- event.target.value donne la valeur actuelle du champ -->
<input
  type="text"
  placeholder="Chercher une carte..."
  (input)="/* à toi de compléter */"
/>
<p>Recherche : {{ searchQuery() }}</p>
```

---

## Étape 4 — Le Routing : naviguer entre les pages sans recharger

**Objectif** : Permettre à l'utilisateur de passer d'une page à l'autre (Accueil → Liste des cartes → etc.) en changeant juste l'URL, sans recharger toute la page (c'est ça une **Single Page Application** = SPA).

### Concepts clés en 3 points simples

1. **Les routes** : un tableau qui dit « si l'URL est ça → affiche ce composant »
2. **`<router-outlet />`** : l'endroit dans ton HTML où Angular va **insérer** le composant correspondant à l'URL actuelle
3. **`<a routerLink="...">`** : pour créer des liens qui naviguent **sans recharger** la page (contrairement à un simple `<a href>`)

### 1. Configurer les routes (fichier `app.routes.ts`)

Crée ou modifie `src/app/app.routes.ts` :

```ts
import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';  // adapte le chemin selon ton arborescence
import { CardsComponent } from './pages/cards/cards.component';

export const routes: Routes = [
  { path: '',          component: HomeComponent },     // http://localhost:4200/
  { path: 'cards',     component: CardsComponent },    // http://localhost:4200/cards
  { path: '**',        redirectTo: '', pathMatch: 'full' }   // tout le reste → redirige vers accueil (page 404 soft)
];
```

**Astuce 2026** : On utilise des **composants standalone** (c'est la norme maintenant). Pas besoin d'importer `RouterModule` nulle part ici.

### 2. Placer le `<router-outlet>` dans `app.component.html`

C'est le "trou magique" où les pages s'affichent :

```html
<!-- src/app/app.component.html -->
<app-navbar />

<main class="container mx-auto p-4">
  <router-outlet />
  <!-- ↑ Angular met ici HomeComponent ou CardsComponent selon l'URL -->
</main>
```

### 3. Créer des liens avec `routerLink` (dans `navbar.component.html`)

```html
<!-- src/app/navbar/navbar.component.html -->
<nav class="bg-gray-800 text-white p-4">
  <div class="flex justify-between items-center">
    <div class="text-xl font-bold">Yugidex</div>

    <div class="space-x-6">
      <!-- routerLink = navigation Angular (SPA) -->
      <a routerLink="/"             >Accueil</a>
      <a routerLink="/cards"        >Cartes</a>
      <!-- Exemple futur : <a routerLink="/cart">Panier ({{ cartCount() }})</a> -->
    </div>
  </div>
</nav>
```

**Important** :
- On écrit `routerLink="/cards"` (ou `routerLink="cards"`) → **pas** `href="/cards"`
- `href` rechargerait la page entière → mauvais pour une SPA
- `routerLink` change l'URL + affiche le bon composant **sans recharger**

### 4. Imports obligatoires (standalone mode)

Dans chaque composant qui utilise ces directives, il faut **importer** :

- Dans `app.component.ts` (pour `<router-outlet>`) :

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}
```

- Dans `navbar.component.ts` (pour `routerLink`) :

```ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],           // ← indispensable ici !
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {}
```

### Exercice pas-à-pas (à faire maintenant)

1. Crée les composants si besoin (déjà fait à l'étape 2):
   ```bash
   bunx ng g c pages/home --standalone
   bunx ng g c pages/cards --standalone
   ```

2. Mets à jour `app.routes.ts` avec les 2 routes ci-dessus (importe tes composants).

3. Ajoute `<router-outlet />` dans `app.component.html` (sous la navbar).

4. Dans `navbar.component.html`, remplace tes `<a href>` par `<a routerLink>`.

5. Dans `navbar.component.ts` → ajoute `RouterLink` dans `imports: []`.

6. Dans `app.component.ts` → ajoute `RouterOutlet` (et `NavbarComponent`) dans `imports: []`.

7. Lance `bun dev` → teste :
   - Clique sur "Accueil" → doit afficher le contenu de HomeComponent
   - Clique sur "Cartes" → doit afficher CardsComponent
   - Tape `/trucbidule` dans l'URL → redirige vers `/`

**Bonus rapide (optionnel mais stylé)** : styliser le lien actif

Ajoute `RouterLinkActive` :

```html
<a routerLink="/" routerLinkActive="text-yellow-400 font-bold">Accueil</a>
<a routerLink="/cards" routerLinkActive="text-yellow-400 font-bold">Cartes</a>
```

→ Le lien actif devient jaune et gras automatiquement !

### Résumé en 30 secondes

- Routes → tableau dans `app.routes.ts`
- `<router-outlet>` → placeholder pour les pages
- `routerLink` → liens SPA (pas href)
- Imports → `RouterOutlet` et `RouterLink` dans les `imports: []` des composants standalone

---

## Étape 5 — Les Services : la boîte à outils partagée

**Objectif** : Apprendre à extraire la logique métier (comme récupérer des données) hors des composants, pour que ton code reste propre, réutilisable et testable.

Imagine l'application Yugidex comme une boutique :
- Les **composants** = les vitrines et les caisses (ils affichent et réagissent)
- Les **services** = l'arrière-boutique et l'entrepôt (ils gèrent les stocks, les listes de produits, les appels au fournisseur)

Un service **ne touche jamais le HTML** — il ne fait que **fournir des données ou des fonctions**.

### Concepts clés en 3 points simples

1. **@Injectable()** → dit à Angular « cette classe peut être injectée partout »
2. **providedIn: 'root'** → crée **une seule instance** (singleton) partagée dans toute l'app (c'est la méthode recommandée en 2026)
3. **inject()** → la nouvelle façon simple (depuis Angular ~14–15, devenue standard) d'obtenir le service dans un composant

### 1. Créer un Service

Génère-le avec Angular CLI :

```bash
bunx ng generate service services/card
# ou npx ng g s services/card
```

Ça crée `src/app/services/card.service.ts` :

```ts
// src/app/services/card.service.ts
import { Injectable } from '@angular/core';

import { Card } from '../models/card';  // on va créer cette interface juste après

@Injectable({
  providedIn: 'root'   // ← singleton pour toute l'application
})
export class CardService {
  // Pour l'instant : données mock (fausses cartes). Plus tard → appel API
  getCards(): Card[] {
    return [
      { id: 89631139, name: 'Dark Magician', type: 'Normal Monster', atk: 2500 },
      { id: 89631140, name: 'Blue-Eyes White Dragon', type: 'Normal Monster', atk: 3000 },
      { id: 12345678, name: 'Exodia the Forbidden One', type: 'Effect Monster', atk: 1000 }
    ];
  }

  // Plus tard on pourra ajouter : addCard(), searchCards(), etc.
}
```

### 2. Créer une interface pour typer les données (bon réflexe !)

Crée un fichier `src/app/models/card.ts` :

```ts
export interface Card {
  id: number;
  name: string;
  type: string;
  atk: number;
  // Plus tard : def?: number; imageUrl?: string; etc.
}
```

**Pourquoi créer ce genre de fichier ?**

Voici les vraies raisons :

1. **Typage fort = moins d’erreurs stupides**
   Grâce à TypeScript, si tu écris `card.namme` (faute de frappe) ou `card.atk = "2500"` (string au lieu de number), **l’éditeur te prévient tout de suite** avant même de lancer l’app.

2. **Le code se comprend tout seul**
   Quand tu vois `Card` partout (dans le service, le composant, le signal…), tout le monde (toi dans 3 mois, ton binôme, ton prof) sait exactement quelles propriétés une carte a : `id`, `name`, `type`, `atk`. Pas besoin de deviner ou de chercher.

3. **Auto-complétion magique dans VS Code / WebStorm**
   Tu tapes `card.` → boom, tu vois direct `id`, `name`, `atk` dans la liste. Tu gagnes du temps et tu fais moins de fautes.

4. **Prépare l’avenir sans douleur**
   Quand tu ajouteras plus tard `def`, `imageUrl`, `level`, `attribute`, `description`…
   → Tu modifies **un seul endroit** (`card.ts`) et tout le projet est mis à jour automatiquement (pas de chercher/remplacer dans 15 fichiers).

5. **C’est la norme Angular professionnelle**
   Presque tous les projets Angular sérieux ont un dossier `models/` ou `interfaces/` avec des interfaces pour chaque entité métier (Card, User, Order, Product…). Ça rend le code plus propre et maintenable.

**En une phrase :**
Créer `Card` dans `models/card.ts`, c’est comme écrire la **carte d’identité officielle** de chaque carte Yu-Gi-Oh! → tout le monde la respecte, ça évite les bugs, et ça fait pro.

Sans interface → c’est du JavaScript "any" déguisé en TS : ça marche… mais tu perds tous les super-pouvoirs de TypeScript.

### 3. Utiliser le Service dans un Composant (avec `inject()`)

Dans `cards.component.ts` (ou `cards.page.ts` selon ton nommage) :

```ts
// src/app/pages/cards/cards.component.ts
import { Component, signal } from '@angular/core';
import { CardService } from '../../services/card.service';   // adapte le chemin
import { Card } from '../../models/card';

@Component({
  selector: 'app-cards',
  standalone: true,
  template: `
    <h2>Liste des cartes Yugidex</h2>

    @if (cards().length === 0) {
      <p>Chargement des cartes...</p>
    } @else {
      @for (card of cards(); track card.id) {
        <div class="border p-4 m-2 rounded shadow">
          <strong>{{ card.name }}</strong> (ATK: {{ card.atk }})
          <br>
          <small>Type : {{ card.type }}</small>
        </div>
      }
    }
  `
})
export class CardsComponent {
  // Signal pour stocker la liste (réactif !)
  cards = signal<Card[]>([]);

  // Injection moderne : pas besoin de constructor !
  private cardService = inject(CardService);

  constructor() {
    // Charge les cartes dès que le composant est créé
    this.cards.set(this.cardService.getCards());
  }
}
```

**Pourquoi `inject()` est génial en 2026 ?**
- Plus court que le vieux `constructor(private cardService: CardService) {}`
- Fonctionne directement dans les propriétés de classe
- Très clair pour les débutants

### Exercice pas-à-pas (à faire maintenant)

1. Génère le service :
   ```bash
   bunx ng g s services/card --standalone   # (optionnel mais propre)
   ```

2. Crée le fichier `models/card.ts` avec l'interface `Card` (comme ci-dessus).

3. Mets à jour `card.service.ts` avec la méthode `getCards()` et les 3 cartes mock.

4. Dans `cards.component.ts` :
   - Importe `CardService` et `Card`
   - Ajoute `private cardService = inject(CardService);`
   - Dans le `constructor()`, charge les cartes avec `this.cards.set(...)`

5. Dans le template de `CardsComponent` :
   - Utilise `@for` pour boucler sur `cards()`
   - Affiche au moins `name`, `atk` et `type`
   - Bonus : ajoute un petit style (border, padding, etc.)

6. Lance `bun dev` → va sur `/cards` → tu dois voir la liste des 3 cartes !

**Astuce anti-blocage** :
Si rien ne s’affiche → vérifie :
- Le chemin d’import de `CardService` est correct
- Tu as bien ajouté `CardsComponent` dans tes routes (`app.routes.ts`)
- Pas d’erreur dans la console du navigateur (F12)

### Résumé rapide

- **Service** = classe `@Injectable({ providedIn: 'root' })` pour partager logique/données
- **inject(Service)** = façon moderne d’obtenir le service dans un composant
- **Règle d’or** : les composants gèrent l’**affichage** et les **interactions** ; les services gèrent les **données** et la **logique métier**

---

## Prochaine étape

**TD-02 — HTTP & Cartes** : remplacer les données mock par de vrais appels à l'API YGOProDeck, découvrir `HttpClient`, les `Observable`, et la programmation réactive avec RxJS.
