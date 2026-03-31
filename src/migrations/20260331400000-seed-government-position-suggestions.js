'use strict';

// Initial AI suggestions seeded from platform config
const INITIAL_SUGGESTIONS = {
  'proedros-dimokratias': [
    { name: 'Κωνσταντίνος Τασούλας', reason: 'Έμπειρος νομικός και πολιτικός' },
    { name: 'Γιώργος Παπανδρέου', reason: 'Πρώην Πρωθυπουργός' },
  ],
  'proedros-voulis': [
    { name: 'Νίκος Βούτσης', reason: 'Πρώην Πρόεδρος Βουλής' },
    { name: 'Ζωή Κωνσταντοπούλου', reason: 'Πρώην Πρόεδρος Βουλής' },
  ],
  'prothypoyrgos': [
    { name: 'Αλέξης Τσίπρας', reason: 'Πρώην Πρωθυπουργός' },
    { name: 'Νίκος Ανδρουλάκης', reason: 'Αρχηγός ΠΑΣΟΚ' },
    { name: 'Στέφανος Κασσελάκης', reason: 'Πρώην Αρχηγός ΣΥΡΙΖΑ' },
  ],
  'ypoyrgos-oikonomikon': [
    { name: 'Γιάννης Στουρνάρας', reason: 'Διοικητής Τράπεζας Ελλάδος' },
    { name: 'Ευκλείδης Τσακαλώτος', reason: 'Πρώην Υπουργός Οικονομικών' },
    { name: 'Γιώργος Χουλιαράκης', reason: 'Πρώην Αναπληρωτής Υπουργός' },
  ],
  'ypoyrgos-esoterikon': [
    { name: 'Νίκος Βούτσης', reason: 'Πρώην Υπουργός Εσωτερικών' },
    { name: 'Τάκης Θεοδωρικάκος', reason: 'Έμπειρος στην τοπική αυτοδιοίκηση' },
    { name: 'Παναγιώτης Κουρουμπλής', reason: 'Πρώην Υπουργός Εσωτερικών' },
  ],
  'ypoyrgos-eksoterikon': [
    { name: 'Νίκος Δένδιας', reason: 'Πρώην Υπουργός Εξωτερικών' },
    { name: 'Γιώργος Κατρούγκαλος', reason: 'Πρώην Υπουργός Εξωτερικών' },
    { name: 'Δόρα Μπακογιάννη', reason: 'Πρώην Υπουργός Εξωτερικών' },
  ],
  'ypoyrgos-amynas': [
    { name: 'Γιώργος Γεραπετρίτης', reason: 'Πρώην Υπουργός Εξωτερικών' },
    { name: 'Πάνος Καμμένος', reason: 'Πρώην Υπουργός Άμυνας' },
    { name: 'Αποστόλης Τζιτζικώστας', reason: 'Περιφερειάρχης Κεντρικής Μακεδονίας' },
  ],
  'ypoyrgos-dikaiosynis': [
    { name: 'Σταύρος Κοντονής', reason: 'Πρώην Υπουργός Δικαιοσύνης' },
    { name: 'Μιχάλης Καλογήρου', reason: 'Πρώην αντιπρόεδρος Αρείου Πάγου' },
  ],
  'ypoyrgos-paideias': [
    { name: 'Κωνσταντίνος Γαβρόγλου', reason: 'Πρώην Υπουργός Παιδείας' },
    { name: 'Νίκη Κεραμέως', reason: 'Πρώην Υπουργός Παιδείας' },
  ],
  'ypoyrgos-ygeias': [
    { name: 'Βασίλης Κικίλιας', reason: 'Πρώην Υπουργός Υγείας' },
    { name: 'Ανδρέας Ξανθός', reason: 'Πρώην Υπουργός Υγείας' },
  ],
  'ypoyrgos-ergasias': [
    { name: 'Γιάννης Βρούτσης', reason: 'Πρώην Υπουργός Εργασίας' },
    { name: 'Έφη Αχτσιόγλου', reason: 'Πρώην Υπουργός Εργασίας' },
  ],
  'ypoyrgos-anaptyxis': [
    { name: 'Άδωνις Γεωργιάδης', reason: 'Πρώην Υπουργός Ανάπτυξης' },
    { name: 'Κώστας Σκρέκας', reason: 'Έμπειρος στην ενεργειακή πολιτική' },
  ],
  'ypoyrgos-ypodomon': [
    { name: 'Γιώργος Σπίρτζης', reason: 'Πρώην Υπουργός Υποδομών' },
    { name: 'Κώστας Καραμανλής', reason: 'Πρώην Υπουργός Υποδομών' },
  ],
  'ypoyrgos-perivallon': [
    { name: 'Κώστας Σκρέκας', reason: 'Πρώην Υπουργός Περιβάλλοντος' },
    { name: 'Γιώργος Σταθάκης', reason: 'Πρώην Υπουργός Περιβάλλοντος' },
  ],
  'ypoyrgos-politismoy': [
    { name: 'Αριστείδης Μπαλτάς', reason: 'Πρώην Υπουργός Πολιτισμού' },
    { name: 'Μυρσίνη Ζορμπά', reason: 'Πρώην Υπουργός Πολιτισμού' },
  ],
  'ypoyrgos-tourismoy': [
    { name: 'Ελένα Κουντουρά', reason: 'Πρώην Υπουργός Τουρισμού' },
    { name: 'Χάρης Θεοχάρης', reason: 'Πρώην Υπουργός Τουρισμού' },
  ],
  'ypoyrgos-agrotikis': [
    { name: 'Σταύρος Αραχωβίτης', reason: 'Πρώην Υπουργός Αγροτικής Ανάπτυξης' },
    { name: 'Μάκης Βορίδης', reason: 'Πρώην Υπουργός Αγροτικής Ανάπτυξης' },
  ],
  'ypoyrgos-naftilias': [
    { name: 'Παναγιώτης Κουρουμπλής', reason: 'Πρώην Υπουργός Ναυτιλίας' },
    { name: 'Γιώργος Πλακιωτάκης', reason: 'Πρώην Υπουργός Ναυτιλίας' },
  ],
  'ypoyrgos-psifiakis': [
    { name: 'Κυριάκος Πιερρακάκης', reason: 'Πρώην Υπουργός Ψηφιακής Διακυβέρνησης' },
    { name: 'Νίκος Παππάς', reason: 'Πρώην Υπουργός Ψηφιακής Πολιτικής' },
  ],
  'ypoyrgos-metanastefsis': [
    { name: 'Νότης Μηταράκης', reason: 'Πρώην Υπουργός Μετανάστευσης' },
    { name: 'Γιώργος Κουμουτσάκος', reason: 'Πρώην Υπουργός Μετανάστευσης' },
  ],
  'ypoyrgos-prostasias': [
    { name: 'Νίκος Τόσκας', reason: 'Πρώην Υπουργός Προστασίας του Πολίτη' },
    { name: 'Όλγα Γεροβασίλη', reason: 'Πρώην Υπουργός Προστασίας του Πολίτη' },
  ],
  'ypoyrgos-makethonias': [
    { name: 'Θεοδώρα Τζάκρη', reason: 'Πρώην Υπουργός Μακεδονίας-Θράκης' },
    { name: 'Χρήστος Παππάς', reason: 'Πρώην Αναπληρωτής Υπουργός' },
  ],
};

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    for (const [slug, suggestions] of Object.entries(INITIAL_SUGGESTIONS)) {
      const [position] = await queryInterface.sequelize.query(
        `SELECT id FROM "GovernmentPositions" WHERE slug = :slug LIMIT 1`,
        { replacements: { slug }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!position) continue;

      for (let i = 0; i < suggestions.length; i++) {
        const s = suggestions[i];
        await queryInterface.sequelize.query(
          `INSERT INTO "GovernmentPositionSuggestions"
             ("positionId", "name", "reason", "order", "isActive", "createdAt", "updatedAt")
           VALUES (:positionId, :name, :reason, :order, true, :createdAt, :updatedAt)
           ON CONFLICT DO NOTHING`,
          {
            replacements: {
              positionId: position.id,
              name: s.name,
              reason: s.reason || null,
              order: i,
              createdAt: now,
              updatedAt: now,
            },
            type: queryInterface.sequelize.QueryTypes.INSERT,
          }
        );
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('GovernmentPositionSuggestions', null, {});
  },
};
