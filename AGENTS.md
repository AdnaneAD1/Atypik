# Règles du projet Atypik

Application Next.js 15 / React 18 / TypeScript — transport sécurisé pour enfants.
Stack : Firebase (Auth, Firestore, FCM), Capacitor Android, Tailwind + Radix UI, PayPal, Google Maps, Netlify.

**Contexte critique : données de mineurs et géolocalisation en temps réel. La sécurité n'est pas optionnelle.**

## Principes non négociables

- **SOLID** : une fonction = une responsabilité. Composants découplés, dépendances injectées via props/hooks, pas de logique métier dans les composants UI.
- **DICP** (Disponibilité, Intégrité, Confidentialité, Preuve) : toute donnée utilisateur est validée (zod), protégée côté Firestore (règles), jamais loguée en clair. Toute action sensible (paiement, trajet, enfant) doit être traçable.
- **STRIDE** : avant tout merge, se poser la question — ce code peut-il permettre un spoofing d'identité, une altération de données, une fuite d'info, un déni de service ou une élévation de privilège ? Voir `/security-review`.
- **Clarté** : code auto-documenté, noms explicites en français pour le métier (trajet, enfant, conducteur), en anglais pour la technique. Pas de code mort, pas de `any` sans justification.
- **Design** : jamais d'esthétique "générée par IA" — UI moderne, épurée, classe. Voir `/design`. En cas de doute, sobre > spectaculaire.
- **Disponibilité & performance** : tout ce qui est développé doit être hautement disponible et rapide à l'exécution. Dégradation gracieuse (une API externe qui tombe ne bloque jamais le parcours utilisateur), debounce + AbortController sur les appels réseau répétés, lazy-loading des composants lourds, `next/image` pour toute image, pas de re-renders ni de listeners inutiles, pas de spinner bloquant sans raison.
- **Honnêteté** : si l'existant est bon, le dire et ne rien changer. Signaler quand une demande dégrade la qualité. Ne jamais valider par complaisance ni inventer un problème pour justifier du travail.

## Tests (obligatoires)

- **Toute fonction, composant ou hook nouveau DOIT avoir ses tests unitaires** dans `__tests__/` à côté du fichier testé.
- Framework : Vitest + Testing Library — `npm run test` (watch) / `npm run test:run` (CI).
- **Avant chaque push : `npm run lint` + `npm run test:run` + `npm run build` — tout doit être vert.** Un push avec des tests en échec est interdit.
- Un test = un comportement observable (ce que fait l'utilisateur), pas d'implémentation interne.
- Mocker les dépendances externes (Firebase, fetch, Capacitor) — les tests doivent passer hors-ligne.

## Discipline de commit

- **Un commit = une unité fonctionnelle** (une fonction, un composant, un fix). Jamais de commit "fourre-tout".
- Le code et ses tests sont commités **ensemble** dans le même commit.
- Format Conventional Commits : `feat:`, `fix:`, `refactor:`, `security:`, `chore:`, `docs:`, `test:` + scope — ex. `feat(trajets): ajouter validation du créneau horaire`.
- `npm run lint` et `npm run test:run` doivent passer avant chaque commit.
- Jamais de secrets, clés ou données personnelles dans le code ou les messages de commit.

## Skills disponibles

- `/feature-dev` — workflow complet de développement d'une fonctionnalité (analyse → SOLID → sécurité → commits atomiques)
- `/security-review` — revue STRIDE + DICP d'un diff avant commit ou merge
- `/commit` — commit atomique conforme à la discipline ci-dessus
- `/design` — standards UI du projet : créer ou modifier une interface sans esthétique "IA"

## Commandes

- Lint : `npm run lint` — Build : `npm run build` — Dev : `npm run dev`
- Tests : `npm run test` (watch) / `npm run test:run` (run unique)
- Mobile : `npm run cap:sync` puis `npm run cap:build`
