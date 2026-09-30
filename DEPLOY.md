# Mise en ligne

1. **Domaine** : le site utilise `https://yannik-kadjie.vercel.app` partout (canonical, OG, JSON-LD,
   `sitemap.xml`, `robots.txt`). En cas de domaine personnalisé, le remplacer dans ces mêmes fichiers.
2. **HTTPS** obligatoire, la plupart des hébergeurs statiques (Netlify, Vercel, GitHub Pages) le font automatiquement.
3. **Redirection www ↔ non-www** : choisir une version canonique et rediriger l'autre (301) côté hébergeur/DNS.
4. **Google Search Console** : ajouter la propriété, vérifier via le fichier HTML ou le DNS, puis soumettre `sitemap.xml`.
5. **Bing Webmaster Tools** : idem, ou importer directement depuis Google Search Console.
