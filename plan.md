Piano Tecnico MVP: SparkLab — Piattaforma Co-founding

1. Architettura e Stack Tecnologico

Frontend: Next.js (App Router) + React + Tailwind CSS + shadcn/ui + Lucide Icons

Backend & Auth: Supabase (PostgreSQL, Auth nativa, RLS policies)

Tema: next-themes per gestione nativa Light / Dark mode.

Hosting: Vercel

2. Brand & UI/UX

Nome: SparkLab

Target: Studenti universitari, aspiranti startupper, mix di talenti tecnici e di business.

Palette Colori: Arancione come primario (es. Tailwind orange-500 / #f97316), sfondi neutri (bianco su light, grigio scuro/ardesia su dark mode).

Responsive Design: L'interfaccia DEVE adattarsi perfettamente sia a Mobile (navigazione a schede in basso) sia a PC/Desktop (Sidebar laterale o Navbar superiore completa).

3. Database Schema (Supabase)

Tabella profiles

|

| Colonna | Tipo | Note |
| id | uuid | PK, FK -> auth.users |
| full_name | text |  |
| avatar_url | text | nullable |
| role_badge | text | 'tech_dev', 'design', 'marketing', 'business' |
| skills | text

 | Array di competenze |
| bio | text | nullable |
| availability | text | 'available', 'busy', 'consulting' |
| created_at | timestamptz | DEFAULT NOW() |

Tabella projects

| Colonna | Tipo | Note |
| id | uuid | PK, gen_random_uuid() |
| owner_id | uuid | FK -> profiles.id |
| title | text |  |
| short_pitch | text | MAX 140 caratteri |
| readme_markdown | text | Descrizione estesa dell'idea |
| open_roles | text

 | Ruoli cercati (es. "Frontend Dev") |
| tags | text

 | Categorie (AI, SaaS, Fintech...) |
| stars_count | integer | DEFAULT 0 |
| created_at | timestamptz | DEFAULT NOW() |

Tabella project_comments (NUOVA - Per la parte Social)

Fondamentale per far interagire i founder e chi si vuole candidare pubblicamente.

| Colonna | Tipo | Note |
| id | uuid | PK |
| project_id | uuid | FK -> projects.id |
| author_id | uuid | FK -> profiles.id |
| content | text | Testo del commento / feedback |
| created_at | timestamptz | DEFAULT NOW() |

Tabella applications (Candidature private)

| Colonna | Tipo | Note |
| id | uuid | PK |
| project_id | uuid | FK -> projects.id |
| applicant_id | uuid | FK -> profiles.id |
| target_role | text | Ruolo per cui ci si candida |
| message | text | Messaggio privato (mini-pitch personale) |
| status | text | 'pending', 'accepted', 'rejected' |

Tabella project_stars

| Colonna | Tipo | Note |
| project_id | uuid | PK composita, FK -> projects.id |
| user_id | uuid | PK composita, FK -> profiles.id |

4. Struttura della Navigazione (Core)

La navigazione sarà divisa in 3 sezioni principali (Tabs):

🏠 Home (Feed & Ricerca):

Barra di ricerca testuale (per nome, pitch).

Filtri a bottoni scorrevoli per tags (Tutte, AI, Fintech, DevTools, ecc.).

Feed scorrevole delle startup (ordinato cronologicamente o per mix di novità/rilevanza).

🏆 Esplora (Classifica & Scoperta):

Leaderboard dei progetti con più "Stelle" (I più votati della settimana/mese).

Progetti "Trending" per stimolare la competizione sana e la visibilità.

👤 Profilo (Area Personale):

Se l'utente NON è loggato: Schermata di Login/Registrazione (Magic Link / GitHub / Google).

Se l'utente è loggato: La sua pagina "Proof of Work" (competenze, startup create, status disponibilità).

5. UX Flow: Dettaglio Progetto & Social

Quando si clicca su una "Card" progetto dalla Home:

Vista Dettaglio: Pagina dedicata al progetto.

Sezione Pitch: Header colorato, descrizione markdown, ruoli aperti.

Sezione Community (Commenti): Un'area discussione in stile Product Hunt / YC Hacker News, dove gli utenti possono fare domande sull'idea, dare feedback o offrire spunti.

Azione "Candidati": Apre un modale per inviare la propria candidatura ufficiale (invisibile al pubblico, visibile solo al founder) per i ruoli aperti.

6. Sicurezza e RLS (Row Level Security)

Commenti e Stelle: Chiunque può leggere (pubblico), solo gli utenti loggati possono inserire o rimuovere i propri.

Progetti e Profili: Visibili a tutti. Modificabili solo dal proprietario dell'account.

Candidature: Visibili solo a chi l'ha inviata (applicant_id) e al creatore del progetto (owner_id).