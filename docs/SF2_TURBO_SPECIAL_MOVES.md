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


## Correspondances de sensations avec les coups spéciaux de Street Fighter II Turbo SNES

**Exigence de conception :** le joueur doit reconnaître *le type de mouvement et son rôle tactique* des classiques SFII, pas seulement leurs combinaisons de touches. S'inspirer des mécaniques (trajectoire, cadence, distance, fenêtres d'attaque, réaction à la garde), sans reproduire les sprites, bruitages ni animations à l'identique. Les noms Zika Fighter restent originaux. Ce tableau précise le comportement des coups déjà inscrits plus haut ; il ne crée **aucun Super Combo**.

| Zika Fighter | Technique | Référence mécanique SFII Turbo SNES | Comportement attendu |
|---|---|---|---|
| Antho | Charge Solidaire | Balrog — Dash Straight | Ruée horizontale au poing |
| Antho | Sangle d'Appui | Ken/Ryu — Shoryuken | Ascension offensive anti-air |
| Antho | Esprit ZikaTeam | Ryu — Hadoken | Projectile horizontal court |
| Pascal | Vague de Paume | Ryu — Hadoken | Projectile de face |
| Pascal | Charge Française | E. Honda — Sumo Headbutt | Charge frontale avec reprise |
| Pascal | Prise du Bricoleur | Zangief — Spinning Piledriver | Prise rapprochée non bloquable à distance de saisie |
| Micka | Roda Rapide | Ken/Ryu — Tatsumaki | Rotation en déplacement |
| Micka | Esquive Gingada | Chun-Li — Spinning Bird Kick (inspiration mobile) | Enchaînement acrobatique à trajectoire différente |
| Micka | Coup Rotatif | Ken — Shoryuken (fonction anti-air) | Coup montant |
| Micka | Roda Aérienne | Ryu/Ken — Tatsumaki aérien | Rotation en plein saut |
| Emma | Vrille d'Emma | Chun-Li — Spinning Bird Kick | Coup tournoyant, avance contrôlée |
| Emma | Combo Aérien | Ryu/Ken — Shoryuken | Montée anti-air |
| Emma | Éclipse Rapide | Balrog — Dash Straight | Ruée rapide |
| Julie | Charge d'Énergie | Blanka — Rolling Attack | Charge horizontale percutante |
| Julie | Frappe Organisatrice | Ryu — Hadoken (fonction distance) | Onde offensive |
| Julie | Projection Éclair | Zangief — Spinning Piledriver | Projection de corps-à-corps |
| Béné | Réflexe Express | Balrog — Dash Straight | Rush rapide |
| Béné | Analyse Tactique | Guile — Sonic Boom (fonction zoning) | Onde régulière de contrôle |
| Billy | Réflexe Éclair | Balrog — Dash Straight | Percée de garde |
| Billy | Contre Instinct | Guile — Flash Kick (fonction anti-air) | Revers défensif montant |
| Billy | Esprit d'Équipe | E. Honda — Hundred Hand Slap | Rafale de poings sur place |
| Djo | Coup de Main Logistique | Dhalsim — Yoga Fire | Projectile à distance |
| Djo | Montage Express | Guile — Flash Kick | Attaque anti-air en charge basse |
| Djo | Esprit d'Équipe | E. Honda — Headbutt (fonction ruée) | Attaque chargée vers l'avant |
| Elo | Gestion d'Équipe | Guile — Sonic Boom | Projectile horizontal |
| Elo | ZikaParade | Blanka — Rolling Attack (fonction charge) | Ruée rythmée |
| Elo | Coup de Fil Express | Dhalsim — Yoga Fire | Projectile lent permettant le placement |
| Fabienne (45 ans) | Gestion de Crise | Balrog — Dash Straight | Charge au poing |
| Fabienne (45 ans) | Esprit d'Équipe | Ryu — Hadoken | Onde de soutien |
| Fabienne (45 ans) | Coordination Totale | Guile — Flash Kick | Contre anti-air |
| Fabrice | Barrière Flash | Guile — Sonic Boom (fonction contrôle) | Barrière/projectile frontal |
| Fabrice | Signal Parking | Ken/Ryu — Tatsumaki (fonction trajectoire) | Frappe en mouvement |
| Fabrice | Contrôle d'Accès | Guile — Flash Kick | Anti-air vertical |
| Sandy | Déco Créative | Dhalsim — Yoga Fire | Projectile atypique |
| Sandy | Coup de Bricol' | Ryu — Shoryuken | Anti-air montant |
| Sandy | Esprit d'Équipe | Chun-Li — Hyakuretsukyaku | Rafale rapide répétée |
| Laura | Vitesse Furtive | Balrog — Dash Straight | Charge en déplacement |
| Laura | Projection Aérienne | Zangief — Spinning Piledriver (fonction prise) | Saisie courte portée |
| Laura | Énergie Zika | Guile — Flash Kick | Réaction anti-air sur charge |
| Kév | Analyse Flash | Guile — Sonic Boom | Projectile de contrôle |
| Kév | Projection Fluide | Zangief — Spinning Piledriver | Projection rapprochée |
| Loïc | Adaptation Rapide | E. Honda — Sumo Headbutt | Charge qui traverse rapidement la distance |
| Loïc | Prise de Terrain | Zangief — Spinning Piledriver | Saisie rapprochée |
| Loïc | Vision Stratégique | Guile — Flash Kick | Anti-air en charge |
| Val | Pas de Côté Fulgurant | Vega — Flying Barcelona Attack (inspiration esquive) | Entrée mobile depuis angle inhabituel |
| Val | Coup Tourbillon | Chun-Li — Spinning Bird Kick | Coup de pied tournoyant |
| Val | Focus & Précision | Ryu — Shoryuken (fonction) | Anti-air précis |
| Victor | Mixage Parfait | Guile — Sonic Boom | Onde sonore |
| Victor | Synchro d'Équipe | Balrog — Dash Straight (fonction charge) | Onde de contact après déplacement |
| Victor | Gestion de Flux | Guile — Flash Kick | Mur sonore vertical |
| Ju | Charge Barbare | E. Honda — Sumo Headbutt | Ruée massive |
| Ju | Projection Festive | Zangief — Spinning Piledriver | Projection |
| Ju | Rage du Barbu | E. Honda — Hundred Hand Slap | Frappes répétées |
| Ludo | Charge Solide | Balrog — Dash Straight | Charge directe |
| Ludo | Boule de Force | Sagat — Tiger Shot | Projectile plus lourd |
| Ludo | Esprit ZikaTeam | Guile — Flash Kick | Anti-air en charge |
| Fabienne (48 ans) | Gestion d'Équipe | Guile — Sonic Boom | Onde horizontale |
| Fabienne (48 ans) | Logistique Express | E. Honda — Sumo Headbutt (fonction charge) | Charge avec équipement |
| **Zika (boss)** | **Zika Crusher** | **M. Bison — Psycho Crusher** | **Charge horizontale très rapide, anticipation et récupération si bloquée** |
| **Zika (boss)** | **Zika Double Kick** | **M. Bison — Double Knee Press** | **Double impact vers l'avant, contrôle de distance** |
| **Zika (boss)** | **Zika Head Press** | **M. Bison — Head Press** | **Bond depuis une charge basse, attaque plongeante avec trajectoire lisible** |

### Important pour l'implémentation

- La diversité des **mécaniques** n'impose pas une diversité artificielle des touches : deux attaques similaires peuvent avoir des commandes différentes et inversement.
- Pour un mouvement inspiré de *Flash Kick*, respecter le fait que c'est une **charge bas → haut** dans la configuration prévue ; pour *Sonic Boom*, une **charge arrière → avant** ; pour les projections de type Zangief, un 360° + poing à courte distance.
- La palette actuelle et les personnages validés ne sont **pas** redessinés pour ces inspirations. On garde leurs accessoires identitaires et leur silhouette.
- Les mouvements doivent être lisibles en **4:3**, testables avec manette, et équilibrés entre attaques à charge, projectiles, projections et mouvements aériens.
- **Rien dans ce tableau n'est encore une preuve d'intégration au moteur ou de réussite des tests** : c'est la spécification d'animation et de comportement à implémenter.
