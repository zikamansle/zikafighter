# Zika Fighter — Coups spéciaux SNES (spécification validée de principe)

Référence de jouabilité : **Street Fighter II Turbo (Super Nintendo)**, et non Super Street Fighter II Turbo. Ce fichier définit les coups et commandes prévus pour les 20 combattants et Zika (boss bonus). **AUCUN SUPER COMBO : supprimer la rubrique et la jauge Super de toutes les fiches et de l'interface.** Les noms, commandes et propriétés ci-dessous remplacent les anciennes listes uniformes des fiches de présentation.

## Commandes communes

- Directions relatives au sens du combattant : `→` = vers l'adversaire, `←` = arrière, `↓` = bas, `↘` = bas-avant, `↙` = bas-arrière, `↑` = haut.
- `P` = un des trois boutons de poing ; `K` = un des trois boutons de pied. Mapping SNES par défaut : Y/X/L = petit/moyen/gros poing ; B/A/R = petit/moyen/gros pied.
- `[←]→`, `[↓]↑` = maintenir la direction initiale environ 60 frames, puis direction finale + bouton (calibrage à tester). `360° + P` = rotation avec poing ; `P répété` ou `K répété` = pressions rapides.
- Les variantes léger/moyen/fort changent distance, vitesse, dégâts ou durée de récupération, sans changer de technique.
- Commandes interprétées en miroir et acceptant une petite tolérance de saisie ; toutes les attaques ont des états startup/active/recovery, hitbox/hurtbox, dégâts, impact, blocage et contre-jeu.
- Nombre de coups spéciaux variable : 2, 3 ou 4. Aucun super, super-mètre ou combinaison à rallonge réservée à un super.
- Les coups déjà illustrés sur les fiches sont des **références d'intention** ; leur animation exacte et les effets restent à faire/corriger dans le moteur, pas à prétendre terminés.

## Techniques de chaque personnage

| Personnage | Techniques spéciales et commandes | Total | Profil |
|---|---|---:|---|
| Antho | Charge Solidaire `[←]→ + P` (ruée) ; Sangle d'Appui `→↓↘ + K` (frappe anti-air) ; Esprit ZikaTeam `↓↘→ + P` (onde courte) | 3 | polyvalent |
| Pascal | Vague de Paume `↓↘→ + P` (projectile) ; Charge Française `[←]→ + P` (ruée) ; Prise du Bricoleur `360° + P` (projection à portée courte) | 3 | puissance et prise |
| Micka | Roda Rapide `↓↘→ + K` (rotation) ; Esquive Gingada `↓↙← + K` (esquive) ; Coup Rotatif `→↓↘ + K` (anti-air) ; Roda Aérienne `↓↘→ + K` en l'air (attaque aérienne) | 4 | mobile et aérien |
| Emma | Vrille d'Emma `↓↙← + K` (vrille) ; Combo Aérien `→↓↘ + K` (anti-air) ; Éclipse Rapide `[←]→ + P` (dash offensif) | 3 | vitesse et jongles |
| Julie | Charge d'Énergie `[←]→ + P` (charge) ; Frappe Organisatrice `↓↘→ + P` (frappe d'avancée) ; Projection Éclair `360° + P` (projection rapprochée) | 3 | charge et saisie |
| Béné | Réflexe Express `[←]→ + P` (ruée) ; Analyse Tactique `↓↘→ + P` (onde de précision) | 2 | défensive |
| Billy | Réflexe Éclair `↓↘→ + P` (ruée) ; Contre Instinct `→↓↘ + P` (revers anti-air) ; Esprit d'Équipe `P répété` (rafale courte) | 3 | contre-attaque |
| Djo | Coup de Main Logistique `↓↘→ + P` (caisson/projectile) ; Montage Express `[↓]↑ + K` (anti-air de montage) ; Esprit d'Équipe `[←]→ + K` (onde collective) | 3 | espace/équipement |
| Elo | Gestion d'Équipe `↓↘→ + P` (impulsion) ; ZikaParade `[←]→ + K` (ruée rythmée) ; Coup de Fil Express `↓↙← + P` (attaque à distance) | 3 | contrôle |
| Fabienne (45 ans) | Gestion de Crise `[←]→ + P` (charge) ; Esprit d'Équipe `↓↘→ + P` (onde) ; Coordination Totale `[↓]↑ + K` (défense verticale) | 3 | soutien offensif |
| Fabrice | Barrière Flash `[←]→ + P` (mur court) ; Signal Parking `↓↘→ + K` (frappe de signal) ; Contrôle d'Accès `[↓]↑ + P` (barrière montante) | 3 | défense de zone |
| Sandy | Déco Créative `↓↘→ + P` (arc coloré) ; Coup de Bricol' `→↓↘ + P` (anti-air) ; Esprit d'Équipe `P répété` (rafale) | 3 | polyvalente |
| Laura | Vitesse Furtive `[←]→ + K` (déplacement rapide) ; Projection Aérienne `360° + P` (projection) ; Énergie Zika `[↓]↑ + P` (attaque verticale) | 3 | mobilité et prise |
| Kév | Analyse Flash `↓↘→ + P` (onde dirigée) ; Projection Fluide `360° + P` (projection) | 2 | anticipation |
| Loïc | Adaptation Rapide `[←]→ + P` (charge) ; Prise de Terrain `360° + P` (projection) ; Vision Stratégique `[↓]↑ + K` (anti-air) | 3 | robuste |
| Val | Pas de Côté Fulgurant `[←]→ + K` (esquive-frappe) ; Coup Tourbillon `↓↙← + K` (rotation) ; Focus & Précision `→↓↘ + P` (anti-air précis) | 3 | agilité |
| Victor | Mixage Parfait `↓↘→ + P` (onde sonore) ; Synchro d'Équipe `[←]→ + P` (impulsion) ; Gestion de Flux `[↓]↑ + K` (colonne sonore) | 3 | distance |
| Ju | Charge Barbare `[←]→ + P` (ruée) ; Projection Festive `360° + P` (projection) ; Rage du Barbu `P répété` (rafale) | 3 | corps-à-corps |
| Ludo | Charge Solide `[←]→ + P` (ruée) ; Boule de Force `↓↘→ + P` (projectile) ; Esprit ZikaTeam `[↓]↑ + K` (anti-air) | 3 | endurance |
| Fabienne (48 ans) | Gestion d'Équipe `↓↘→ + P` (impulsion collective) ; Logistique Express `[←]→ + P` (chariot/charge) | 2 | organisation |
| **Zika — BOSS** | **Zika Crusher** `[←]→ + P` (charge horizontale traversante, façon Psycho Crusher) ; **Zika Double Kick** `[←]→ + K` (double coup de pied propulsé) ; **Zika Head Press** `[↓]↑ + K` (saut plongeant depuis le haut de l'écran, puis rebond possible) | **3** | **boss de type M. Bison**, rapide, technique, puissant mais battable |

## Notes d'équilibrage / intégration

- Zika est le boss bonus équivalent **en rôle et en logique d'inputs** à M. Bison, avec **animations, costumes, effets et noms originaux**. Il ne copie pas ses sprites.
- Éviter qu'un boss soit imbattable : récupération visible après une charge bloquée, trajectoire de Head Press anticipable, fenêtres de punition.
- Les 20 personnages humains demeurent jouables ; Zika est bonus/déblocable selon les règles du jeu.
- Les captures des anciennes fiches peuvent contenir une ligne « SUPER COMBO » : elles doivent être remplacées/régénérées séparément. Ne pas supprimer les **assets graphiques** sans inventorier leurs usages.
- **Statut** : cahier de techniques préparé. La logique des commandes, collisions et animations n'est **pas encore implémentée ni testée** par la création de ce document.
