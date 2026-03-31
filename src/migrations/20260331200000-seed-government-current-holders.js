'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

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

    for (const h of holders) {
      const [position] = await queryInterface.sequelize.query(
        `SELECT id FROM "GovernmentPositions" WHERE slug = :slug LIMIT 1`,
        { replacements: { slug: h.positionSlug }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!position) {
        console.warn(`Position not found for slug: ${h.positionSlug} — skipping`);
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO "GovernmentCurrentHolders"
           ("positionId", "personId", "holderName", "holderPhoto", "since", "notes", "isActive", "createdAt", "updatedAt")
         VALUES
           (:positionId, NULL, :holderName, NULL, :since, NULL, true, :createdAt, :updatedAt)
         ON CONFLICT DO NOTHING`,
        {
          replacements: {
            positionId: position.id,
            holderName: h.holderName,
            since: h.since,
            createdAt: now,
            updatedAt: now,
          },
          type: queryInterface.sequelize.QueryTypes.INSERT,
        }
      );
    }
  },

  async down(queryInterface) {
    const slugs = [
      'proedros-dimokratias', 'proedros-voulis', 'prothypoyrgos',
      'ypoyrgos-oikonomikon', 'ypoyrgos-esoterikon', 'ypoyrgos-eksoterikon',
      'ypoyrgos-amynas', 'ypoyrgos-dikaiosynis', 'ypoyrgos-paideias',
      'ypoyrgos-ygeias', 'ypoyrgos-ergasias', 'ypoyrgos-anaptyxis',
      'ypoyrgos-ypodomon', 'ypoyrgos-perivallon', 'ypoyrgos-politismoy',
      'ypoyrgos-tourismoy', 'ypoyrgos-agrotikis', 'ypoyrgos-naftilias',
      'ypoyrgos-psifiakis', 'ypoyrgos-metanastefsis', 'ypoyrgos-prostasias',
      'ypoyrgos-makethonias',
    ];

    await queryInterface.sequelize.query(
      `DELETE FROM "GovernmentCurrentHolders"
       WHERE "positionId" IN (
         SELECT id FROM "GovernmentPositions" WHERE slug IN (:slugs)
       )`,
      { replacements: { slugs }, type: queryInterface.sequelize.QueryTypes.DELETE }
    );
  },
};
