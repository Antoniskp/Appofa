'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const positions = [
      { slug: 'proedros-dimokratias', title: 'Πρόεδρος της Δημοκρατίας', titleEn: 'President of the Republic', category: 'president', description: null, order: 1, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'prothypoyrgos', title: 'Πρωθυπουργός', titleEn: 'Prime Minister', category: 'prime_minister', description: null, order: 2, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-oikonomikon', title: 'Υπουργός Οικονομικών', titleEn: 'Minister of Finance', category: 'minister', description: null, order: 3, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-esoterikon', title: 'Υπουργός Εσωτερικών', titleEn: 'Minister of Interior', category: 'minister', description: null, order: 4, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-eksoterikon', title: 'Υπουργός Εξωτερικών', titleEn: 'Minister of Foreign Affairs', category: 'minister', description: null, order: 5, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-amynas', title: 'Υπουργός Εθνικής Άμυνας', titleEn: 'Minister of National Defence', category: 'minister', description: null, order: 6, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-dikaiosynis', title: 'Υπουργός Δικαιοσύνης', titleEn: 'Minister of Justice', category: 'minister', description: null, order: 7, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-paideias', title: 'Υπουργός Παιδείας και Θρησκευμάτων', titleEn: 'Minister of Education and Religious Affairs', category: 'minister', description: null, order: 8, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-ygeias', title: 'Υπουργός Υγείας', titleEn: 'Minister of Health', category: 'minister', description: null, order: 9, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-ergasias', title: 'Υπουργός Εργασίας και Κοινωνικής Ασφάλισης', titleEn: 'Minister of Labour and Social Insurance', category: 'minister', description: null, order: 10, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-anaptyxis', title: 'Υπουργός Ανάπτυξης', titleEn: 'Minister of Development', category: 'minister', description: null, order: 11, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-ypodomon', title: 'Υπουργός Υποδομών και Μεταφορών', titleEn: 'Minister of Infrastructure and Transport', category: 'minister', description: null, order: 12, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-perivallon', title: 'Υπουργός Περιβάλλοντος και Ενέργειας', titleEn: 'Minister of Environment and Energy', category: 'minister', description: null, order: 13, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-politismoy', title: 'Υπουργός Πολιτισμού', titleEn: 'Minister of Culture', category: 'minister', description: null, order: 14, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-tourismoy', title: 'Υπουργός Τουρισμού', titleEn: 'Minister of Tourism', category: 'minister', description: null, order: 15, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-agrotikis', title: 'Υπουργός Αγροτικής Ανάπτυξης και Τροφίμων', titleEn: 'Minister of Rural Development and Food', category: 'minister', description: null, order: 16, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-naftilias', title: 'Υπουργός Ναυτιλίας και Νησιωτικής Πολιτικής', titleEn: 'Minister of Shipping and Island Policy', category: 'minister', description: null, order: 17, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-psifiakis', title: 'Υπουργός Ψηφιακής Διακυβέρνησης', titleEn: 'Minister of Digital Governance', category: 'minister', description: null, order: 18, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-metanastefsis', title: 'Υπουργός Μετανάστευσης και Ασύλου', titleEn: 'Minister of Migration and Asylum', category: 'minister', description: null, order: 19, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-prostasias', title: 'Υπουργός Προστασίας του Πολίτη', titleEn: 'Minister of Citizen Protection', category: 'minister', description: null, order: 20, isActive: true, createdAt: now, updatedAt: now },
      { slug: 'ypoyrgos-makethonias', title: 'Υπουργός Μακεδονίας και Θράκης', titleEn: 'Minister of Macedonia and Thrace', category: 'minister', description: null, order: 21, isActive: true, createdAt: now, updatedAt: now },
    ];

    for (const pos of positions) {
      await queryInterface.sequelize.query(
        `INSERT INTO "GovernmentPositions" (slug, title, "titleEn", category, description, "order", "isActive", "createdAt", "updatedAt")
         VALUES (:slug, :title, :titleEn, :category, :description, :order, :isActive, :createdAt, :updatedAt)
         ON CONFLICT (slug) DO NOTHING`,
        { replacements: pos, type: queryInterface.sequelize.QueryTypes.INSERT }
      );
    }
  },

  async down(queryInterface) {
    const slugs = [
      'proedros-dimokratias',
      'prothypoyrgos',
      'ypoyrgos-oikonomikon',
      'ypoyrgos-esoterikon',
      'ypoyrgos-eksoterikon',
      'ypoyrgos-amynas',
      'ypoyrgos-dikaiosynis',
      'ypoyrgos-paideias',
      'ypoyrgos-ygeias',
      'ypoyrgos-ergasias',
      'ypoyrgos-anaptyxis',
      'ypoyrgos-ypodomon',
      'ypoyrgos-perivallon',
      'ypoyrgos-politismoy',
      'ypoyrgos-tourismoy',
      'ypoyrgos-agrotikis',
      'ypoyrgos-naftilias',
      'ypoyrgos-psifiakis',
      'ypoyrgos-metanastefsis',
      'ypoyrgos-prostasias',
      'ypoyrgos-makethonias',
    ];
    await queryInterface.bulkDelete('GovernmentPositions', {
      slug: slugs,
    });
  },
};
