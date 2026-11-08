# Musiques des 21 arènes de Zika Fighter

Les musiques des combats sont chargées par `stage-music.js` depuis ce dossier.

**Fichiers attendus** (un par arène) :

```
ats.mp3
boulevard-tilleuls.mp3
cars-thorin-vriet.mp3
credit-agricole.mp3
departement-charente.mp3
font-gardoire.mp3
font-poisson.mp3
hotel-de-ville.mp3
indalo.mp3
maif.mp3
mediatheque.mp3
office-tourisme.mp3
parc-floral.mp3
partenaires.mp3
pont-mansle.mp3
royaume-zika.mp3
rue-grande.mp3
salle-gautier.mp3
square-verdun.mp3
super-u.mp3
ti-tout-ncf.mp3
```

Le fichier `font-gardoire.mp3` conserve son identifiant technique, tandis que le nom public de l'arène est **Lavoir du Gardoire**.

## Ajout des fichiers

Décompresser `zikafighter_21_musiques_volume_uniforme_CORRIGE.zip` à la racine du dépôt, puis publier les 21 MP3. La structure `assets/audio/stages/` est contenue dans l'archive. Les 21 pistes sont normalisées autour de -16 LUFS ; plafond de crête visé : -1,5 dBTP.

Vérifier dans un navigateur que chaque musique démarre à l'apparition du combat, reste bouclée et que les volumes du menu OPTION MODE fonctionnent. La musique du menu, de la sélection et du VS n'est pas remplacée.
