const { sequelize, GovernmentPosition, GovernmentCurrentHolder } = require('../models');
require('dotenv').config();

const holders = [
  { positionSlug: 'proedros-dimokratias', holderName: 'Κατερίνα Σακελλαροπούλου', since: '2020-03-13' },
  { positionSlug: 'proedros-voulis',       holderName: 'Κωνσταντίνος Τασούλας',    since: '2023-06-26' },
  { positionSlug: 'prothypoyrgos',         holderName: 'Κυριάκος Μητσοτάκης',      since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-oikonomikon',  holderName: 'Κωστής Χατζηδάκης',        since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-esoterikon',   holderName: 'Νίκη Κεραμέως',            since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-eksoterikon',  holderName: 'Γιώργος Γεραπετρίτης',     since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-amynas',       holderName: 'Νίκος Δένδιας',            since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-dikaiosynis',  holderName: 'Γιώργος Φλωρίδης',         since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-paideias',     holderName: 'Σοφία Ζαχαράκη',           since: '2024-07-01' },
  { positionSlug: 'ypoyrgos-ygeias',       holderName: 'Άδωνις Γεωργιάδης',        since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-ergasias',     holderName: 'Νίκη Κεραμέως',            since: '2024-07-01' },
  { positionSlug: 'ypoyrgos-anaptyxis',    holderName: 'Τάκης Θεοδωρικάκος',       since: '2024-07-01' },
  { positionSlug: 'ypoyrgos-ypodomon',     holderName: 'Χρήστος Σταϊκούρας',       since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-perivallon',   holderName: 'Θόδωρος Σκυλακάκης',       since: '2024-07-01' },
  { positionSlug: 'ypoyrgos-politismoy',   holderName: 'Λίνα Μενδώνη',             since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-tourismoy',    holderName: 'Όλγα Κεφαλογιάννη',        since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-agrotikis',    holderName: 'Ελευθέριος Αυγενάκης',     since: '2024-07-01' },
  { positionSlug: 'ypoyrgos-naftilias',    holderName: 'Χρήστος Στυλιανίδης',      since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-psifiakis',    holderName: 'Δημήτρης Παπαστεργίου',    since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-metanastefsis',holderName: 'Δημήτρης Καιρίδης',        since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-prostasias',   holderName: 'Μιχάλης Χρυσοχοΐδης',     since: '2023-06-26' },
  { positionSlug: 'ypoyrgos-makethonias',  holderName: 'Σταύρος Καλαφάτης',        since: '2023-06-26' },
];

const seedGovernmentCurrentHolders = async () => {
  try {
    console.log('Starting government current holders seeding...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    let created = 0;
    let skipped = 0;

    for (const h of holders) {
      const position = await GovernmentPosition.findOne({ where: { slug: h.positionSlug } });
      if (!position) {
        console.warn(`  ⚠ Position not found for slug: ${h.positionSlug} — skipping`);
        skipped++;
        continue;
      }

      const [, wasCreated] = await GovernmentCurrentHolder.findOrCreate({
        where: { positionId: position.id, holderName: h.holderName },
        defaults: {
          positionId: position.id,
          holderName: h.holderName,
          holderPhoto: null,
          since: h.since,
          isActive: true,
        },
      });

      if (wasCreated) {
        console.log(`  ✓ Created: ${h.holderName} → ${h.positionSlug}`);
        created++;
      } else {
        console.log(`  - Already exists: ${h.holderName} → ${h.positionSlug}`);
        skipped++;
      }
    }

    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding government current holders:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedGovernmentCurrentHolders();
