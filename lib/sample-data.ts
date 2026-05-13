import type { Lead, LeadHistory, Project, Task } from "@/types";
import { resolveTimezone } from "./timezones";
import { normalizePhone } from "./utils";

const DEMO_ORG = "demo";
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();

function mkLead(
  i: number,
  data: Partial<Lead> & { name: string; city: string; state: string }
): Lead {
  const tz = resolveTimezone(data.city, data.state, data.country ?? "US");
  return {
    id: `seed-${i}`,
    org_id: DEMO_ORG,
    owner_id: null,
    name: data.name,
    company: data.company ?? null,
    title: data.title ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    phone_normalized: normalizePhone(data.phone ?? null),
    city: data.city,
    state: data.state,
    country: data.country ?? "US",
    timezone: tz,
    industry: data.industry ?? null,
    service_interest: data.service_interest ?? null,
    source: data.source ?? "Cold list",
    tags: data.tags ?? [],
    status: data.status ?? "New",
    temperature: data.temperature ?? "Warm",
    pipeline: data.pipeline ?? "New",
    score: 0,
    attempts: data.attempts ?? 0,
    budget: data.budget ?? null,
    decision_maker: data.decision_maker ?? false,
    next_callback_at: data.next_callback_at ?? null,
    last_contact_at: data.last_contact_at ?? null,
    notes: data.notes ?? null,
    created_at: data.created_at ?? daysAgo(Math.floor(Math.random() * 30)),
    updated_at: new Date().toISOString(),
  };
}

export const SAMPLE_LEADS: Lead[] = [
  mkLead(1,  { name: "Marcus Chen",     company: "BrightWave Studios", title: "Founder",        email: "marcus@brightwave.io",  phone: "+12125551001", city: "New York",      state: "NY", industry: "SaaS",         service_interest: "Web Dev",  source: "LinkedIn",      status: "New",            temperature: "Hot",  attempts: 0, notes: "Referred by Sarah K. Series A funded.",        created_at: daysAgo(2) }),
  mkLead(2,  { name: "Priya Sharma",    company: "Loomstack",          title: "Head of Marketing", email: "priya@loomstack.com",  phone: "+13105551002", city: "Los Angeles",   state: "CA", industry: "E-com",        service_interest: "Branding", source: "Cold list",     status: "Attempting",     temperature: "Warm", attempts: 2, notes: "Wants rebrand before holiday push.",          created_at: daysAgo(7) }),
  mkLead(3,  { name: "David Kowalski",  company: "Northwind GC",       title: "Owner",          email: "david@northwindgc.com", phone: "+13125551003", city: "Chicago",       state: "IL", industry: "Construction", service_interest: "Web Dev",  source: "Referral",      status: "Connected",      temperature: "Hot",  attempts: 1, notes: "Needs lead capture site, has budget.",        created_at: daysAgo(4), budget: 15000, decision_maker: true }),
  mkLead(4,  { name: "Aisha Bello",     company: "Verdant Wellness",   title: "CEO",            email: "aisha@verdantwell.com", phone: "+18325551004", city: "Houston",       state: "TX", industry: "Health",       service_interest: "E-com",    source: "Website form",  status: "In Discussion",  temperature: "Hot",  attempts: 3, notes: "Demo scheduled Thursday.",                    created_at: daysAgo(10), next_callback_at: new Date(Date.now() + 86400000).toISOString(), budget: 28000, decision_maker: true }),
  mkLead(5,  { name: "Ben Carter",      company: "Carter & Sons",      title: "Operations",     email: "ben@cartersons.co",     phone: "+14045551005", city: "Atlanta",       state: "GA", industry: "Construction", service_interest: "Web Dev",  source: "Cold list",     status: "New",            temperature: "Warm", attempts: 0, created_at: daysAgo(1) }),
  mkLead(6,  { name: "Sofia Rossi",     company: "Lumen Skincare",     title: "Founder",        email: "sofia@lumenskin.com",   phone: "+16175551006", city: "Boston",        state: "MA", industry: "E-com",        service_interest: "Branding", source: "Instagram",     status: "Follow-up",      temperature: "Hot",  attempts: 2, notes: "Asked for proposal last Tue.",                created_at: daysAgo(14), next_callback_at: new Date().toISOString() }),
  mkLead(7,  { name: "Jake Müller",     company: "Anchor SaaS",        title: "Co-founder",     email: "jake@anchorsaas.io",    phone: "+12065551007", city: "Seattle",       state: "WA", industry: "SaaS",         service_interest: "Web Dev",  source: "LinkedIn",      status: "New",            temperature: "Warm", attempts: 0, created_at: daysAgo(3) }),
  mkLead(8,  { name: "Nina Park",       company: "GreenLeaf Co",       title: "Marketing Lead", email: "nina@greenleaf.co",     phone: "+15035551008", city: "Portland",      state: "OR", industry: "E-com",        service_interest: "SEO",      source: "Referral",      status: "Attempting",     temperature: "Warm", attempts: 1, created_at: daysAgo(6) }),
  mkLead(9,  { name: "Omar Haddad",     company: "Pulse Fitness",      title: "Owner",          email: "omar@pulsefit.com",     phone: "+17025551009", city: "Las Vegas",     state: "NV", industry: "Health",       service_interest: "Web Dev",  source: "Cold list",     status: "New",            temperature: "Cold", attempts: 0, created_at: daysAgo(2) }),
  mkLead(10, { name: "Hannah Lee",      company: "Polaris Legal",      title: "Partner",        email: "hannah@polarislegal.com", phone: "+12155551010", city: "Philadelphia", state: "PA", industry: "Legal",        service_interest: "Branding", source: "Referral",      status: "Connected",      temperature: "Hot",  attempts: 2, notes: "Wants thought-leadership site.",              created_at: daysAgo(8) }),
  mkLead(11, { name: "Carlos Mendez",   company: "Mendez Construction", title: "GM",             email: "carlos@mendezcg.com",   phone: "+12105551011", city: "San Antonio",  state: "TX", industry: "Construction", service_interest: "Web Dev",  source: "Cold list",     status: "Follow-up",      temperature: "Warm", attempts: 3, notes: "Said call back next week.",                   created_at: daysAgo(12) }),
  mkLead(12, { name: "Lily Thompson",   company: "Thompson Realty",    title: "Broker",         email: "lily@thompsonrealty.com", phone: "+19045551012", city: "Jacksonville", state: "FL", industry: "Real Estate",  service_interest: "Web Dev",  source: "Website form",  status: "Attempting",     temperature: "Hot",  attempts: 2, notes: "High intent, follow up Thu.",                 created_at: daysAgo(5) }),
  mkLead(13, { name: "Ravi Iyer",       company: "Tessera Cloud",      title: "VP Eng",         email: "ravi@tessera.cloud",    phone: "+14155551013", city: "San Francisco", state: "CA", industry: "SaaS",         service_interest: "Web Dev",  source: "LinkedIn",      status: "New",            temperature: "Hot",  attempts: 0, notes: "Founder is open to new agency.",              created_at: daysAgo(1) }),
  mkLead(14, { name: "Maya Patel",      company: "Wisp Tea",           title: "Founder",        email: "maya@wisptea.com",      phone: "+13035551014", city: "Denver",        state: "CO", industry: "E-com",        service_interest: "Branding", source: "Instagram",     status: "In Discussion",  temperature: "Hot",  attempts: 1, notes: "Budget confirmed 25k.",                       created_at: daysAgo(9), budget: 25000, decision_maker: true }),
  mkLead(15, { name: "Tom Reynolds",    company: "Reynolds Auto",      title: "Owner",          email: "tom@reynoldsauto.com",  phone: "+16025551015", city: "Phoenix",       state: "AZ", industry: "Auto",         service_interest: "Web Dev",  source: "Cold list",     status: "New",            temperature: "Cold", attempts: 0, created_at: daysAgo(4) }),
  mkLead(16, { name: "Elena Vargas",    company: "Tempo Marketing",    title: "Director",       email: "elena@tempomkt.com",    phone: "+17135551016", city: "Houston",       state: "TX", industry: "Marketing",    service_interest: "Web Dev",  source: "Referral",      status: "Connected",      temperature: "Warm", attempts: 2, created_at: daysAgo(11) }),
  mkLead(17, { name: "Adam Wright",     company: "Wright Logistics",   title: "VP Ops",         email: "adam@wrightlog.com",    phone: "+18185551017", city: "Burbank",       state: "CA", industry: "Logistics",    service_interest: "Web Dev",  source: "Cold list",     status: "Follow-up",      temperature: "Warm", attempts: 4, created_at: daysAgo(20) }),
  mkLead(18, { name: "Beatrice King",   company: "King Bakery",        title: "Owner",          email: "bea@kingbakery.com",    phone: "+16175551018", city: "Cambridge",     state: "MA", industry: "Food",         service_interest: "Branding", source: "Instagram",     status: "New",            temperature: "Warm", attempts: 0, created_at: daysAgo(2) }),
  mkLead(19, { name: "Henry Liu",       company: "Liu Dental Group",   title: "Practice Mgr",   email: "henry@liudental.com",   phone: "+19495551019", city: "Irvine",        state: "CA", industry: "Health",       service_interest: "Web Dev",  source: "Referral",      status: "Attempting",     temperature: "Warm", attempts: 1, created_at: daysAgo(6) }),
  mkLead(20, { name: "Grace Williams",  company: "Wave Capital",       title: "Partner",        email: "grace@wavecap.vc",      phone: "+12025551020", city: "Washington",    state: "DC", industry: "Finance",      service_interest: "Branding", source: "LinkedIn",      status: "In Discussion",  temperature: "Hot",  attempts: 2, notes: "Wants portfolio refresh.",                    created_at: daysAgo(13) }),
  mkLead(21, { name: "Lucas Brown",     company: "Brown & Co",         title: "Founder",        email: "lucas@brownco.com",     phone: "+15035551021", city: "Portland",      state: "OR", industry: "Consulting",   service_interest: "Web Dev",  source: "Cold list",     status: "Not Interested", temperature: "Cold", attempts: 2, notes: "No budget this year.",                        created_at: daysAgo(25) }),
  mkLead(22, { name: "Isabella Costa",  company: "Costa Designs",      title: "Owner",          email: "isabella@costadesigns.com", phone: "+13055551022", city: "Miami",      state: "FL", industry: "Design",       service_interest: "Web Dev",  source: "Instagram",     status: "New",            temperature: "Hot",  attempts: 0, created_at: daysAgo(1) }),
  mkLead(23, { name: "Noah Adams",      company: "Adams Engineering",  title: "Principal",      email: "noah@adamseng.com",     phone: "+17345551023", city: "Detroit",       state: "MI", industry: "Engineering",  service_interest: "Web Dev",  source: "Cold list",     status: "Attempting",     temperature: "Warm", attempts: 2, created_at: daysAgo(8) }),
  mkLead(24, { name: "Zara Ahmed",      company: "Apex Salon",         title: "Owner",          email: "zara@apexsalon.com",    phone: "+14695551024", city: "Dallas",        state: "TX", industry: "Beauty",       service_interest: "Web Dev",  source: "Website form",  status: "New",            temperature: "Warm", attempts: 0, created_at: daysAgo(3) }),
  mkLead(25, { name: "Ethan Garcia",    company: "Garcia Trucking",    title: "VP",             email: "ethan@garciatrk.com",   phone: "+16025551025", city: "Phoenix",       state: "AZ", industry: "Logistics",    service_interest: "Web Dev",  source: "Cold list",     status: "Follow-up",      temperature: "Cold", attempts: 5, notes: "Possibly cold dead.",                         created_at: daysAgo(35) }),
  mkLead(26, { name: "Olivia Stewart",  company: "Stewart Law",        title: "Attorney",       email: "olivia@stewartlaw.com", phone: "+12065551026", city: "Seattle",       state: "WA", industry: "Legal",        service_interest: "Web Dev",  source: "Referral",      status: "Connected",      temperature: "Hot",  attempts: 1, notes: "Wants new site by Q3.",                       created_at: daysAgo(5) }),
  mkLead(27, { name: "Mason Wright",    company: "Wright HVAC",        title: "Owner",          email: "mason@wrighthvac.com",  phone: "+18155551027", city: "Rockford",      state: "IL", industry: "HVAC",         service_interest: "Web Dev",  source: "Cold list",     status: "New",            temperature: "Warm", attempts: 0, created_at: daysAgo(2) }),
  mkLead(28, { name: "Emily Hughes",    company: "Hughes Boutique",    title: "Founder",        email: "emily@hughesb.com",     phone: "+12155551028", city: "Philadelphia",  state: "PA", industry: "E-com",        service_interest: "Branding", source: "Instagram",     status: "In Discussion",  temperature: "Hot",  attempts: 2, notes: "Sample design approved.",                     created_at: daysAgo(7), budget: 18000 }),
  mkLead(29, { name: "Daniel Ross",     company: "Ross Insurance",     title: "Agent",          email: "daniel@rossins.com",    phone: "+12705551029", city: "Louisville",    state: "KY", industry: "Insurance",    service_interest: "Web Dev",  source: "Cold list",     status: "Attempting",     temperature: "Cold", attempts: 3, created_at: daysAgo(18) }),
  mkLead(30, { name: "Chloe Bennett",   company: "Bennett Catering",   title: "Owner",          email: "chloe@bennettcat.com",  phone: "+18585551030", city: "San Diego",     state: "CA", industry: "Food",         service_interest: "Web Dev",  source: "Website form",  status: "New",            temperature: "Warm", attempts: 0, created_at: daysAgo(1) }),
  mkLead(31, { name: "Liam OConnor",    company: "OConnor Realty",     title: "Broker",         email: "liam@oconnorrealty.com", phone: "+16175551031", city: "Boston",       state: "MA", industry: "Real Estate",  service_interest: "Web Dev",  source: "Referral",      status: "Follow-up",      temperature: "Warm", attempts: 3, notes: "Wants update before listing season.",        created_at: daysAgo(15) }),
  mkLead(32, { name: "Ava Murphy",      company: "Murphy Pediatrics",  title: "Office Mgr",     email: "ava@murphyped.com",     phone: "+16515551032", city: "St. Paul",      state: "MN", industry: "Health",       service_interest: "Web Dev",  source: "Cold list",     status: "New",            temperature: "Cold", attempts: 0, created_at: daysAgo(4) }),
  mkLead(33, { name: "Jacob Patel",     company: "Patel Tech",         title: "CTO",            email: "jacob@pateltech.com",   phone: "+15125551033", city: "Austin",        state: "TX", industry: "SaaS",         service_interest: "Web Dev",  source: "LinkedIn",      status: "Qualified",      temperature: "Hot",  attempts: 2, notes: "Signed proposal. Ready for kickoff.",         created_at: daysAgo(6), budget: 35000, decision_maker: true, pipeline: "Won" }),
  mkLead(34, { name: "Mia Roberts",     company: "Roberts Architecture", title: "Principal",    email: "mia@robertsarch.com",   phone: "+15035551034", city: "Portland",      state: "OR", industry: "Architecture", service_interest: "Branding", source: "Referral",      status: "Connected",      temperature: "Warm", attempts: 1, created_at: daysAgo(9) }),
  mkLead(35, { name: "Logan Davis",     company: "Davis Roofing",      title: "Owner",          email: "logan@davisroof.com",   phone: "+18015551035", city: "Salt Lake City", state: "UT", industry: "Construction", service_interest: "Web Dev",  source: "Cold list",     status: "New",            temperature: "Cold", attempts: 0, created_at: daysAgo(2) }),
  mkLead(36, { name: "Harper Cole",     company: "Cole Fitness",       title: "Owner",          email: "harper@colefit.com",    phone: "+17025551036", city: "Las Vegas",     state: "NV", industry: "Health",       service_interest: "Web Dev",  source: "Website form",  status: "Attempting",     temperature: "Warm", attempts: 2, created_at: daysAgo(10) }),
  mkLead(37, { name: "Levi Foster",     company: "Foster Marketing",   title: "Director",       email: "levi@fostermkt.com",    phone: "+19545551037", city: "Fort Lauderdale", state: "FL", industry: "Marketing",  service_interest: "Web Dev",  source: "LinkedIn",      status: "Follow-up",      temperature: "Hot",  attempts: 4, notes: "Said yes pending budget review.",             created_at: daysAgo(21) }),
  mkLead(38, { name: "Aria Khan",       company: "Khan Restaurants",   title: "Owner",          email: "aria@khanrest.com",     phone: "+14085551038", city: "San Jose",      state: "CA", industry: "Food",         service_interest: "Web Dev",  source: "Referral",      status: "New",            temperature: "Hot",  attempts: 0, notes: "Multi-location, big potential.",              created_at: daysAgo(1) }),
  mkLead(39, { name: "Wyatt Clark",     company: "Clark Solar",        title: "Founder",        email: "wyatt@clarksolar.com",  phone: "+15205551039", city: "Tucson",        state: "AZ", industry: "Energy",       service_interest: "Web Dev",  source: "Cold list",     status: "Attempting",     temperature: "Warm", attempts: 1, created_at: daysAgo(5) }),
  mkLead(40, { name: "Layla Brooks",    company: "Brooks Wellness",    title: "CEO",            email: "layla@brookswell.com",  phone: "+13035551040", city: "Denver",        state: "CO", industry: "Health",       service_interest: "Branding", source: "Instagram",     status: "In Discussion",  temperature: "Hot",  attempts: 2, notes: "Wants brand bible + new site.",               created_at: daysAgo(11) }),
];

const DISPOSITIONS = ["Answered", "Voicemail", "No Answer", "Callback Requested", "Not Interested"];

export const SAMPLE_HISTORY: LeadHistory[] = SAMPLE_LEADS
  .filter((l) => l.attempts > 0)
  .flatMap((l) =>
    Array.from({ length: l.attempts }).map((_, idx) => ({
      id: `${l.id}-h${idx}`,
      lead_id: l.id,
      org_id: DEMO_ORG,
      by_user: null,
      type: "call" as const,
      disposition: DISPOSITIONS[idx % DISPOSITIONS.length],
      note: idx === l.attempts - 1 ? "Latest attempt" : null,
      meta: {},
      created_at: hoursAgo(idx * 18 + Math.random() * 6),
    }))
  );

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "proj-1",
    org_id: DEMO_ORG,
    lead_id: "seed-33",
    owner_id: null,
    name: "Patel Tech — Website Redesign",
    stage: "Kickoff",
    value: 35000,
    start_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    notes: "Kickoff scheduled. Design phase starts next week.",
    created_at: daysAgo(3),
    updated_at: new Date().toISOString(),
  },
];

export const SAMPLE_TASKS: Task[] = [
  { id: "task-1", org_id: DEMO_ORG, user_id: null, title: "Send proposal to Marcus Chen", description: null, due_at: new Date(Date.now() + 86400000).toISOString(), priority: "high", lead_id: "seed-1", project_id: null, done: false, created_at: new Date().toISOString() },
  { id: "task-2", org_id: DEMO_ORG, user_id: null, title: "Prep demo for Verdant Wellness", description: null, due_at: new Date(Date.now() + 2 * 86400000).toISOString(), priority: "high", lead_id: "seed-4", project_id: null, done: false, created_at: new Date().toISOString() },
  { id: "task-3", org_id: DEMO_ORG, user_id: null, title: "Follow up Sofia Rossi (Tue)", description: null, due_at: new Date(Date.now() + 3 * 86400000).toISOString(), priority: "medium", lead_id: "seed-6", project_id: null, done: false, created_at: new Date().toISOString() },
  { id: "task-4", org_id: DEMO_ORG, user_id: null, title: "Update CRM after morning calls", description: null, due_at: new Date(Date.now() - 86400000).toISOString(), priority: "low", lead_id: null, project_id: null, done: false, created_at: new Date().toISOString() },
  { id: "task-5", org_id: DEMO_ORG, user_id: null, title: "Review weekly analytics", description: null, due_at: new Date().toISOString(), priority: "medium", lead_id: null, project_id: null, done: false, created_at: new Date().toISOString() },
];
