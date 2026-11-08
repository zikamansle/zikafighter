/* Zika Fighter — recadrage NON DESTRUCTIF des miniatures approuvées.
 * Ne jamais effacer, recolorer, masquer ou détourer un pixel du portrait.
 * Le fond commun reste une propriété CSS derrière l'image.
 */
(()=>{'use strict';
 const cache=new Map();
 window.ZikaFighterThumbNormalize=Object.freeze({
   fromImage(key,img){
     if(!img?.naturalWidth||!img?.naturalHeight)return null;
     if(cache.has(key))return cache.get(key);
     // L'image approuvée originale est rendue directement. Toute manipulation
     // canvas à base de couleurs (flood fill) peut supprimer des yeux ou visages.
     const src=img.src;
     cache.set(key,src);
     return src;
   }
 });
})();
