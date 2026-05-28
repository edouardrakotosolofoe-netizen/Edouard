# Inscription LPCSP - Version professionnelle
cd "E:\inscription_LPCSP_professionnel\inscription LPCSP"
## Lancer dans VSCode
```powershell
npm install
npm run dev
```

## Connecter Supabase
1. Créer ou ouvrir le projet Supabase dans le navigateur.
2. SQL Editor > coller `supabase/schema.sql` > Run.
3. Storage > New bucket > nom: `documents` > Public bucket.
4. Copier `.env.example` en `.env` puis remplir:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ADMIN_PASSWORD=motdepasseadmin
VITE_SUPABASE_BUCKET=documents
```
5. Redémarrer:
```powershell
npm run dev
```

## Fonctionnalités
- Accueil avec dossiers à fournir, annonces et galerie
- Nouvelle inscription et réinscription
- Upload documents/photo via Supabase Storage
- Admin login sécurisé par mot de passe `.env`
- Dashboard réel avec statistiques
- CRUD inscriptions, classes, dossiers, annonces, contacts, année scolaire
- Export CSV/Excel et impression PDF
- Responsive mobile
- Copyright © R Edouard LPCSP
