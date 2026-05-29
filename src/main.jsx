import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, Shield, Globe, FileText, Lock, Trash2, Edit3, Plus, Upload, Download, Search, Users, BarChart3, Settings, Phone, Mail, MapPin, Megaphone, GraduationCap, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Legend, Cell, BarChart, Bar } from 'recharts'
import './style.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const configured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR') && !supabaseKey.includes('YOUR'))
const supabase = configured ? createClient(supabaseUrl, supabaseKey) : null

const LOGO = '/logo-lcsp.png'
const ECOLE = '/ecole-saint-paul.jfif'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'lcspMo/va@'
const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'documents'

const defaultClasses = ['6ème','5ème','4ème','3ème','2nde','1ère','Terminale']
const defaultDossiers = ['Bulletin dernier trimestre','copie de naissance','Photo d’identité','Certificat de scolarite','Fiche de renseignement','Quitus ou reçu de paiement pour la réinscription']
const initialContact = { telephone:'+261 38 19 296 64', email:'andrilucteo@gmail.com', adresse:'Morondava - Madagascar', facebook:'Lycée Catholique Saint Paul Morondava' }
const initialSettings = { annee_scolaire:'2025-2026', inscription_ouverte:true, message_accueil:'Bienvenue sur la plateforme officielle d’inscription du Lycée Catholique Saint Paul Morondava.' }
const initialForm = { type_inscription:'nouvelle', nom:'', prenoms:'', date_naissance:'', lieu_naissance:'', sexe:'', nationalite:'Malagasy', adresse:'', telephone:'', email:'', classe_demandee:'', ancienne_classe:'', regime:'Externe', responsable_nom:'', responsable_tel:'', profession:'', observation:'', fichier_url:'', fichier_nom:'' }

function uid(){ return crypto?.randomUUID?.() || String(Date.now()+Math.random()) }
function today(){ return new Date().toISOString() }
function downloadBlob(name, content, type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href) }

function useStore(){
  const [inscriptions,setInscriptions]=useState([])
  const [classes,setClasses]=useState([])
  const [dossiers,setDossiers]=useState([])
  const [annonces,setAnnonces]=useState([])
  const [contacts,setContacts]=useState(initialContact)
  const [settings,setSettings]=useState(initialSettings)
  const [media,setMedia]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const local=(k,fallback)=>JSON.parse(localStorage.getItem('lcsp_'+k)||JSON.stringify(fallback))
  const save=(k,v)=>localStorage.setItem('lcsp_'+k,JSON.stringify(v))

  async function load(){
    setLoading(true)
    setError('')
    try{
      if(configured){
        const [ins,cl,doc,ann]=await Promise.all([
          supabase.from('inscriptions').select('*').order('created_at',{ascending:false}),
          supabase.from('classes').select('*').order('ordre',{ascending:true}),
          supabase.from('dossiers').select('*').order('ordre',{ascending:true}),
          supabase.from('annonces').select('*').order('created_at',{ascending:false})
        ])

        const firstErr=[ins,cl,doc,ann].find(x=>x.error)?.error
        if(firstErr) throw firstErr

        setInscriptions(ins.data||[])
        setClasses((cl.data||[]).length?cl.data:defaultClasses.map((nom,i)=>({id:uid(),nom,ordre:i+1})))
        setDossiers((doc.data||[]).length?doc.data:defaultDossiers.map((titre,i)=>({id:uid(),titre,ordre:i+1})))
        setAnnonces(ann.data||[])
        setContacts(initialContact)
        setSettings(initialSettings)
        setMedia([])
      }else{
        setInscriptions(local('inscriptions',[]))
        setClasses(local('classes',defaultClasses.map((nom,i)=>({id:uid(),nom,ordre:i+1}))))
        setDossiers(local('dossiers',defaultDossiers.map((titre,i)=>({id:uid(),titre,ordre:i+1}))))
        setAnnonces(local('annonces',[{id:uid(),titre:'Début des inscriptions',contenu:'Les inscriptions sont ouvertes.',active:true,created_at:today()}]))
        setContacts(local('contacts',initialContact))
        setSettings(local('settings',initialSettings))
        setMedia(local('media',[]))
      }
    }catch(e){
      setError(e.message||'Erreur Supabase. Vérifiez SQL et .env.')
    }
    setLoading(false)
  }

  useEffect(()=>{load()},[])

  async function tableAction(table, fn, localKey, setter, current){
    if(configured){
      const {error}=await fn(supabase.from(table))
      if(error){setError(error.message); return false}
      await load()
      return true
    }
    const next=fn(current)
    setter(next)
    save(localKey,next)
    return true
  }

  return {
    configured, loading, error, inscriptions, classes, dossiers, annonces, contacts, settings, media, load,

    async addInscription(row){
      const payload={
        type_inscription:row.type_inscription,
        nom:row.nom,
        prenom:row.prenoms,
        date_naissance:row.date_naissance,
        lieu_naissance:row.lieu_naissance,
        sexe:row.sexe,
        classe:row.classe_demandee,
        adresse:row.adresse,
        telephone:row.telephone,
        email:row.email,
        nom_parent:row.responsable_nom,
        telephone_parent:row.responsable_tel,
        statut:'en_attente',
        fichier_nom:row.fichier_nom,
        fichier_url:row.fichier_url
      }

      return tableAction(
        'inscriptions',
        t=>configured?t.insert(payload):[{...payload,id:uid(),created_at:today()},...inscriptions],
        'inscriptions',
        setInscriptions,
        inscriptions
      )
    },

    async updateInscription(id,row){
      return tableAction('inscriptions', t=>configured?t.update(row).eq('id',id):inscriptions.map(x=>x.id===id?{...x,...row}:x), 'inscriptions', setInscriptions, inscriptions)
    },

    async deleteInscription(id){
      return tableAction('inscriptions', t=>configured?t.delete().eq('id',id):inscriptions.filter(x=>x.id!==id), 'inscriptions', setInscriptions, inscriptions)
    },

    async addClass(nom){
      return tableAction('classes', t=>configured?t.insert({nom,ordre:classes.length+1}):[...classes,{id:uid(),nom,ordre:classes.length+1}], 'classes', setClasses, classes)
    },

    async deleteClass(id){
      return tableAction('classes', t=>configured?t.delete().eq('id',id):classes.filter(x=>x.id!==id), 'classes', setClasses, classes)
    },

    async addDossier(titre){
      return tableAction('dossiers', t=>configured?t.insert({titre,ordre:dossiers.length+1}):[...dossiers,{id:uid(),titre,ordre:dossiers.length+1}], 'dossiers', setDossiers, dossiers)
    },

    async deleteDossier(id){
      return tableAction('dossiers', t=>configured?t.delete().eq('id',id):dossiers.filter(x=>x.id!==id), 'dossiers', setDossiers, dossiers)
    },

    async saveAnnonce(row){
      return tableAction('annonces', t=>configured?(row.id?t.update(row).eq('id',row.id):t.insert(row)):(row.id?annonces.map(x=>x.id===row.id?row:x):[{...row,id:uid(),created_at:today()},...annonces]), 'annonces', setAnnonces, annonces)
    },

    async deleteAnnonce(id){
      return tableAction('annonces', t=>configured?t.delete().eq('id',id):annonces.filter(x=>x.id!==id), 'annonces', setAnnonces, annonces)
    },
async saveContact(row){
  if(configured){
    const { error } = await supabase
      .from('contacts')
      .upsert({
        id:1,
        telephone:row.telephone,
        email:row.email,
        adresse:row.adresse,
        facebook:row.facebook
      })

    if(error){
      setError(error.message)
      return false
    }

    await load()
    return true
  }

  setContacts(row)
  save('contacts',row)
  return true
},

async saveSettings(row){
  if(configured){
    const { error } = await supabase
      .from('settings')
      .upsert({
        id:1,
        annee_scolaire:row.annee_scolaire,
        inscription_ouverte:row.inscription_ouverte,
        message_accueil:row.message_accueil
      })

    if(error){
      setError(error.message)
      return false
    }

    await load()
    return true
  }

  setSettings(row)
  save('settings',row)
  return true
},
       async addMedia(row){
      const next=[{...row,id:uid(),created_at:today()},...media]
      setMedia(next)
      save('media',next)
      return true
    },

    async deleteMedia(id){
      const next=media.filter(x=>x.id!==id)
      setMedia(next)
      save('media',next)
      return true
    },

    async uploadFile(file){
      if(!file) return null
      if(configured){
        const path=`${Date.now()}-${file.name}`.replaceAll(' ','_')
        const {error}=await supabase.storage.from(STORAGE_BUCKET).upload(path,file,{upsert:true})
        if(error){ setError('Upload impossible: '+error.message); return null }
        const {data}=supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
        return {url:data.publicUrl, name:file.name}
      }
      return {url:'', name:file.name}
    }
  }
}

function BrandLogo(){return <div className="roundLogo"><img src={LOGO}/><span>L.C.S.P</span></div>}
function Header({page,setPage,admin,setAdmin}){return <nav className="top"><div className="brand"><BrandLogo/><b>Inscription <span>L.C.S.P</span></b></div><button className="menuBtn">☰</button><div className="navlinks"><button className={page==='home'?'active':''} onClick={()=>setPage('home')}>Accueil</button><button onClick={()=>setPage('form')}>Inscription</button><button onClick={()=>setPage('contact')}>Contact</button><button className="login" onClick={()=> admin?(setAdmin(false),setPage('home')):setPage('login')}>{admin?'Quitter admin':'Admin'}</button></div></nav>}
function Badge({icon,t,d}){return <div><i>{icon}</i><b>{t}</b><span>{d}</span></div>}
function Input({l,v,on,type='text',required}){return <label>{l}<input required={required} type={type} value={v||''} onChange={e=>on(e.target.value)} placeholder={l.replace('*','')}/></label>}
function Select({l,v,on,opts=[],required}){
  const liste = opts && opts.length ? opts : defaultClasses

  return (
    <label>
      {l}
      <select required={required} value={v || ''} onChange={e=>on(e.target.value)}>
        <option value="">-- Sélectionner --</option>
        {liste.map((x,i)=>{
          const valeur = typeof x === 'string' ? x : x.nom
          return <option key={x.id || valeur || i} value={valeur}>{valeur}</option>
        })}
      </select>
    </label>
  )
}

function Home({store,setPage}){return <><section className="hero"><div><p>Bienvenue au</p><h1>Lycée Catholique<br/>Saint Paul</h1><h2>Morondava</h2><p>{store.settings.message_accueil}</p><div className="heroActions"><button className="submit" onClick={()=>setPage('form')}>Nouvelle inscription</button><button className="outline" onClick={()=>setPage('form')}>Réinscription</button></div></div><BrandLogo/></section><div className="badges"><Badge icon={<FileText/>} t="DOSSIER FOURNI" d="Liste visible avant inscription"/><Badge icon={<Shield/>} t="SÉCURISÉ" d="Données enregistrées dans Supabase"/><Badge icon={<Globe/>} t="ACCESSIBLE" d="Mobile et ordinateur"/></div><section className="card infoGrid"><div><h2><FileText/> Dossiers à fournir</h2>{store.dossiers.map(d=><p className="line" key={d.id}><CheckCircle size={18}/> {d.titre}</p>)}</div><div><h2><Megaphone/> Annonces</h2>{store.annonces.filter(a=>a.active!==false).map(a=><article className="notice" key={a.id}><b>{a.titre}</b><p>{a.contenu}</p></article>)}</div></section><Gallery store={store}/></>}

function FormPage({store}){
  const [form,setForm]=useState(initialForm)
  const [ok,setOk]=useState(false)
  const [uploading,setUploading]=useState(false)

  const set=(k,v)=>setForm({...form,[k]:v})

  async function file(e){
    const f=e.target.files?.[0]
    if(!f) return

    setUploading(true)
    const up=await store.uploadFile(f)

    if(up){
      setForm({
        ...form,
        fichier_url: up.url,
        fichier_nom: up.name
      })
    }

    setUploading(false)
  }

  async function submit(e){
    e.preventDefault()

    await store.addInscription({
      ...form,
      fichier_url: form.fichier_url || '',
      fichier_nom: form.fichier_nom || ''
    })

    setForm(initialForm)
    setOk(true)
    scrollTo(0,0)
  }

  return (
    <>
      <section className="card formIntro">
        <h2>{store.settings.inscription_ouverte?'Formulaire d’inscription':'Inscription fermée'}</h2>
        <p>Année scolaire : <b>{store.settings.annee_scolaire}</b></p>
      </section>

      {ok&&<div className="success"><CheckCircle/> Inscription envoyée avec succès.</div>}

      <form className="card form" onSubmit={submit}>
        <h2>FORMULAIRE D'INSCRIPTION</h2>
        <small>* Champs obligatoires</small>

        <h3>Type de demande</h3>
        <div className="choice">
          <button type="button" className={form.type_inscription==='nouvelle'?'selected':''} onClick={()=>set('type_inscription','nouvelle')}>
            Nouvelle inscription
          </button>
          <button type="button" className={form.type_inscription==='reinscription'?'selected':''} onClick={()=>set('type_inscription','reinscription')}>
            Réinscription
          </button>
        </div>

        <h3>Informations personnelles</h3>
        <div className="grid3">
          <Input l="Nom *" v={form.nom} on={v=>set('nom',v)} required/>
          <Input l="Prénoms *" v={form.prenoms} on={v=>set('prenoms',v)} required/>
          <Input l="Date de naissance *" type="date" v={form.date_naissance} on={v=>set('date_naissance',v)} required/>
          <Input l="Lieu de naissance" v={form.lieu_naissance} on={v=>set('lieu_naissance',v)}/>
          <Select l="Sexe *" v={form.sexe} on={v=>set('sexe',v)} opts={['Masculin','Féminin']} required/>
          <Input l="Nationalité" v={form.nationalite} on={v=>set('nationalite',v)}/>
          <Input l="Adresse *" v={form.adresse} on={v=>set('adresse',v)} required/>
          <Input l="Téléphone" v={form.telephone} on={v=>set('telephone',v)}/>
          <Input l="Email" type="email" v={form.email} on={v=>set('email',v)}/>
        </div>

        <h3>Scolarité</h3>
        <div className="grid3">
          <Select l="Classe demandée *" v={form.classe_demandee} on={v=>set('classe_demandee',v)} opts={store.classes} required/>
          <Input l="Ancienne classe" v={form.ancienne_classe} on={v=>set('ancienne_classe',v)}/>
          <Select l="Régime" v={form.regime} on={v=>set('regime',v)} opts={['Externe','Demi-pension','Interne']}/>
        </div>

        <h3>Responsable</h3>
        <div className="grid3">
          <Input l="Nom du responsable *" v={form.responsable_nom} on={v=>set('responsable_nom',v)} required/>
          <Input l="Téléphone du responsable *" v={form.responsable_tel} on={v=>set('responsable_tel',v)} required/>
          <Input l="Profession" v={form.profession} on={v=>set('profession',v)}/>
        </div>

        <h3>Dossier numérique</h3>
        <div className="uploadBox">
          <Upload/>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={file}
          />
          <span>
            {uploading ? 'Téléversement...' : form.fichier_nom || 'Ajouter photo, bulletin, acte de naissance ou dossier PDF'}
          </span>
        </div>

        {form.fichier_url && (
          <div className="success">
            <CheckCircle/> Fichier ajouté : {form.fichier_nom}
          </div>
        )}

        <label>
          Observation
          <textarea value={form.observation} onChange={e=>set('observation',e.target.value)} />
        </label>

        <button className="submit" disabled={!store.settings.inscription_ouverte || uploading}>
          Soumettre l'inscription
        </button>
      </form>
    </>
  )
}

function Login({setAdmin,setPage}){const [p,setP]=useState(''),[err,setErr]=useState('');function go(e){e.preventDefault(); if(p===ADMIN_PASSWORD){localStorage.setItem('lcsp_admin','1');setAdmin(true);setPage('admin')}else setErr('Mot de passe incorrect')}return <form className="loginBox" onSubmit={go}><Lock/><h2>L.C.S.P Admin sécurisé</h2><p>Mot de passe défini dans <b>.env</b> : VITE_ADMIN_PASSWORD</p><input type="password" placeholder="Mot de passe admin" value={p} onChange={e=>setP(e.target.value)}/><button className="submit">Se connecter</button><p className="err">{err}</p></form>}

function Admin({store}){const [tab,setTab]=useState('dashboard'); const tabs=[['dashboard','Dashboard',BarChart3],['inscriptions','Inscriptions',Users],['classes','Classes',GraduationCap],['contenu','Contenu',Megaphone],['parametres','Paramètres',Settings]]; return <div className="admin"><aside><BrandLogo/><h3>L.C.S.P Admin</h3>{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?'on':''} onClick={()=>setTab(id)}><Icon size={17}/> {label}</button>)}<button onClick={store.load}><RefreshCw size={16}/> Actualiser</button></aside><main>{store.error&&<div className="alert">{store.error}</div>}{tab==='dashboard'&&<Dashboard store={store}/>} {tab==='inscriptions'&&<Inscriptions store={store}/>} {tab==='classes'&&<ClassesAdmin store={store}/>} {tab==='contenu'&&<ContentAdmin store={store}/>} {tab==='parametres'&&<SettingsAdmin store={store}/>}</main></div>}
function Dashboard({store}){
  const total=store.inscriptions.length
  const filles=store.inscriptions.filter(x=>x.sexe==='Féminin').length
  const reins=store.inscriptions.filter(x=>x.type_inscription==='reinscription').length

  const byClass=store.classes.map(c=>({
    name:c.nom,
    value:store.inscriptions.filter(x=>x.classe===c.nom).length
  }))

  const byType=[
    {name:'Nouvelle',value:store.inscriptions.filter(x=>x.type_inscription==='nouvelle').length},
    {name:'Réinscription',value:reins}
  ]

  const months=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'].map((m,i)=>({
    m,
    total:store.inscriptions.filter(x=>new Date(x.created_at).getMonth()===i).length
  }))

  return (
    <>
      <h1>Tableau de bord réel</h1>
      <div className="stats">
        <Stat t="Total" n={total}/>
        <Stat t="Filles" n={filles}/>
        <Stat t="Garçons" n={total-filles}/>
        <Stat t="Réinscriptions" n={reins}/>
      </div>

      <div className="charts">
        <div>
          <h3>Inscriptions par mois</h3>
          <ResponsiveContainer height={240}>
            <AreaChart data={months}>
              <CartesianGrid/>
              <XAxis dataKey="m"/>
              <YAxis allowDecimals={false}/>
              <Tooltip/>
              <Area dataKey="total"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3>Nouvelle / Réinscription</h3>
          <ResponsiveContainer height={240}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" outerRadius={85} label>
                {byType.map((_,i)=><Cell key={i}/>)}
              </Pie>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts">
        <div>
          <h3>Par classe</h3>
          <ResponsiveContainer height={240}>
            <BarChart data={byClass}>
              <CartesianGrid/>
              <XAxis dataKey="name"/>
              <YAxis allowDecimals={false}/>
              <Tooltip/>
              <Bar dataKey="value"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Recent store={store}/>
      </div>
    </>
  )
}
function Stat({t,n}){return <div><p>{t}</p><b>{n}</b></div>}
function Recent({store}){
  return (
    <div>
      <h3>Dernières demandes</h3>
      {store.inscriptions.slice(0,6).map(r=>(
        <p className="line" key={r.id}>
          <Users size={16}/> {r.nom} {r.prenom} — {r.classe}
        </p>
      ))}
    </div>
  )
}
function Inscriptions({store}){
  const [q,setQ]=useState('')
  const [edit,setEdit]=useState(null)

  const rows=store.inscriptions.filter(r =>
    ((r.nom||'')+' '+(r.prenom||'')+' '+(r.classe||''))
      .toLowerCase()
      .includes(q.toLowerCase())
  )

  function csv(){
    const cols=[
      'type_inscription',
      'nom',
      'prenom',
      'sexe',
      'date_naissance',
      'classe',
      'telephone',
      'nom_parent',
      'telephone_parent',
      'statut',
      'fichier_nom',
      'fichier_url',
      'created_at'
    ]

    const content=[
      cols.join(';'),
      ...store.inscriptions.map(r =>
        cols.map(c=>`"${r[c]||''}"`).join(';')
      )
    ].join('\n')

    downloadBlob('inscriptions-L.C.S.P.csv',content,'text/csv;charset=utf-8')
  }

  return (
    <>
      <div className="adminHead">
        <h1>Inscriptions</h1>
        <button onClick={csv}><Download size={16}/> Export CSV/Excel</button>
        <button onClick={()=>print()}><FileText size={16}/> Imprimer PDF</button>
      </div>

      <div className="search">
        <Search/>
        <input
          placeholder="Rechercher nom, prénom, classe..."
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
      </div>

      {edit&&<EditInscription row={edit} store={store} close={()=>setEdit(null)}/>}

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Type</th>
              <th>Classe</th>
              <th>Contact</th>
              <th>Statut</th>
              <th>Dossier</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>
                  <b>{r.nom} {r.prenom}</b>
                  <br/>
                  <small>{r.sexe} · {r.date_naissance}</small>
                </td>

                <td>{r.type_inscription}</td>
                <td>{r.classe}</td>

                <td>
                  {r.telephone}
                  <br/>
                  <small>{r.telephone_parent}</small>
                </td>

                <td>
                  <select
                    value={r.statut || 'en_attente'}
                    onChange={e=>store.updateInscription(r.id,{statut:e.target.value})}
                  >
                    <option value="en_attente">En attente</option>
                    <option value="validee">Validée</option>
                    <option value="refusee">Refusée</option>
                  </select>
                </td>

                <td>
                  {r.fichier_url ? (
                    <div className="docActions">
                      {r.fichier_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                        <img
                          src={r.fichier_url}
                          alt="Photo dossier"
                          className="studentPhoto"
                        />
                      )}

                      <small>{r.fichier_nom || 'Dossier numérique'}</small>

                      <a
                        className="docBtn viewBtn"
                        href={r.fichier_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Voir dossier
                      </a>

                      <a
                        className="docBtn downloadBtn"
                        href={r.fichier_url}
                        download={r.fichier_nom || "dossier"}
                      >
                        Télécharger
                      </a>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>

                <td>
                  <button onClick={()=>setEdit(r)}><Edit3 size={14}/></button>
                  <button onClick={()=>confirm('Supprimer ?')&&store.deleteInscription(r.id)}>
                    <Trash2 size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
function EditInscription({row,store,close}){
  const [f,setF]=useState(row)
  const set=(k,v)=>setF({...f,[k]:v})

  async function save(e){
    e.preventDefault()
    await store.updateInscription(row.id,f)
    close()
  }

  return (
    <form className="editor" onSubmit={save}>
      <h3>Modifier inscription</h3>
      <div className="grid3">
        <Input l="Nom" v={f.nom} on={v=>set('nom',v)}/>
        <Input l="Prénom" v={f.prenom} on={v=>set('prenom',v)}/>
        <Select l="Classe" v={f.classe} on={v=>set('classe',v)} opts={store.classes}/>
        <Input l="Téléphone" v={f.telephone} on={v=>set('telephone',v)}/>
        <Input l="Responsable" v={f.nom_parent} on={v=>set('nom_parent',v)}/>
        <Input l="Tél responsable" v={f.telephone_parent} on={v=>set('telephone_parent',v)}/>
      </div>
      <button className="submit">Enregistrer</button>
      <button type="button" onClick={close}>Annuler</button>
    </form>
  )
}
function ClassesAdmin({store}){const [c,setC]=useState(''),[d,setD]=useState(''); return <section><h1>Classes et dossiers fournis</h1><div className="twoCols"><div className="adminTools"><h2>Classes</h2><div className="inline"><input value={c} onChange={e=>setC(e.target.value)} placeholder="Nouvelle classe"/><button onClick={()=>c&&(store.addClass(c),setC(''))}><Plus size={16}/> Ajouter</button></div>{store.classes.map(x=><p className="rowItem" key={x.id}>{x.nom}<button onClick={()=>store.deleteClass(x.id)}><Trash2 size={14}/></button></p>)}</div><div className="adminTools"><h2>Dossiers à fournir</h2><div className="inline"><input value={d} onChange={e=>setD(e.target.value)} placeholder="Document obligatoire"/><button onClick={()=>d&&(store.addDossier(d),setD(''))}><Plus size={16}/> Ajouter</button></div>{store.dossiers.map(x=><p className="rowItem" key={x.id}>{x.titre}<button onClick={()=>store.deleteDossier(x.id)}><Trash2 size={14}/></button></p>)}</div></div></section>}
function ContentAdmin({store}){return <section><h1>Contenu accueil</h1><AnnoncesAdmin store={store}/><MediaAdmin store={store}/></section>}
function AnnoncesAdmin({store}){const [a,setA]=useState({titre:'',contenu:'',active:true}); async function save(){ if(!a.titre)return; await store.saveAnnonce(a); setA({titre:'',contenu:'',active:true})} return <div className="adminTools"><h2><Megaphone/> Annonces</h2><div className="grid2"><input placeholder="Titre" value={a.titre} onChange={e=>setA({...a,titre:e.target.value})}/><select value={a.active} onChange={e=>setA({...a,active:e.target.value==='true'})}><option value="true">Visible</option><option value="false">Masqué</option></select></div><textarea placeholder="Contenu" value={a.contenu} onChange={e=>setA({...a,contenu:e.target.value})}/><button onClick={save}><Plus size={16}/> Enregistrer annonce</button>{store.annonces.map(x=><p className="rowItem" key={x.id}><span><b>{x.titre}</b><br/><small>{x.contenu}</small></span><button onClick={()=>setA(x)}><Edit3 size={14}/></button><button onClick={()=>store.deleteAnnonce(x.id)}><Trash2 size={14}/></button></p>)}</div>}
function MediaAdmin({store}){const [m,setM]=useState({title:'',url:''}); async function pick(e){const f=e.target.files?.[0]; if(!f)return; const up=await store.uploadFile(f); if(up) setM({...m,url:up.url,title:m.title||up.name})} return <div className="adminTools"><h2><ImageIcon/> Images / Galerie</h2><div className="grid2"><input placeholder="Titre image" value={m.title} onChange={e=>setM({...m,title:e.target.value})}/><input placeholder="URL image" value={m.url} onChange={e=>setM({...m,url:e.target.value})}/></div><input type="file" accept="image/*" onChange={pick}/><button onClick={()=>m.url&&(store.addMedia(m),setM({title:'',url:''}))}><Plus size={16}/> Ajouter image</button>{store.media.map(x=><p className="rowItem" key={x.id}>{x.title}<button onClick={()=>store.deleteMedia(x.id)}><Trash2 size={14}/></button></p>)}</div>}
function SettingsAdmin({store}){const [s,setS]=useState(store.settings),[c,setC]=useState(store.contacts); useEffect(()=>{setS(store.settings);setC(store.contacts)},[store.settings,store.contacts]); return <section><h1>Paramètres</h1><div className="twoCols"><div className="adminTools"><h2>Année scolaire</h2><Input l="Année scolaire" v={s.annee_scolaire} on={v=>setS({...s,annee_scolaire:v})}/><label>Message accueil<textarea value={s.message_accueil||''} onChange={e=>setS({...s,message_accueil:e.target.value})}/></label><label>État inscription<select value={s.inscription_ouverte?'true':'false'} onChange={e=>setS({...s,inscription_ouverte:e.target.value==='true'})}><option value="true">Ouverte</option><option value="false">Fermée</option></select></label><button onClick={()=>store.saveSettings(s)}>Enregistrer</button></div><div className="adminTools"><h2>Contacts modifiables</h2><Input l="Téléphone" v={c.telephone} on={v=>setC({...c,telephone:v})}/><Input l="Email école" type="email" v={c.email} on={v=>setC({...c,email:v})}/><Input l="Adresse" v={c.adresse} on={v=>setC({...c,adresse:v})}/><Input l="Facebook" v={c.facebook} on={v=>setC({...c,facebook:v})}/><button onClick={()=>store.saveContact(c)}>Enregistrer contact</button></div></div></section>}
function Gallery({store}){return <section className="card"><h2>Galerie / Informations</h2><div className="gallery"><img src={ECOLE}/>{store.media.map(m=><img key={m.id} src={m.url} title={m.title}/>)}</div></section>}
function Contact({store}){const c=store.contacts; return <section className="card contact"><h2>Contact</h2><p><Phone/> {c.telephone}</p><p><Mail/> {c.email}</p><p><MapPin/> {c.adresse}</p><p><Globe/> {c.facebook}</p></section>}
function PosterLeft(){return <div className="left"><BrandLogo/><h1>INSCRIPTION<br/><span>L.C.S.P</span></h1><h2>LYCÉE CATHOLIQUE SAINT PAUL</h2><p>Plateforme professionnelle d’inscription en ligne</p><Badge icon={<FileText/>} t="INSCRIPTION & RÉINSCRIPTION" d="Deux types de demande"/><Badge icon={<Shield/>} t="ADMIN SÉCURISÉ" d="Gestion complète"/><Badge icon={<BarChart3/>} t="DASHBOARD RÉEL" d="Statistiques automatiques"/></div>}
function App(){const store=useStore(); const [page,setPage]=useState('home'); const [admin,setAdmin]=useState(localStorage.getItem('lcsp_admin')==='1'); if(store.loading)return <div className="loading"><BrandLogo/><p>Chargement L.C.S.P...</p></div>; return <><div className="poster"><PosterLeft/><div className="site"><Header page={page} setPage={setPage} admin={admin} setAdmin={setAdmin}/>{store.error&&<div className="alert">{store.error}</div>}{page==='home'&&<Home store={store} setPage={setPage}/>} {page==='form'&&<FormPage store={store}/>} {page==='contact'&&<Contact store={store}/>} {page==='login'&&<Login setAdmin={setAdmin} setPage={setPage}/>} {page==='admin'&&admin&&<Admin store={store}/>} {page==='admin'&&!admin&&<Login setAdmin={setAdmin} setPage={setPage}/>}</div></div><footer>© Lycée Catholique Saint Paul Morondava · Copyright © R Edouard L.C.S.P · Plateforme sécurisée Supabase</footer></>}

createRoot(document.getElementById('root')).render(<App />)
