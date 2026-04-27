/**
 * Current holders of key Greek government positions.
 * Source: Official government website (government.gr)
 * Last verified: April 2025
 *
 * Update this file whenever a cabinet reshuffle occurs.
 * Each entry references a slug from config/governmentPositions.json.
 */

const governmentHolders = [
  // ── Leadership ──────────────────────────────────────────────────
  { slug: 'proedros-dimokratias',          holder: 'Κωνσταντίνος Τασούλας',      holderEn: 'Konstantinos Tasoulas',      party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'proedros-voulis',               holder: 'Νικήτας Κακλαμάνης',         holderEn: 'Nikitas Kaklamanis',         party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'prothypoyrgos',                 holder: 'Κυριάκος Μητσοτάκης',        holderEn: 'Kyriakos Mitsotakis',        party: 'ΝΔ',  partyEn: 'ND' },

  // ── Core ministries ─────────────────────────────────────────────
  { slug: 'ypoyrgos-ethnikis-oikonomias',  holder: 'Κωστής Χατζηδάκης',         holderEn: 'Kostis Hatzidakis',          party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-eksoterikon',          holder: 'Γιώργος Γεραπετρίτης',       holderEn: 'Giorgos Gerapetritis',       party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-amynas',               holder: 'Νίκος Δένδιας',              holderEn: 'Nikos Dendias',              party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-esoterikon',           holder: 'Θεόδωρος Λιβάνιος',          holderEn: 'Theodoros Livanios',         party: 'ΝΔ',  partyEn: 'ND' },

  // ── Social ministries ────────────────────────────────────────────
  { slug: 'ypoyrgos-paideias',             holder: 'Σοφία Ζαχαράκη',             holderEn: 'Sofia Zacharaki',            party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-ygeias',               holder: 'Αδωνις Γεωργιάδης',          holderEn: 'Adonis Georgiadis',          party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-ergasias',             holder: 'Νίκη Κεραμέως',              holderEn: 'Niki Kerameus',              party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-koinonikis-synochis',  holder: 'Σοφία Βούλτεψη',             holderEn: 'Sofia Voultepsi',            party: 'ΝΔ',  partyEn: 'ND' },

  // ── Development ministries ───────────────────────────────────────
  { slug: 'ypoyrgos-anaptyxis',            holder: 'Τάκης Θεοδωρικάκος',         holderEn: 'Takis Theodorikakos',        party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-ypodomon',             holder: 'Χρήστος Σταϊκούρας',         holderEn: 'Christos Staikouras',        party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-perivallon',           holder: 'Θόδωρος Σκυλακάκης',         holderEn: 'Theodoros Skylakakis',       party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-agrotikis',            holder: 'Λευτέρης Αυγενάκης',         holderEn: 'Lefteris Avgenakis',         party: 'ΝΔ',  partyEn: 'ND' },

  // ── Governance ministries ────────────────────────────────────────
  { slug: 'ypoyrgos-prostasias',           holder: 'Μιχάλης Χρυσοχοΐδης',       holderEn: 'Michalis Chrysochoidis',     party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-dikaiosynis',          holder: 'Γιώργος Φλωρίδης',           holderEn: 'Giorgos Floridis',           party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-metanastefsis',        holder: 'Δημήτρης Κεχαγιάς',          holderEn: 'Dimitris Kechagas',          party: 'ΝΔ',  partyEn: 'ND' },

  // ── Sectoral ministries ──────────────────────────────────────────
  { slug: 'ypoyrgos-politismoy',           holder: 'Λίνα Μενδώνη',               holderEn: 'Lina Mendoni',               party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-tourismoy',            holder: 'Όλγα Κεφαλογιάννη',          holderEn: 'Olga Kefalogianni',          party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-naftilias',            holder: 'Χρήστος Στυλιανίδης',        holderEn: 'Christos Stylianidis',       party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-psifiakis',            holder: 'Δημήτρης Παπαστεργίου',      holderEn: 'Dimitris Papastergiou',      party: 'ΝΔ',  partyEn: 'ND' },
  { slug: 'ypoyrgos-klimatikis',           holder: 'Εύη Χριστοφιλοπούλου',       holderEn: 'Evi Christofilopoulou',      party: 'ΝΔ',  partyEn: 'ND' },
];

export default governmentHolders;
