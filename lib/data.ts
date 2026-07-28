import { Profile, Project, ProjectComment } from "./types";
import { daysAgo } from "./utils";

export const SEED_PROFILES: Profile[] = [
  {
    id: "p-giulia",
    full_name: "Giulia Ferretti",
    avatar_url: null,
    role_badge: "design",
    skills: ["Figma", "Design System", "Prototyping", "Branding"],
    bio: "Design student at Politecnico di Milano. Credo che il buon design sia invisibile.",
    availability: "available",
    university: "Politecnico di Milano",
    created_at: daysAgo(120),
  },
  {
    id: "p-marco",
    full_name: "Marco Esposito",
    avatar_url: null,
    role_badge: "tech_dev",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    bio: "Full-stack dev, laureando in Informatica. Costruisco MVP nel weekend.",
    availability: "consulting",
    university: "Sapienza Roma",
    created_at: daysAgo(200),
  },
  {
    id: "p-sofia",
    full_name: "Sofia Ricci",
    avatar_url: null,
    role_badge: "business",
    skills: ["Business Model", "Pitch", "Ricerca di mercato", "Excel"],
    bio: "Economia a Bologna. Ossessionata dalla validazione prima del codice.",
    availability: "available",
    university: "Università di Bologna",
    created_at: daysAgo(90),
  },
  {
    id: "p-alessandro",
    full_name: "Alessandro Greco",
    avatar_url: null,
    role_badge: "tech_dev",
    skills: ["Python", "Machine Learning", "FastAPI", "PyTorch"],
    bio: "AI enthusiast. Alleno modelli, ma so anche venderli (quasi).",
    availability: "busy",
    university: "Università di Padova",
    created_at: daysAgo(300),
  },
  {
    id: "p-chiara",
    full_name: "Chiara Marchetti",
    avatar_url: null,
    role_badge: "marketing",
    skills: ["TikTok Ads", "Copywriting", "SEO", "Community"],
    bio: "Growth hacker in erba. Ho fatto 100k views vendendo evidenziatori.",
    availability: "available",
    university: "Università di Torino",
    created_at: daysAgo(150),
  },
  {
    id: "p-lorenzo",
    full_name: "Lorenzo Vitale",
    avatar_url: null,
    role_badge: "tech_dev",
    skills: ["Flutter", "Firebase", "Swift", "UI Animations"],
    bio: "Mobile dev. Se non è fluido a 60fps non lo shipppo.",
    availability: "available",
    university: "Università di Napoli",
    created_at: daysAgo(75),
  },
  {
    id: "p-elena",
    full_name: "Elena Colombo",
    avatar_url: null,
    role_badge: "business",
    skills: ["Finanza", "Fundraising", "Notion", "Public Speaking"],
    bio: "Ex-consulente, ora studentessa di Management. Cerco l'idea giusta.",
    availability: "consulting",
    university: "Bocconi, Milano",
    created_at: daysAgo(60),
  },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: "pr-thesisai",
    owner_id: "p-alessandro",
    title: "ThesisAI",
    short_pitch: "L'assistente AI che ti aiuta a scrivere la tesi: fonti verificate, citazioni automatiche, zero panico.",
    readme_markdown: `## Il Problema

Ogni anno **500.000+ studenti italiani** scrivono una tesi. Tutti passano le stesse settimane d'inferno: fonti sparse, citazioni formattate a mano, panico da pagina bianca.

## La Soluzione

ThesisAI è un copilota per la scrittura accademica:

- **Ricerca fonti** su Google Scholar con ranking di affidabilità
- **Citazioni automatiche** in APA, MLA e stile italiano
- **Outline intelligente** che impara dalla struttura delle migliori tesi del tuo dipartimento
- Rilevatore di parafrasi troppo aggressive (anti-plagio preventivo)

## Il Mercato

Partiamo dalle tesi di laurea in Italia, poi tesi di dottorato e paper di ricerca in Europa. Modello freemium: 9€/mese durante l'ultimo anno.

## Stato attuale

Prototype funzionante in Python + FastAPI. Manca il frontend e qualcuno che ci aiuti a validare con studenti veri.`,
    open_roles: ["Frontend Developer", "UX Designer"],
    tags: ["AI", "EdTech"],
    stars_count: 47,
    location: "Padova",
    created_at: daysAgo(2, 5),
  },
  {
    id: "pr-mensago",
    owner_id: "p-sofia",
    title: "MensaGo",
    short_pitch: "Salta la fila in mensa universitaria: ordina dall'app, ritira al banco, mangia in pace.",
    readme_markdown: `## Il Problema

Pausa pranzo di 1 ora, **40 minuti in fila**. Le mense universitarie italiane servono migliaia di pasti in finestre di tempo identiche.

## La Soluzione

- Pre-ordine del menu del giorno dall'app
- Slot di ritiro ogni 5 minuti
- Pagamento in app (o credito mensa ESU)
- **Gamification**: punti per chi ordina fuori picco

## Perché ora

Le mense stanno digitalizzando i tornelli. Noi portiamo la coda virtuale, loro riducono gli sprechi (sanno in anticipo quanti pasti preparare).

## Stato attuale

LOI firmata con una mensa pilota a Bologna (1.200 pasti/giorno). Cerchiamo chi costruisce l'app.`,
    open_roles: ["Mobile Developer (Flutter)", "Backend Developer"],
    tags: ["Food", "Mobile"],
    stars_count: 38,
    location: "Bologna",
    created_at: daysAgo(4, 2),
  },
  {
    id: "pr-studyswap",
    owner_id: "p-giulia",
    title: "StudySwap",
    short_pitch: "Il marketplace degli appunti: carichi i tuoi riassunti, guadagni crediti, scarichi quelli degli altri.",
    readme_markdown: `## Il Problema

Gli appunti migliori circolano su gruppi Telegram caotici e PDF senza nome. Chi li produce non ci guadagna nulla, chi li cerca impazzisce.

## La Soluzione

- **Upload di appunti e riassunti** verificati per corso e professore
- Sistema a crediti: carichi → guadagni → scarichi
- Rating della community su qualità e affidabilità
- Modalità "esame imminente": i materiali più votati in cima

## Differenza rispetto a Docsity/StuDocu

Solo community universitarie verificate (email istituzionale), zero contenuti rubati, focus sui corsi italiani.

## Stato attuale

Design system completo in Figma, 60 schermate. Cerco un co-founder tecnico per costruire l'MVP.`,
    open_roles: ["Full-stack Developer", "Marketing / Community"],
    tags: ["EdTech", "Marketplace"],
    stars_count: 29,
    location: "Milano",
    created_at: daysAgo(6, 8),
  },
  {
    id: "pr-paymate",
    owner_id: "p-elena",
    title: "PayMate",
    short_pitch: "Dividi le spese con i coinquilini fuorisede senza più litigare: affitto, bollette, pizza del venerdì.",
    readme_markdown: `## Il Problema

**1,5 milioni di studenti fuorisede** in Italia dividono case e spese. Risultato: fogli Excel rotti, "ti ridò i soldi domani", amicizie rovinate.

## La Soluzione

- Gruppi-casa con spese condivise e split personalizzati
- **Saldo netto intelligente**: minimizza i bonifici necessari
- Promemoria gentili (ma insistiti) per i ritardatari
- Integrazione Satispay / bonifico istantaneo

## Modello

Free per studenti. Revenue da partnership (assicurazioni affitto, utenze luce/gas per fuorisede).

## Stato attuale

Validazione: 200+ studenti intervistati, 87% userebbe l'app domani. Wireframe pronti.`,
    open_roles: ["Mobile Developer", "Designer"],
    tags: ["Fintech", "Mobile"],
    stars_count: 26,
    location: "Milano",
    created_at: daysAgo(8),
  },
  {
    id: "pr-ecocampus",
    owner_id: "p-chiara",
    title: "EcoCampus",
    short_pitch: "La sostenibilità del tuo ateneo diventa un gioco: sfide green tra dipartimenti, premi veri.",
    readme_markdown: `## Il Problema

Le università vogliono essere sostenibili ma **gli studenti non sono coinvolti**. Le iniziative green finiscono in circolari ignorate.

## La Soluzione

- **Sfide settimanali**: raccolta differenziata, bici vs auto, consumo mensa sostenibile
- Classifica live tra dipartimenti
- Premi reali: sconti mensa, gadget, crediti formativi
- Dashboard per l'ateneo con dati aggregati

## Traction

2 dipartimenti di Torino pronti per un pilot ad ottobre. Conversazioni aperte con il CINECA.

## Stato attuale

Landing page + brand identity. Cerchiamo sviluppatori per il MVP della piattaforma.`,
    open_roles: ["Full-stack Developer", "Game Designer"],
    tags: ["Green", "Social"],
    stars_count: 22,
    location: "Torino",
    created_at: daysAgo(10, 3),
  },
  {
    id: "pr-devstage",
    owner_id: "p-marco",
    title: "DevStage",
    short_pitch: "Gli stage nelle startup italiane, finalmente in un posto solo: solo annunci verificati e pagati.",
    readme_markdown: `## Il Problema

Trovare uno stage decente in una startup è un terno al lotto: LinkedIn è rumoroso, i gruppi universitari sono spam, metà degli annunci sono "stage retribuito in visibilità".

## La Soluzione

- **Solo startup verificate** (partita IVA + almeno un dipendente)
- **Solo stage pagati**: lo dichiariamo in homepage
- Match per skill e disponibilità, non per keyword
- Review anonime di chi ha già fatto stage lì (stile Glassdoor)

## Perché funziona

Le startup fanno fatica a trovare studenti bravi. Gli studenti fanno fatica a fidarsi. Noi siamo il layer di fiducia.

## Stato attuale

MVP in React + Supabase all'80%. Serve qualcuno che parli con le startup (biz dev) e un designer per il polish finale.`,
    open_roles: ["Business Developer", "Product Designer"],
    tags: ["DevTools", "Marketplace"],
    stars_count: 19,
    location: "Roma",
    created_at: daysAgo(12, 6),
  },
  {
    id: "pr-fitlecture",
    owner_id: "p-lorenzo",
    title: "FitLecture",
    short_pitch: "Micro-workout da 7 minuti tra una lezione e l'altra. Niente palestra, solo tu e i corridoi.",
    readme_markdown: `## Il Problema

Sessione d'esame = 10 ore al giorno seduti. Schiena distrutta, concentrazione a zero, palestra abbandonata a gennaio.

## La Soluzione

- **Workout da 7 minuti** pensati per spazi piccoli (aula studio, camera, biblioteca)
- Routine silenziose (niente jumping jack in biblioteca)
- Streak e sfide con i compagni di corso
- Stretch guidati per chi sta ore sui libri

## Stato attuale

App Flutter in beta chiusa con 150 studenti. Retention giorno-30 al 34%. Vogliamo portarla in ogni ateneo.`,
    open_roles: ["Content Creator (Fitness)", "Marketing"],
    tags: ["Health", "Mobile"],
    stars_count: 15,
    location: "Napoli",
    created_at: daysAgo(15, 4),
  },
  {
    id: "pr-lingualocal",
    owner_id: "p-giulia",
    title: "LinguaLocal",
    short_pitch: "Tandem linguistico tra studenti internazionali e italiani: impari una lingua, trovi un amico.",
    readme_markdown: `## Il Problema

Gli studenti Erasmus restano tra di loro, gli italiani pure. **Due mondi nello stesso campus che non si parlano.**

## La Soluzione

- Match per lingue: tu insegni italiano, impari spagnolo/tedesco/cinese
- Ice-breaker integrati: sfide e attività da fare insieme in città
- Eventi settimanali nei locali partner
- Certificazione informale delle ore di tandem (utile per CV Erasmus+)

## Stato attuale

Community pilota di 300 studenti a Milano gestita via Google Forms (sì, davvero). È ora di costruire il prodotto vero.`,
    open_roles: ["Mobile Developer", "Community Manager"],
    tags: ["Social", "EdTech"],
    stars_count: 12,
    location: "Milano",
    created_at: daysAgo(18),
  },
];

export const SEED_COMMENTS: ProjectComment[] = [
  {
    id: "c1",
    project_id: "pr-thesisai",
    author_id: "p-sofia",
    content: "Geniale. Avete pensato a come gestire le policy anti-AI dei singoli atenei? Potrebbe essere il primo scoglio.",
    created_at: daysAgo(1, 3),
  },
  {
    id: "c2",
    project_id: "pr-thesisai",
    author_id: "p-giulia",
    content: "Posso aiutare con la UX! Ho già fatto una tesi su strumenti di scrittura assistita. Ti scrivo in privato.",
    created_at: daysAgo(1),
  },
  {
    id: "c3",
    project_id: "pr-mensago",
    author_id: "p-marco",
    content: "La LOI con la mensa pilota è un ottimo segnale. Come pensate di gestire i picchi se tutti scelgono lo stesso slot?",
    created_at: daysAgo(3),
  },
  {
    id: "c4",
    project_id: "pr-mensago",
    author_id: "p-chiara",
    content: "Se vi serve qualcuno per il lancio TikTok nelle uni di Bologna ci sto. Ho già i contatti con le pagine meme degli studenti.",
    created_at: daysAgo(2, 6),
  },
  {
    id: "c5",
    project_id: "pr-paymate",
    author_id: "p-lorenzo",
    content: "Splitwise ma focalizzato sui fuorisede italiani ha senso. L'integrazione Satispay è il killer feature qui.",
    created_at: daysAgo(6),
  },
  {
    id: "c6",
    project_id: "pr-devstage",
    author_id: "p-elena",
    content: "'Solo stage pagati' in homepage è una dichiarazione di guerra. Rispetto. Quando lanciate?",
    created_at: daysAgo(9),
  },
];

export const ALL_TAGS = ["AI", "EdTech", "Fintech", "Food", "Green", "Health", "Mobile", "Marketplace", "Social", "DevTools"];
