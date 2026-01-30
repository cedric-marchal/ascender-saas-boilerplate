# Migration R2 : Stockage des keys au lieu des URLs

## ✅ Ce qui a été modifié

### 1. Configuration (`lib/env.ts`)
- ✅ Ajouté `NEXT_PUBLIC_R2_PUBLIC_URL` dans la configuration environnement

### 2. Fonctions R2 (`lib/r2.ts`)
- ✅ Supprimé `downloadFile()` (non utilisé)
- ✅ Supprimé `getUploadUrl()` (approche client direct non utilisée)
- ✅ Supprimé `getDownloadUrl()` (URLs signées non nécessaires en mode public)
- ✅ Ajouté `getPublicUrl(key)` pour générer les URLs publiques à partir des keys
- ✅ Ajouté `getPrivateUrl(key, expiresIn)` pour migration future vers bucket privé

### 3. Routes API

#### `/api/avatar/route.ts` (Customer & Admin)
- ✅ Route unique pour Customer et Admin (chaque utilisateur modifie son propre avatar)
- ✅ Stocke uniquement la `key` en DB : `avatars/userId-timestamp.webp`
- ✅ Génère l'URL publique avec `getPublicUrl(key)` au moment du retour
- ✅ Nettoyé `deleteOldAvatar()` pour utiliser directement la key
- ✅ Sanitise le userId dans le nom de fichier
- ✅ Vérifie la session utilisateur avec `getSession()`

---

## 🔧 Configuration requise

### Fichier `.env` ou `.env.local`

Ajouter la variable suivante :

```bash
# URL publique du bucket R2 (dev)
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

Pour la production (Vercel) :
```bash
# URL publique du bucket R2 (prod avec domaine custom)
NEXT_PUBLIC_R2_PUBLIC_URL=https://files.monapp.com
```

---

## 📊 Structure en base de données

### Avant
```
user.image = "/avatars/userId-123456789.webp"
```

### Après
```
user.image = "avatars/userId-123456789.webp"
```

**Note** : Le champ `user.image` stocke maintenant uniquement la **key R2**, pas l'URL complète.

---

## 🔐 Sécurité : Niveau 2 activé

### Ce qui est protégé

✅ **Path Traversal** : Bloqué par `validateKey()`
- Interdit `..` dans la key
- Interdit `/` au début de la key
- Limite la longueur à 1024 caractères

✅ **IDOR (Insecure Direct Object Reference)**
- `/api/avatar` : Vérifie la session utilisateur
- `/api/admin/users/[id]/avatar` : Vérifie les permissions admin

✅ **Validation des fichiers**
- Types acceptés : JPEG, PNG, WebP
- Taille max : 4.5 MB (configurable via `NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE`)
- Optimisation automatique en WebP

✅ **Rate limiting** : Appliqué sur les deux routes

✅ **Isolation par utilisateur**
- Les avatars sont stockés dans `avatars/userId-timestamp.webp`
- Empêche les conflits de noms de fichiers

### Ce qui n'est PAS encore protégé

⚠️ **Bucket PUBLIC** : N'importe qui peut accéder aux fichiers s'il connaît/devine la key

**Exemple** :
```
https://pub-xxxxx.r2.dev/avatars/user123-1234567890.webp
↓
Accessible sans authentification si la key est devinée
```

---

## 🔒 Migration future : Niveau 3 (Bucket PRIVÉ)

### Quand migrer vers un bucket privé ?

- Documents confidentiels (factures, contrats)
- Contrôle d'accès strict requis
- Besoin d'audit des accès

### Comment migrer ?

1. **Cloudflare R2** : Désactiver l'accès public
   - Dashboard R2 → Settings → Public access → Disable

2. **Code** : Remplacer `getPublicUrl()` par `getPrivateUrl()`
   ```tsx
   // Avant (bucket public)
   const avatarUrl = getPublicUrl(fileKey);

   // Après (bucket privé)
   const avatarUrl = await getPrivateUrl(fileKey, 3600); // Valide 1h
   ```

3. **Frontend** : Rafraîchir les URLs signées avant expiration
   ```tsx
   useEffect(() => {
     const interval = setInterval(async () => {
       const response = await fetch(`/api/users/avatar-url`);
       const data = await response.json();
       setAvatarUrl(data.url);
     }, 50 * 60 * 1000); // Toutes les 50 min

     return () => clearInterval(interval);
   }, []);
   ```

**Avantage** : Aucune migration de base de données nécessaire ! Les keys restent les mêmes.

---

## 🧪 Tests

### Tester l'upload (Customer ou Admin)
```bash
curl -X POST http://localhost:3000/api/avatar \
  -H "Cookie: better-auth.session_token=..." \
  -F "avatar=@avatar.jpg"
```

**Note** : La même route fonctionne pour Customer et Admin. Chaque utilisateur modifie son propre avatar.

### Vérifier la base de données
```sql
SELECT id, email, image FROM "user" WHERE image IS NOT NULL;
```

Résultat attendu :
```
image = "avatars/userId-1234567890.webp"
```

---

## 📝 Notes importantes

1. **Les keys NE SONT JAMAIS exposées côté client** : seules les URLs générées sont retournées
2. **Changement de domaine facile** : Modifier `NEXT_PUBLIC_R2_PUBLIC_URL` suffit
3. **Compatibilité** : Les anciens avatars avec `/avatars/...` continuent de fonctionner
4. **Nettoyage automatique** : L'ancien avatar est supprimé lors de l'upload d'un nouveau

---

## ❓ FAQ

### Q : Dois-je migrer les anciens avatars en DB ?
**R** : Non. Le code supporte les deux formats :
- Ancien : `/avatars/userId-123.webp`
- Nouveau : `avatars/userId-123.webp`

La fonction `deleteOldAvatar()` gère automatiquement les deux.

### Q : Que se passe-t-il si je change `NEXT_PUBLIC_R2_PUBLIC_URL` ?
**R** : Tous les nouveaux avatars utiliseront le nouveau domaine. Les anciens avatars continueront de fonctionner avec l'ancien domaine (car les URLs sont générées à la volée).

### Q : Comment supprimer un avatar ?
**R** : Créer une route DELETE ou mettre `image: null` dans la DB et appeler `deleteFile(key)`.

---

## 📚 Fichiers modifiés

- `lib/env.ts` : Ajout de `NEXT_PUBLIC_R2_PUBLIC_URL`
- `lib/r2.ts` : Simplification + ajout de `getPublicUrl()` et `getPrivateUrl()`
- `app/api/avatar/route.ts` : Utilisation de `getPublicUrl()` + stockage de la key (route unique pour tous les rôles)

---

## 🎯 Prochaines étapes (optionnel)

- [ ] Créer une route DELETE pour supprimer les avatars
- [ ] Ajouter un endpoint pour rafraîchir les URLs signées (si migration vers privé)
- [ ] Configurer un domaine custom R2 pour la prod
- [ ] Créer des buckets séparés dev/staging/prod
