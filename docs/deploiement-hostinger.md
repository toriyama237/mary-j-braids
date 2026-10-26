# Déploiement sur Hostinger

L'application tourne comme une application Node.js reliée à une base MySQL, toutes deux fournies par
l'offre Hostinger. Les intitulés exacts de hPanel peuvent varier : suivez l'esprit des étapes.

## 1. Base de données

1. hPanel → **Bases de données MySQL** → créer une base et un utilisateur.
2. Noter l'hôte, le nom de la base, l'utilisateur et le mot de passe.
3. L'URL de connexion prend la forme :
   `mysql://UTILISATEUR:MOT_DE_PASSE@HOTE:3306/NOM_DE_LA_BASE`

## 2. Application Node.js

1. hPanel → **Sites web** → ajouter une application **Node.js** (version 20 ou plus).
2. Source : ce dépôt GitHub, branche `main`.
3. Commandes :
   - installation : `npm ci`
   - build : `npm run build`
   - démarrage : `npm start`
4. Variables d'environnement :

| Variable                                           | Valeur                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`                                     | URL MySQL de l'étape 1                                                |
| `SESSION_PASSWORD`                                 | chaîne aléatoire d'au moins 32 caractères (`openssl rand -base64 32`) |
| `ADMIN_NAME` / `ADMIN_USERNAME` / `ADMIN_PASSWORD` | compte de la gérante (utilisés par le seed uniquement)                |
| `NODE_ENV`                                         | `production`                                                          |

## 3. Initialisation de la base (une seule fois)

Depuis un poste ayant accès à la base (ou le terminal SSH Hostinger), avec le même `.env` :

```bash
npm run db:migrate
npm run db:seed
```

Ne **jamais** lancer `npm run db:seed:demo` en production : il refuse de toute façon si `NODE_ENV=production`.

## 4. Domaine et HTTPS

1. Relier le domaine (offert la première année) à l'application.
2. Activer le certificat SSL gratuit : le cookie de session n'est envoyé qu'en HTTPS en production.

## 5. Mises à jour

Chaque push sur `main` peut être redéployé depuis hPanel. Si le schéma de la base a changé
(`drizzle/` contient une nouvelle migration), relancer `npm run db:migrate` avant le redémarrage.

## Sauvegardes

Hostinger effectue une sauvegarde hebdomadaire. Pour une copie manuelle :
hPanel → Bases de données → **phpMyAdmin** → Exporter.
