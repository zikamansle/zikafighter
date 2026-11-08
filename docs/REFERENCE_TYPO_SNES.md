# Référence typographique — Zika Fighter (SFII Turbo SNES 1993)

Recherches du 8 novembre 2026.

## Résultat de l'identification

Il n'y a **pas de nom de police TTF/OTF fiable identifié** pour l'ensemble des écrans *PLAYER SELECT* de **Street Fighter II' Turbo: Hyper Fighting (SNES)**. L'original fait appel à des **graphismes bitmap dessinés et composés en sprites/tiles**. La typographie en jeu ne se réduit pas à une seule police installable.

La recréation accessible sous le nom **« Street Fighter II (Large) »**, par Patrick H. Lauke (redux), sur FontStruct, concerne les gros messages de combat (« You win », « You lose », scores, etc.). **Ne pas la confondre avec la typographie du titre « PLAYER SELECT » : elle n'est pas son équivalent prouvé.**

Sources :
- https://fontstruct.com/fontstructions/show/2467222/street-fighter-ii-large
- https://www.spriters-resource.com/snes/streetfighteriistreetfighteriiturbo/asset/5573/
- https://www.spriters-resource.com/snes/streetfighteriistreetfighteriiturbo/asset/80834/
- Capture authentique SFII Turbo SNES : https://www.nintendoworldreport.com/feature/27386/the-snes-20-street-fighter-ii-turbo-hyper-fighting
- Manuel Nintendo : https://www.nintendo.co.jp/clvs/manuals/fr/pdf/CLV-P-SABHE_fr.pdf

## Règles d'implémentation

1. **PLAYER SELECT / START** : reproduire à partir des lettres et de la palette bitmap **SNES originale**, à résolution native, avec nearest-neighbor, jamais via Georgia/Times New Roman.
2. **Nom sélectionné : PASCAL, etc.** : disposer d'un alphabet de glyphes cohérent avec les **noms du jeu SNES**, et le dessiner directement sur le canevas sans police monospace HTML ni substitution approximative.
3. **1P / 2P** : utiliser des glyphes originaux au format pixel, sans `fillText('1P')` avec monospace natif.
4. **STAGE SELECT** (adaptation Zika, absente de cet écran de sélection dans l'original SNES) : composer ces lettres avec **la même grille de glyphes que PLAYER SELECT**, pas un second rendu Georgia/Times.
5. **Titres des 21 arènes** : alphabet bitmap compact adapté aux noms longs, même palette et mêmes tailles de pixels à l'échelle native.
6. **Curseurs** : géométrie, couleurs, timing et comportement à relever sur les séquences *SNES* (pas les versions arcade). Aucun simple `border:3px solid #4ac9ff` ou effet `brightness` CSS ne doit être présenté comme fidèle.
7. **Conserver toutes les images de portraits approuvées** et la disposition 7–7–6 / bandeau des arènes validée par l'utilisateur.

## État

**Recherche terminée ; remplacement typographique et curseurs non encore validés.** Ne jamais annoncer la fidélité à 100 % avant comparaison visuelle des captures originales, pixel par pixel, et test des animations.

## Aucune confusion de versions

Le jeu attendu est **Street Fighter II Turbo: Hyper Fighting, Super Nintendo 1993** ; les captures, animations et sprites *arcade* et **Super Street Fighter II Turbo** sont hors périmètre.

## Rejet de la première reconstruction (08/11/2026)

La version `zf-pixel-lettering.js` créée le 08/11 a été refusée, car son alphabet 7×9 et ses empattements inventés ne correspondent pas aux caractères SNES. Fichier supprimé du dépôt. Ne plus présenter ces glyphes comme « SNES », ni réintroduire une fonte CSS approximative. Extraction des caractères authentiques du sprite sheet SNES **encore à faire**.
