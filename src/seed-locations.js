const { sequelize, Location } = require('./models');
require('dotenv').config();

const seedLocations = async () => {
  try {
    console.log('Starting location seeding...');
    
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if locations already exist
    const existingLocations = await Location.count();
    if (existingLocations > 0) {
      console.log(`Database already has ${existingLocations} locations. Adding more without deleting existing ones.`);
    }

    // Create Greece as a country
    let greece = await Location.findOne({ where: { name: 'Greece', type: 'country' } });
    if (!greece) {
      greece = await Location.create({
        name: 'Greece',
        name_local: 'Ελλάδα',
        type: 'country',
        code: 'GR',
        slug: 'country-greece',
        lat: 39.0742,
        lng: 21.8243
      });
      console.log('✓ Greece (country) created');
    } else {
      console.log('✓ Greece (country) already exists');
    }

    // Create some prefectures (regions) of Greece
    const prefectures = [
      { name: 'Attica', name_local: 'Αττική', code: 'AT', lat: 38.0, lng: 23.7 },
      { name: 'Central Macedonia', name_local: 'Κεντρική Μακεδονία', code: 'CM', lat: 40.6, lng: 22.9 },
      { name: 'Crete', name_local: 'Κρήτη', code: 'CR', lat: 35.2, lng: 24.9 },
      { name: 'Thessaly', name_local: 'Θεσσαλία', code: 'TH', lat: 39.6, lng: 22.4 },
      { name: 'Peloponnese', name_local: 'Πελοπόννησος', code: 'PE', lat: 37.5, lng: 22.4 }
    ];

    const createdPrefectures = {};
    for (const prefData of prefectures) {
      let prefecture = await Location.findOne({ 
        where: { name: prefData.name, type: 'prefecture', parent_id: greece.id } 
      });
      
      if (!prefecture) {
        prefecture = await Location.create({
          ...prefData,
          type: 'prefecture',
          parent_id: greece.id,
          slug: `prefecture-${prefData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`✓ Prefecture ${prefData.name} created`);
      } else {
        console.log(`✓ Prefecture ${prefData.name} already exists`);
      }
      
      createdPrefectures[prefData.name] = prefecture;
    }

    // Create some municipalities in Attica
    const atticaMunicipalities = [
      { name: 'Athens', name_local: 'Αθήνα', lat: 37.9838, lng: 23.7275 },
      { name: 'Piraeus', name_local: 'Πειραιάς', lat: 37.9421, lng: 23.6463 },
      { name: 'Kallithea', name_local: 'Καλλιθέα', lat: 37.9545, lng: 23.7010 },
      { name: 'Glyfada', name_local: 'Γλυφάδα', lat: 37.8632, lng: 23.7534 }
    ];

    for (const munData of atticaMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Attica'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Attica'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Attica`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Attica`);
      }
    }

    // Create some municipalities in Central Macedonia
    const centralMacedoniaMunicipalities = [
      { name: 'Thessaloniki', name_local: 'Θεσσαλονίκη', lat: 40.6401, lng: 22.9444 },
      { name: 'Katerini', name_local: 'Κατερίνη', lat: 40.2708, lng: 22.5092 },
      { name: 'Serres', name_local: 'Σέρρες', lat: 41.0856, lng: 23.5475 }
    ];

    for (const munData of centralMacedoniaMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Central Macedonia'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Central Macedonia'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Central Macedonia`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Central Macedonia`);
      }
    }

    // Create some municipalities in Crete
    const creteMunicipalities = [
      { name: 'Heraklion', name_local: 'Ηράκλειο', lat: 35.3387, lng: 25.1442 },
      { name: 'Chania', name_local: 'Χανιά', lat: 35.5138, lng: 24.0180 },
      { name: 'Rethymno', name_local: 'Ρέθυμνο', lat: 35.3669, lng: 24.4824 }
    ];

    for (const munData of creteMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Crete'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Crete'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Crete`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Crete`);
      }
    }

    console.log('\n✓ Location seeding completed successfully!');
    console.log('\nCreated structure:');
    console.log('- Greece (country)');
    console.log('  - Attica (prefecture)');
    console.log('    - Athens, Piraeus, Kallithea, Glyfada (municipalities)');
    console.log('  - Central Macedonia (prefecture)');
    console.log('    - Thessaloniki, Katerini, Serres (municipalities)');
    console.log('  - Crete (prefecture)');
    console.log('    - Heraklion, Chania, Rethymno (municipalities)');
    console.log('  - Thessaly, Peloponnese (prefectures)');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding locations:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedLocations();
