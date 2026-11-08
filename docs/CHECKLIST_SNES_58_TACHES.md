# Zika Fighter — Checklist de référence (58 tâches)

Date de référence : **8 novembre 2026** · Dépôt : `zikamansle/zikafighter` · Statut : **travail en cours**.

> **CONSIGNE ABSOLUE POUR CHAQUE SESSION DE TRAVAIL** : suivre **exclusivement Street Fighter II Turbo: Hyper Fighting sur Super Nintendo (SNES, 1993)**. Ne jamais emprunter d'écran, de menu, de mécanisme, d'animation ou de son aux versions arcade, Mega Drive, Super Street Fighter II ou Super Street Fighter II Turbo. L'univers et les personnages sont ceux de Zika Fighter, mais la construction du jeu et son fonctionnement doivent être aussi fidèles que possible à la version SNES.

## Règles de fidélité et de validation

**EXCEPTION UNIQUE POUR LA PROGRESSION :** décision utilisateur du **08/11/2026** : **NE PAS créer de carte** de progression/niveaux, malgré la présence d'une carte dans SFII Turbo SNES. La remplacer par une présentation du niveau et de l'adversaire dans le langage graphique de la console. Cela **n'autorise pas** à s'écarter de la version SNES sur les écrans, curseurs, typographies, sons, mouvements, commandes, mécaniques et transitions. Les adaptations déjà validées (20 combattants + Zika bonus, 21 arènes, choix d'arène dans le bandeau inférieur) sont conservées ; ce sont des adaptations de contenu/disposition, pas des excuses pour approximation visuelle.

**Référence de contrôle authentique** : manuel Nintendo français de *Street Fighter II' Turbo: Hyper Fighting* sur SNES : https://www.nintendo.co.jp/clvs/manuals/fr/pdf/CLV-P-SABHE_fr.pdf ; planches de sprites de l'écran PLAYER SELECT du jeu SNES, The Spriters Resource : https://www.spriters-resource.com/snes/streetfighteriistreetfighteriiturbo/asset/5573/ . Confirmer les détails d'animation en vidéo sur la version exacte, avant validation.

1. **Toujours lire cette checklist au début d'une reprise du projet.** Mettre à jour ce fichier après chaque tâche réellement terminée. C'est la référence permanente d'avancement, accessible lors des prochaines sessions depuis le dépôt.
2. **Zéro approximation présentée comme fidèle** : avant de produire ou modifier un écran, comparer aux références authentiques de la version **SNES 1993** (manuel, captures, vidéo de jeu issue de la version exacte). Lorsqu'un point n'est pas vérifié, le marquer « à vérifier » au lieu de l'inventer.
3. **Fidélité graphique** : emplacement, cadrage, ratio, résolution, palette, typographie, pixels nets, proportions, animation, tempo, transitions, position/forme des curseurs et composition de l'écran. Ne jamais mélanger des composants d'autres épisodes.
4. **Fidélité fonctionnelle** : ordre des écrans, menus et sous-menus, raccourcis, commandes, game modes, difficulté, comportement des combats, scoring, états victoire/défaite, musiques, bruitages et réactions des boutons.
5. **Validation en conditions réelles** : une case n'est cochée qu'après contrôle **visuel et fonctionnel**, avec vérification des sons, des deux joueurs quand pertinent, du plein écran et de la navigation. Noter le test et les écarts restants. Un fichier de code présent ne signifie PAS que la tâche est terminée.
6. **Ne pas retoucher les portraits, visages, logos et éléments validés** sans nouvelle demande explicite. Les 20 humains (dont deux Fabienne distinctes), Zika bonus et les 21 arènes restent le contenu Zika Fighter.
7. **Aucune fonction issue d'une autre version** : pas de jauge Super, pas de Super Combos ou d'écrans étrangers à SFII Turbo sur SNES. Toute adaptation spécifiquement Zika (casting, lieux, secret Zika, fins) doit être clairement identifiée comme adaptation et s'intégrer sans rompre les règles SNES.
8. **Les détails historiques à confirmer ne sont jamais des vérités acquises** : en particulier intitulés exacts, nombres d'étoiles/niveaux, écrans intermédiaires, séquences de fin, options ou stages bonus : vérifier sur la cartouche/version de référence avant mise en œuvre. Si une tâche listée s'avère étrangère à cette version, la corriger explicitement dans ce document en documentant la raison ; ne jamais l'intégrer par réflexe.
9. **État initial** : les 58 cases sont volontairement ouvertes, y compris pour des parties dont le code existe déjà ; chacune exige une vérification avant fermeture. **Historique :** `stage-select.js` manquait au premier relevé ; le fichier a depuis été créé, est bien référencé dans `index.html` et passe le contrôle statique. L'enchaînement réel reste à valider visuellement et au clavier/manette.

## Checklist exhaustive (58 tâches)

## 1. Introduction et menus — à corriger et terminer

- [ ] **01** — Corriger l'écran légal avant ZikaCapcom, notamment sa résolution.
- [ ] **02** — Finaliser l'animation du logo ZikaCapcom avec son jingle.
- [ ] **03** — Finaliser l'introduction et l'écran titre Zika Fighter.
- [ ] **04** — Reproduire précisément le menu `TURBO / NORMAL / OPTION`.
- [ ] **05** — Faire fonctionner les cinq vitesses Turbo : 0 à 4 étoiles.
- [ ] **06** — Finaliser le menu `GAME START / V.S. BATTLE`.
- [ ] **07** — Corriger l'écran OPTION MODE sans ajouter de boutons étrangers à l'original.
- [ ] **08** — Vérifier les paramètres : difficulté, limite de temps, configuration des touches et stéréo/mono.
- [ ] **09** — Terminer MUSIC TEST et S.E. TEST : numérotation, navigation, écoute et arrêt.
- [ ] **10** — Vérifier chaque transition, curseur, son de déplacement et validation.

## 2. Sélection des personnages — écran commencé, à finaliser

- [ ] **11** — Terminer l'écran PLAYER SELECT avec les 20 combattants.
- [ ] **12** — Intégrer les portraits définitifs sans modifier les visages validés.
- [ ] **13** — Reproduire le placement des portraits, les noms, les grandes images et les couleurs de la SNES.
- [ ] **14** — Finaliser les curseurs 1P et 2P, ainsi que leurs déplacements.
- [ ] **15** — Finaliser l'animation et le son de confirmation d'un combattant.
- [ ] **16** — Prévoir la sélection secrète de Zika sans modifier inutilement la grille principale (adaptation Zika Fighter).

## 3. Écrans de préparation des combats — principalement à créer

- [ ] **17** — Créer l'écran de **progression de tournoi sans carte** : annonce du niveau, de l'adversaire suivant et transition fidèle à l'ambiance 16 bits SNES. **Adaptation expressément validée le 8 novembre 2026 : aucune carte de progression.**
- [ ] **18** — Créer l'animation indiquant le prochain adversaire et le niveau atteint **sans écran cartographique** ; durée, transitions et sons inspirés exclusivement de la version SNES.
- [ ] **19** — Créer l'écran de confrontation avec les portraits des deux combattants.
- [ ] **20** — Reproduire les transitions et les sons précédant un combat.
- [ ] **21** — Créer la séquence `HERE COMES A NEW CHALLENGER` quand le deuxième joueur intervient.

## 4. Les vrais combats SNES — chantier principal

- [ ] **22** — Intégrer les 21 décors définitifs. Leurs références sont dans `data/stages.json`, mais le dossier `assets/stages` était absent lors du relevé.
- [ ] **23** — Créer les animations des décors : personnages à l'arrière-plan, éléments mobiles, effets et mouvements.
- [ ] **24** — Produire les spritesheets complets des 20 combattants et de Zika.
- [ ] **25** — Intégrer marche, recul, sauts, accroupissement et gardes.
- [ ] **26** — Intégrer les six attaques de base : trois poings et trois pieds.
- [ ] **27** — Ajouter les prises, projections, coups spéciaux et animations de récupération.
- [ ] **28** — Construire le moteur définitif : collisions, dégâts, portée des coups, enchaînements et intelligence artificielle.
- [ ] **29** — Reproduire l'interface SNES : scores, HI-SCORE, barres de vie, chronomètre et manches remportées.
- [ ] **30** — Finaliser `ROUND`, `FIGHT`, `K.O.`, `DOUBLE K.O.`, `TIME OVER`, `PERFECT` et les matchs nuls.
- [ ] **31** — Créer les animations de victoire et de défaite, les phrases de victoire et les points bonus.
- [ ] **32** — Faire fonctionner la pause et les effets audio associés.
- [ ] **33** — Distinguer réellement NORMAL et TURBO, y compris les coups spéciaux disponibles, et pas seulement la vitesse.

## 5. Tournoi solo et stages bonus — à créer

- [ ] **34** — Construire le tournoi solo complet avec succession automatique des adversaires.
- [ ] **35** — Mettre à jour le **niveau / la progression du tournoi** après chaque victoire, avec son écran de transition non cartographique.
- [ ] **36** — Définir l'ordre des adversaires et les combats finaux.
- [ ] **37** — Créer le stage bonus de destruction de voiture.
- [ ] **38** — Créer le stage bonus de destruction d'un mur de briques.
- [ ] **39** — Créer le stage bonus des tonneaux.
- [ ] **40** — Ajouter le temps imparti, les animations de destruction et les résultats des stages bonus.

## 6. Mode V.S. BATTLE — à construire

- [ ] **41** — Créer le véritable écran de préparation V.S. avec deux joueurs.
- [ ] **42** — Intégrer `HANDICAP / ATTACK LEVEL`, réglable en étoiles.
- [ ] **43** — Intégrer `STAGE SELECT` avec les arènes de Zika Fighter.
- [ ] **44** — Afficher les statistiques de victoires et défaites de chaque combattant.
- [ ] **45** — Créer le menu `CONTINUE / QUIT / RESET RECORDS` à la fin d'un duel.
- [ ] **46** — Gérer les revanches, les nouveaux personnages et les retours aux menus.

## 7. Défaite, victoire et fin du jeu — à créer

- [ ] **47** — Créer l'écran `CONTINUE?` avec compte à rebours.
- [ ] **48** — Créer `GAME OVER` avec son animation et sa musique.
- [ ] **49** — Créer l'affichage des meilleurs scores.
- [ ] **50** — Créer les séquences de victoire finale du tournoi.
- [ ] **51** — Produire les 20 fins individuelles adaptées aux personnages, ainsi qu'une fin bonus pour Zika.
- [ ] **52** — Créer le générique final (`STAFF ROLL`) et le retour au titre.

## 8. Musiques, graphismes et finition générale — à intégrer et tester

- [ ] **53** — Relier toutes les musiques déjà disponibles aux bons écrans et aux 21 arènes.
- [ ] **54** — Intégrer les bruitages de combat et synchroniser les sons avec chaque animation.
- [ ] **55** — Uniformiser la résolution, les proportions, les polices pixelisées et les effets graphiques de tous les écrans.
- [ ] **56** — Faire fonctionner les commandes clavier et les deux manettes, selon les six boutons de combat SNES.
- [ ] **57** — Corriger les fichiers manquants et tous les enchaînements entre les écrans.
- [ ] **58** — Tester une partie complète, du lancement du jeu jusqu'au générique, en solo et en V.S.

## Journal d'avancement

- **2026-11-08** — Création de cette checklist comme référence permanente de travail. Statuts initiaux volontairement ouverts. Référence de comparaison exclusivement **Street Fighter II Turbo sur Super Nintendo (1993)**. Prochaine priorité : fiabiliser l'introduction, l'écran légal, les menus, les options, puis la sélection des personnages, en comparant **chaque écran** à la version SNES réelle.

- **2026-11-08, nouvelle directive utilisateur** — Fidélité maximale à **Street Fighter II Turbo SNES uniquement** pour le rendu et le gameplay. **Pas de carte de progression des niveaux**, exception explicitement autorisée. Écran de sélection **toujours NON VALIDÉ** : typographies, 1P/2P et curseurs personnages/arènes à réviser sur référence officielle, sans modification des portraits. Le rendu 7–7–6 et le bandeau inférieur demeurent des adaptations explicitement approuvées.
- **2026-11-08, reprise de fin d'après-midi** — Corrections publiées sur la branche principale : (1) bandeau horizontal d'arènes alimenté par les **21 illustrations originales individuellement**, sans montage 7×3 ni déformation ; (2) miniatures des personnages en `object-fit:contain` afin de préserver les visages validés ; (3) scène de combat, dimensions du canvas et repères moteur en **1152×864 (4:3)**, avec recadrage central des décors sans étirement ; (4) mise à jour des versions de ressources pour éviter un ancien rendu en cache ; (5) ajout des tests `tests/smoke-static.mjs` et du workflow `.github/workflows/snes-smoke.yml`. **Résultat GitHub Actions : succès sur la révision 484abbb**. Les tests confirment l'intégrité technique de 20 personnages, 21 arènes, fichiers d'annonce audio, dimensions, montage des scripts et syntaxe. **Aucune case 11/12/13/22/55/57/58 cochée** : contrôle visuel des écrans et partie jouée non réalisés. Le moteur actuel reste une démonstration, pas un SFII Turbo complet.\n\n- **2026-11-08, nettoyage du premier affichage** — Cause des flashs identifiée : l’ancien écran HTML Pascal/Micka de ~54 Ko existait toujours dans `index.html` avant remplacement différé par `character-select.js`, pendant que `arcade-intro.js` créait l’overlay d’introduction. Ancien bloc supprimé, éléments internes `#stage` et `#start` conservés pour compatibilité moteur, `#select` masqué dès le HTML, garde de premier affichage levée au montage réel de l’intro, cache script rafraîchi. Contrôles de non-régression dédiés ajoutés. **Tests GitHub Actions réussis (e61763b)**. À contrôler dans le navigateur : zéro apparition des anciens boutons et portraits avant l’écran légal/intro ; aucune modification apportée ici à la typographie ni aux curseurs encore non fidèles.\n\n- **2026-11-08, révision des typographies et curseurs de sélection** — Nouvelle base de rendu publiée : `zf-pixel-lettering.js` définit une grille commune de glyphes bitmap dessinés sur canevas, indépendante de Georgia, Times et Courier. `PLAYER SELECT`, `START`, `STAGE SELECT`, le nom du combattant et les intitulés des 21 arènes utilisent désormais cette grille. Le fond Wix de l'ancien grand titre a été retiré, ainsi que son canevas de référence et l'ancien atlas de glyphes dupliqué. Les curseurs 1P/2P sont tracés sur les cases en pixels, avec cadres bleu/rouge ; les anciens effets qui éclaircissaient les visages ont été supprimés. Bandeau d'arènes : cadre de sélection et repère 1P en pixels. Le guide de bas d'écran non conforme à l'interface SNES est masqué. **Tests de non-régression GitHub Actions réussis sur bb926a86.** Attention : cette base bitmap est encore une **reconstruction**, pas une extraction vérifiée des tiles de la cartouche SNES ; **aucune case 11–15/43/55 cochée** sans comparaison visuelle et test d'animation dans le navigateur. Références : `docs/REFERENCE_TYPO_SNES.md` et captures SFII Turbo SNES.

**Correction du 08/11/2026 — rejet utilisateur** : le moteur `zf-pixel-lettering.js` n'a PAS reproduit les lettres de SFII Turbo SNES : rendu jugé très mauvais. Ne jamais le réutiliser, ne jamais annoncer sa fidélité, ne pas cocher les cases typographie ou curseurs. Retour aux éléments visuels antérieurs pour supprimer la régression, **sans considérer ces éléments comme définitifs**. Les planches originales SNES contiennent les véritables glyphes et textes, notamment `PLAYER SELECT` et `STAGE SELECT` : https://www.spriters-resource.com/snes/streetfighteriistreetfighteriiturbo/asset/80834/ et https://www.spriters-resource.com/snes/streetfighteriistreetfighteriiturbo/asset/5573/ . Prochaine solution : extraire / reproduire à partir de la planche d'origine, non d'un alphabet généré de mémoire.\n\n- **08/11/2026 — corrections de la sélection après retour utilisateur** : retrait des deux marquages 1P fixes à gauche/en haut. Un seul indicateur **1P cyan sur la case** ; indicateur **2P rouge** uniquement en mode 2 joueurs, avec encadrements et clignotements bleu/rouge distincts. Noms des combattants déplacés **au-dessus de leurs grands portraits**, sans noms sous les visages. Les 20 miniatures sont cadrées selon la même fenêtre (visage/buste, 104×132) et reçoivent un **fond bleu nuit uniforme** lorsque le détourage local de la couleur de fond est suffisamment fiable ; données source et grands portraits approuvés inchangés. Nouvelle ressource `portrait-thumbs-normalize.js` chargée avant `character-select.js`. Mise en cache des rendus et des fichiers CSS/JS actualisée. **Contrôles statiques ajoutés, mais contrôle visuel dans navigateur non encore effectué** ; ne pas considérer la fidélité 100 % acquise. La grille 7–7–6 et le bandeau des arènes restent inchangés.\n\n## Rappel de reprise à copier dans les futures discussions

> « Travaille sur Zika Fighter en reprenant `docs/CHECKLIST_SNES_58_TACHES.md` du dépôt `zikamansle/zikafighter`. Seule référence : Street Fighter II Turbo, Super Nintendo 1993. Avant chaque changement, compare la version exacte et vérifie le rendu, les transitions, les commandes, les musiques et les bruitages. Pas d'approximation, pas d'ajout d'une autre version. Préserve les visages, portraits, logos et écrans déjà validés. Mets à jour les cases de la checklist après vérification réelle. »
