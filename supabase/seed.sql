-- ============================================================================
-- Helio CRM — Seed Data (~40 sample leads, demo org)
-- Run AFTER you've signed up a user via /signup. Replace YOUR_USER_ID below.
-- ============================================================================

-- 1. Create demo org
insert into orgs (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Helio Demo Agency')
  on conflict (id) do nothing;

-- 2. Settings
insert into org_settings (org_id) values ('00000000-0000-0000-0000-000000000001')
  on conflict (org_id) do nothing;

-- 3. Attach the most recently signed-up user to this org as admin.
-- (Adjust this to your needs — or run manually after sign-up.)
update profiles
   set org_id = '00000000-0000-0000-0000-000000000001', role = 'admin'
 where id = (select id from auth.users order by created_at desc limit 1);

-- 4. Sample leads spread across timezones + temperatures + statuses.
insert into leads (org_id, name, company, title, email, phone, city, state, country, timezone, industry, service_interest, source, status, temperature, attempts, notes, created_at)
values
  ('00000000-0000-0000-0000-000000000001','Marcus Chen','BrightWave Studios','Founder','marcus@brightwave.io','+12125551001','New York','NY','US','America/New_York','SaaS','Web Dev','LinkedIn','New','Hot',0,'Referred by Sarah K. Series A funded.', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001','Priya Sharma','Loomstack','Head of Marketing','priya@loomstack.com','+13105551002','Los Angeles','CA','US','America/Los_Angeles','E-com','Branding','Cold list','Attempting','Warm',2,'Wants rebrand before holiday push.', now() - interval '7 days'),
  ('00000000-0000-0000-0000-000000000001','David Kowalski','Northwind GC','Owner','david@northwindgc.com','+13125551003','Chicago','IL','US','America/Chicago','Construction','Web Dev','Referral','Connected','Hot',1,'Needs lead capture site, has budget.', now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000001','Aisha Bello','Verdant Wellness','CEO','aisha@verdantwell.com','+18325551004','Houston','TX','US','America/Chicago','Health','E-com','Website form','In Discussion','Hot',3,'Demo scheduled Thursday.', now() - interval '10 days'),
  ('00000000-0000-0000-0000-000000000001','Ben Carter','Carter & Sons','Operations','ben@cartersons.co','+14045551005','Atlanta','GA','US','America/New_York','Construction','Web Dev','Cold list','New','Warm',0,'', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001','Sofia Rossi','Lumen Skincare','Founder','sofia@lumenskin.com','+16175551006','Boston','MA','US','America/New_York','E-com','Branding','Instagram','Follow-up','Hot',2,'Asked for proposal last Tue.', now() - interval '14 days'),
  ('00000000-0000-0000-0000-000000000001','Jake Müller','Anchor SaaS','Co-founder','jake@anchorsaas.io','+12065551007','Seattle','WA','US','America/Los_Angeles','SaaS','Web Dev','LinkedIn','New','Warm',0,'', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000001','Nina Park','GreenLeaf Co','Marketing Lead','nina@greenleaf.co','+15035551008','Portland','OR','US','America/Los_Angeles','E-com','SEO','Referral','Attempting','Warm',1,'', now() - interval '6 days'),
  ('00000000-0000-0000-0000-000000000001','Omar Haddad','Pulse Fitness','Owner','omar@pulsefit.com','+17025551009','Las Vegas','NV','US','America/Los_Angeles','Health','Web Dev','Cold list','New','Cold',0,'', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001','Hannah Lee','Polaris Legal','Partner','hannah@polarislegal.com','+12155551010','Philadelphia','PA','US','America/New_York','Legal','Branding','Referral','Connected','Hot',2,'Wants thought-leadership site.', now() - interval '8 days'),
  ('00000000-0000-0000-0000-000000000001','Carlos Mendez','Mendez Construction','GM','carlos@mendezcg.com','+12105551011','San Antonio','TX','US','America/Chicago','Construction','Web Dev','Cold list','Follow-up','Warm',3,'Said call back next week.', now() - interval '12 days'),
  ('00000000-0000-0000-0000-000000000001','Lily Thompson','Thompson Realty','Broker','lily@thompsonrealty.com','+19045551012','Jacksonville','FL','US','America/New_York','Real Estate','Web Dev','Website form','Attempting','Hot',2,'High intent, follow up Thu.', now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000000001','Ravi Iyer','Tessera Cloud','VP Eng','ravi@tessera.cloud','+14155551013','San Francisco','CA','US','America/Los_Angeles','SaaS','Web Dev','LinkedIn','New','Hot',0,'Founder is open to new agency.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001','Maya Patel','Wisp Tea','Founder','maya@wisptea.com','+13035551014','Denver','CO','US','America/Denver','E-com','Branding','Instagram','In Discussion','Hot',1,'Budget confirmed 25k.', now() - interval '9 days'),
  ('00000000-0000-0000-0000-000000000001','Tom Reynolds','Reynolds Auto','Owner','tom@reynoldsauto.com','+16025551015','Phoenix','AZ','US','America/Phoenix','Auto','Web Dev','Cold list','New','Cold',0,'', now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000001','Elena Vargas','Tempo Marketing','Director','elena@tempomkt.com','+17135551016','Houston','TX','US','America/Chicago','Marketing','Web Dev','Referral','Connected','Warm',2,'', now() - interval '11 days'),
  ('00000000-0000-0000-0000-000000000001','Adam Wright','Wright Logistics','VP Ops','adam@wrightlog.com','+18185551017','Burbank','CA','US','America/Los_Angeles','Logistics','Web Dev','Cold list','Follow-up','Warm',4,'', now() - interval '20 days'),
  ('00000000-0000-0000-0000-000000000001','Beatrice King','King Bakery','Owner','bea@kingbakery.com','+16175551018','Cambridge','MA','US','America/New_York','Food','Branding','Instagram','New','Warm',0,'', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001','Henry Liu','Liu Dental Group','Practice Mgr','henry@liudental.com','+19495551019','Irvine','CA','US','America/Los_Angeles','Health','Web Dev','Referral','Attempting','Warm',1,'', now() - interval '6 days'),
  ('00000000-0000-0000-0000-000000000001','Grace Williams','Wave Capital','Partner','grace@wavecap.vc','+12025551020','Washington','DC','US','America/New_York','Finance','Branding','LinkedIn','In Discussion','Hot',2,'Wants portfolio refresh.', now() - interval '13 days'),
  ('00000000-0000-0000-0000-000000000001','Lucas Brown','Brown & Co','Founder','lucas@brownco.com','+15035551021','Portland','OR','US','America/Los_Angeles','Consulting','Web Dev','Cold list','Not Interested','Cold',2,'No budget this year.', now() - interval '25 days'),
  ('00000000-0000-0000-0000-000000000001','Isabella Costa','Costa Designs','Owner','isabella@costadesigns.com','+13055551022','Miami','FL','US','America/New_York','Design','Web Dev','Instagram','New','Hot',0,'', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001','Noah Adams','Adams Engineering','Principal','noah@adamseng.com','+17345551023','Detroit','MI','US','America/Detroit','Engineering','Web Dev','Cold list','Attempting','Warm',2,'', now() - interval '8 days'),
  ('00000000-0000-0000-0000-000000000001','Zara Ahmed','Apex Salon','Owner','zara@apexsalon.com','+14695551024','Dallas','TX','US','America/Chicago','Beauty','Web Dev','Website form','New','Warm',0,'', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000001','Ethan Garcia','Garcia Trucking','VP','ethan@garciatrk.com','+16025551025','Phoenix','AZ','US','America/Phoenix','Logistics','Web Dev','Cold list','Follow-up','Cold',5,'Possibly cold dead.', now() - interval '35 days'),
  ('00000000-0000-0000-0000-000000000001','Olivia Stewart','Stewart Law','Attorney','olivia@stewartlaw.com','+12065551026','Seattle','WA','US','America/Los_Angeles','Legal','Web Dev','Referral','Connected','Hot',1,'Wants new site by Q3.', now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000000001','Mason Wright','Wright HVAC','Owner','mason@wrighthvac.com','+18155551027','Rockford','IL','US','America/Chicago','HVAC','Web Dev','Cold list','New','Warm',0,'', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001','Emily Hughes','Hughes Boutique','Founder','emily@hughesb.com','+12155551028','Philadelphia','PA','US','America/New_York','E-com','Branding','Instagram','In Discussion','Hot',2,'Sample design approved.', now() - interval '7 days'),
  ('00000000-0000-0000-0000-000000000001','Daniel Ross','Ross Insurance','Agent','daniel@rossins.com','+12705551029','Louisville','KY','US','America/New_York','Insurance','Web Dev','Cold list','Attempting','Cold',3,'', now() - interval '18 days'),
  ('00000000-0000-0000-0000-000000000001','Chloe Bennett','Bennett Catering','Owner','chloe@bennettcat.com','+18585551030','San Diego','CA','US','America/Los_Angeles','Food','Web Dev','Website form','New','Warm',0,'', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001','Liam OConnor','OConnor Realty','Broker','liam@oconnorrealty.com','+16175551031','Boston','MA','US','America/New_York','Real Estate','Web Dev','Referral','Follow-up','Warm',3,'Wants update before listing season.', now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000000001','Ava Murphy','Murphy Pediatrics','Office Mgr','ava@murphyped.com','+16515551032','St. Paul','MN','US','America/Chicago','Health','Web Dev','Cold list','New','Cold',0,'', now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000001','Jacob Patel','Patel Tech','CTO','jacob@pateltech.com','+15125551033','Austin','TX','US','America/Chicago','SaaS','Web Dev','LinkedIn','Qualified','Hot',2,'Signed proposal. Ready for kickoff.', now() - interval '6 days'),
  ('00000000-0000-0000-0000-000000000001','Mia Roberts','Roberts Architecture','Principal','mia@robertsarch.com','+15035551034','Portland','OR','US','America/Los_Angeles','Architecture','Branding','Referral','Connected','Warm',1,'', now() - interval '9 days'),
  ('00000000-0000-0000-0000-000000000001','Logan Davis','Davis Roofing','Owner','logan@davisroof.com','+18015551035','Salt Lake City','UT','US','America/Denver','Construction','Web Dev','Cold list','New','Cold',0,'', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001','Harper Cole','Cole Fitness','Owner','harper@colefit.com','+17025551036','Las Vegas','NV','US','America/Los_Angeles','Health','Web Dev','Website form','Attempting','Warm',2,'', now() - interval '10 days'),
  ('00000000-0000-0000-0000-000000000001','Levi Foster','Foster Marketing','Director','levi@fostermkt.com','+19545551037','Fort Lauderdale','FL','US','America/New_York','Marketing','Web Dev','LinkedIn','Follow-up','Hot',4,'Said yes pending budget review.', now() - interval '21 days'),
  ('00000000-0000-0000-0000-000000000001','Aria Khan','Khan Restaurants','Owner','aria@khanrest.com','+14085551038','San Jose','CA','US','America/Los_Angeles','Food','Web Dev','Referral','New','Hot',0,'Multi-location, big potential.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001','Wyatt Clark','Clark Solar','Founder','wyatt@clarksolar.com','+15205551039','Tucson','AZ','US','America/Phoenix','Energy','Web Dev','Cold list','Attempting','Warm',1,'', now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000000001','Layla Brooks','Brooks Wellness','CEO','layla@brookswell.com','+13035551040','Denver','CO','US','America/Denver','Health','Branding','Instagram','In Discussion','Hot',2,'Wants brand bible + new site.', now() - interval '11 days');

-- 5. Sample history rows so analytics is non-empty
insert into lead_history (org_id, lead_id, type, disposition, note, created_at)
select
  '00000000-0000-0000-0000-000000000001',
  id,
  'call',
  (array['Answered','Voicemail','No Answer','Callback Requested','Not Interested'])[1 + floor(random()*5)::int],
  'Auto-seeded attempt',
  now() - (random() * interval '14 days')
from leads
where org_id = '00000000-0000-0000-0000-000000000001' and attempts > 0
limit 60;

-- 6. Sample tasks & one project
insert into tasks (org_id, title, due_at, priority) values
  ('00000000-0000-0000-0000-000000000001','Send proposal to Marcus Chen', now() + interval '1 day','high'),
  ('00000000-0000-0000-0000-000000000001','Prep demo for Verdant Wellness', now() + interval '2 days','high'),
  ('00000000-0000-0000-0000-000000000001','Follow up Sofia Rossi (Tue)', now() + interval '3 days','medium'),
  ('00000000-0000-0000-0000-000000000001','Update CRM after morning calls', now() - interval '1 day','low');

insert into projects (org_id, lead_id, name, stage, value, start_date)
select '00000000-0000-0000-0000-000000000001', id, company || ' — Website Redesign', 'Discovery', 18000, current_date
from leads where company = 'Patel Tech' and org_id = '00000000-0000-0000-0000-000000000001';
