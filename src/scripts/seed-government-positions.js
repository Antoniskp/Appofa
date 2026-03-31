const { sequelize, GovernmentPosition } = require('../models');
require('dotenv').config();

const seedGovernmentPositions = async () => {
  try {
    console.log('Starting government positions seeding...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    const positions = [
      { slug: 'proedros-dimokratias', title: 'Πρόεδρος της Δημοκρατίας', titleEn: 'President of the Republic', category: 'president', description: null, order: 1, isActive: true },
      { slug: 'proedros-voulis', title: 'Πρόεδρος της Βουλής', titleEn: 'Speaker of Parliament', category: 'minister', description: null, order: 2, isActive: true },
      { slug: 'prothypoyrgos', title: 'Πρωθυπουργός', titleEn: 'Prime Minister', category: 'prime_minister', description: null, order: 3, isActive: true },
      { slug: 'ypoyrgos-oikonomikon', title: 'Υπουργός Οικονομικών', titleEn: 'Minister of Finance', category: 'minister', description: null, order: 4, isActive: true },
      { slug: 'ypoyrgos-esoterikon', title: 'Υπουργός Εσωτερικών', titleEn: 'Minister of Interior', category: 'minister', description: null, order: 5, isActive: true },
      { slug: 'ypoyrgos-eksoterikon', title: 'Υπουργός Εξωτερικών', titleEn: 'Minister of Foreign Affairs', category: 'minister', description: null, order: 6, isActive: true },
      { slug: 'ypoyrgos-amynas', title: 'Υπουργός Εθνικής Άμυνας', titleEn: 'Minister of National Defence', category: 'minister', description: null, order: 7, isActive: true },
      { slug: 'ypoyrgos-dikaiosynis', title: 'Υπουργός Δικαιοσύνης', titleEn: 'Minister of Justice', category: 'minister', description: null, order: 8, isActive: true },
      { slug: 'ypoyrgos-paideias', title: 'Υπουργός Παιδείας και Θρησκευμάτων', titleEn: 'Minister of Education and Religious Affairs', category: 'minister', description: null, order: 9, isActive: true },
      { slug: 'ypoyrgos-ygeias', title: 'Υπουργός Υγείας', titleEn: 'Minister of Health', category: 'minister', description: null, order: 10, isActive: true },
      { slug: 'ypoyrgos-ergasias', title: 'Υπουργός Εργασίας και Κοινωνικής Ασφάλισης', titleEn: 'Minister of Labour and Social Insurance', category: 'minister', description: null, order: 11, isActive: true },
      { slug: 'ypoyrgos-anaptyxis', title: 'Υπουργός Ανάπτυξης', titleEn: 'Minister of Development', category: 'minister', description: null, order: 12, isActive: true },
      { slug: 'ypoyrgos-ypodomon', title: 'Υπουργός Υποδομών και Μεταφορών', titleEn: 'Minister of Infrastructure and Transport', category: 'minister', description: null, order: 13, isActive: true },
      { slug: 'ypoyrgos-perivallon', title: 'Υπουργός Περιβάλλοντος και Ενέργειας', titleEn: 'Minister of Environment and Energy', category: 'minister', description: null, order: 14, isActive: true },
      { slug: 'ypoyrgos-politismoy', title: 'Υπουργός Πολιτισμού', titleEn: 'Minister of Culture', category: 'minister', description: null, order: 15, isActive: true },
      { slug: 'ypoyrgos-tourismoy', title: 'Υπουργός Τουρισμού', titleEn: 'Minister of Tourism', category: 'minister', description: null, order: 16, isActive: true },
      { slug: 'ypoyrgos-agrotikis', title: 'Υπουργός Αγροτικής Ανάπτυξης και Τροφίμων', titleEn: 'Minister of Rural Development and Food', category: 'minister', description: null, order: 17, isActive: true },
      { slug: 'ypoyrgos-naftilias', title: 'Υπουργός Ναυτιλίας και Νησιωτικής Πολιτικής', titleEn: 'Minister of Shipping and Island Policy', category: 'minister', description: null, order: 18, isActive: true },
      { slug: 'ypoyrgos-psifiakis', title: 'Υπουργός Ψηφιακής Διακυβέρνησης', titleEn: 'Minister of Digital Governance', category: 'minister', description: null, order: 19, isActive: true },
      { slug: 'ypoyrgos-metanastefsis', title: 'Υπουργός Μετανάστευσης και Ασύλου', titleEn: 'Minister of Migration and Asylum', category: 'minister', description: null, order: 20, isActive: true },
      { slug: 'ypoyrgos-prostasias', title: 'Υπουργός Προστασίας του Πολίτη', titleEn: 'Minister of Citizen Protection', category: 'minister', description: null, order: 21, isActive: true },
      { slug: 'ypoyrgos-makethonias', title: 'Υπουργός Μακεδονίας και Θράκης', titleEn: 'Minister of Macedonia and Thrace', category: 'minister', description: null, order: 22, isActive: true },
    ];

    let created = 0;
    let skipped = 0;
    for (const pos of positions) {
      const [, wasCreated] = await GovernmentPosition.findOrCreate({
        where: { slug: pos.slug },
        defaults: pos,
      });
      if (wasCreated) {
        console.log(`✓ Created: ${pos.title}`);
        created++;
      } else {
        console.log(`- Already exists: ${pos.title}`);
        skipped++;
      }
    }

    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding government positions:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedGovernmentPositions();
