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

    // Create all 13 prefectures (regions) of Greece
    const prefectures = [
      { name: 'Attica', name_local: 'Αττική', code: 'AT', lat: 38.0, lng: 23.7 },
      { name: 'Central Macedonia', name_local: 'Κεντρική Μακεδονία', code: 'CM', lat: 40.6, lng: 22.9 },
      { name: 'Crete', name_local: 'Κρήτη', code: 'CR', lat: 35.2, lng: 24.9 },
      { name: 'Thessaly', name_local: 'Θεσσαλία', code: 'TH', lat: 39.6, lng: 22.4 },
      { name: 'Peloponnese', name_local: 'Πελοπόννησος', code: 'PE', lat: 37.5, lng: 22.4 },
      { name: 'Ionian Islands', name_local: 'Ιόνια Νησιά', code: 'II', lat: 38.7, lng: 20.6 },
      { name: 'Western Greece', name_local: 'Δυτική Ελλάδα', code: 'WG', lat: 38.4, lng: 21.4 },
      { name: 'Eastern Macedonia and Thrace', name_local: 'Ανατολική Μακεδονία και Θράκη', code: 'EM', lat: 41.1, lng: 24.9 },
      { name: 'Western Macedonia', name_local: 'Δυτική Μακεδονία', code: 'WM', lat: 40.3, lng: 21.8 },
      { name: 'Epirus', name_local: 'Ήπειρος', code: 'EP', lat: 39.6, lng: 20.8 },
      { name: 'Central Greece', name_local: 'Στερεά Ελλάδα', code: 'CG', lat: 38.5, lng: 22.8 },
      { name: 'North Aegean', name_local: 'Βόρειο Αιγαίο', code: 'NA', lat: 39.5, lng: 25.5 },
      { name: 'South Aegean', name_local: 'Νότιο Αιγαίο', code: 'SA', lat: 37.0, lng: 25.3 }
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

    // Create municipalities in Attica (16 total)
    const atticaMunicipalities = [
      { name: 'Athens', name_local: 'Αθήνα', lat: 37.9838, lng: 23.7275 },
      { name: 'Piraeus', name_local: 'Πειραιάς', lat: 37.9421, lng: 23.6463 },
      { name: 'Kallithea', name_local: 'Καλλιθέα', lat: 37.9545, lng: 23.7010 },
      { name: 'Glyfada', name_local: 'Γλυφάδα', lat: 37.8632, lng: 23.7534 },
      { name: 'Marousi', name_local: 'Μαρούσι', lat: 38.0467, lng: 23.8064 },
      { name: 'Nea Smyrni', name_local: 'Νέα Σμύρνη', lat: 37.9450, lng: 23.7142 },
      { name: 'Chalandri', name_local: 'Χαλάνδρι', lat: 38.0213, lng: 23.7986 },
      { name: 'Kifisia', name_local: 'Κηφισιά', lat: 38.0760, lng: 23.8159 },
      { name: 'Peristeri', name_local: 'Περιστέρι', lat: 38.0154, lng: 23.6919 },
      { name: 'Nikaia', name_local: 'Νίκαια', lat: 37.9667, lng: 23.6500 },
      { name: 'Aegaleo', name_local: 'Αιγάλεω', lat: 37.9833, lng: 23.6833 },
      { name: 'Keratsini', name_local: 'Κερατσίνι', lat: 37.9625, lng: 23.6197 },
      { name: 'Agia Paraskevi', name_local: 'Αγία Παρασκευή', lat: 38.0167, lng: 23.8333 },
      { name: 'Agios Dimitrios', name_local: 'Άγιος Δημήτριος', lat: 37.9333, lng: 23.7333 },
      { name: 'Voula', name_local: 'Βούλα', lat: 37.8422, lng: 23.7765 },
      { name: 'Vouliagmeni', name_local: 'Βουλιαγμένη', lat: 37.8142, lng: 23.7789 }
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

    // Create municipalities in Central Macedonia (9 total)
    const centralMacedoniaMunicipalities = [
      { name: 'Thessaloniki', name_local: 'Θεσσαλονίκη', lat: 40.6401, lng: 22.9444 },
      { name: 'Katerini', name_local: 'Κατερίνη', lat: 40.2708, lng: 22.5092 },
      { name: 'Serres', name_local: 'Σέρρες', lat: 41.0856, lng: 23.5475 },
      { name: 'Veria', name_local: 'Βέροια', lat: 40.5244, lng: 22.2024 },
      { name: 'Kilkis', name_local: 'Κιλκίς', lat: 40.9930, lng: 22.8743 },
      { name: 'Naousa', name_local: 'Νάουσα', lat: 40.6294, lng: 22.0681 },
      { name: 'Giannitsa', name_local: 'Γιαννιτσά', lat: 40.7919, lng: 22.4075 },
      { name: 'Edessa', name_local: 'Έδεσσα', lat: 40.8026, lng: 22.0475 },
      { name: 'Polygyros', name_local: 'Πολύγυρος', lat: 40.3770, lng: 23.4414 }
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

    // Create municipalities in Crete (7 total)
    const creteMunicipalities = [
      { name: 'Heraklion', name_local: 'Ηράκλειο', lat: 35.3387, lng: 25.1442 },
      { name: 'Chania', name_local: 'Χανιά', lat: 35.5138, lng: 24.0180 },
      { name: 'Rethymno', name_local: 'Ρέθυμνο', lat: 35.3669, lng: 24.4824 },
      { name: 'Agios Nikolaos', name_local: 'Άγιος Νικόλαος', lat: 35.1911, lng: 25.7152 },
      { name: 'Ierapetra', name_local: 'Ιεράπετρα', lat: 35.0119, lng: 25.7423 },
      { name: 'Sitia', name_local: 'Σητεία', lat: 35.2078, lng: 26.1047 },
      { name: 'Kissamos', name_local: 'Κίσσαμος', lat: 35.4946, lng: 23.6538 }
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

    // Create municipalities in Thessaly (7 total)
    const thessalyMunicipalities = [
      { name: 'Larissa', name_local: 'Λάρισα', lat: 39.6369, lng: 22.4176 },
      { name: 'Volos', name_local: 'Βόλος', lat: 39.3610, lng: 22.9425 },
      { name: 'Trikala', name_local: 'Τρίκαλα', lat: 39.5549, lng: 21.7684 },
      { name: 'Karditsa', name_local: 'Καρδίτσα', lat: 39.3649, lng: 21.9219 },
      { name: 'Tyrnavos', name_local: 'Τύρναβος', lat: 39.7378, lng: 22.2892 },
      { name: 'Skiathos', name_local: 'Σκιάθος', lat: 39.1670, lng: 23.4830 },
      { name: 'Skopelos', name_local: 'Σκόπελος', lat: 39.1404, lng: 23.7068 }
    ];

    for (const munData of thessalyMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Thessaly'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Thessaly'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Thessaly`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Thessaly`);
      }
    }

    // Create municipalities in Peloponnese (9 total)
    const peloponneseMunicipalities = [
      { name: 'Patras', name_local: 'Πάτρα', lat: 38.2466, lng: 21.7346 },
      { name: 'Kalamata', name_local: 'Καλαμάτα', lat: 37.0391, lng: 22.1127 },
      { name: 'Tripoli', name_local: 'Τρίπολη', lat: 37.5089, lng: 22.3794 },
      { name: 'Corinth', name_local: 'Κόρινθος', lat: 37.9409, lng: 22.9449 },
      { name: 'Argos', name_local: 'Άργος', lat: 37.6333, lng: 22.7333 },
      { name: 'Sparta', name_local: 'Σπάρτη', lat: 37.0745, lng: 22.4301 },
      { name: 'Nafplio', name_local: 'Ναύπλιο', lat: 37.5686, lng: 22.8069 },
      { name: 'Pylos', name_local: 'Πύλος', lat: 36.9139, lng: 21.6964 },
      { name: 'Megalopoli', name_local: 'Μεγαλόπολη', lat: 37.4011, lng: 22.1422 }
    ];

    for (const munData of peloponneseMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Peloponnese'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Peloponnese'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Peloponnese`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Peloponnese`);
      }
    }

    // Create ALL Ionian Islands municipalities (7 islands)
    const ionianIslandsMunicipalities = [
      { name: 'Corfu', name_local: 'Κέρκυρα', lat: 39.6243, lng: 19.9217 },
      { name: 'Zakynthos', name_local: 'Ζάκυνθος', lat: 37.7873, lng: 20.9006 },
      { name: 'Kefalonia', name_local: 'Κεφαλονιά', lat: 38.1751, lng: 20.5695 },
      { name: 'Lefkada', name_local: 'Λευκάδα', lat: 38.8334, lng: 20.7069 },
      { name: 'Ithaca', name_local: 'Ιθάκη', lat: 38.3667, lng: 20.7167 },
      { name: 'Paxoi', name_local: 'Παξοί', lat: 39.2000, lng: 20.1667 },
      { name: 'Kythira', name_local: 'Κύθηρα', lat: 36.1530, lng: 23.0018 }
    ];

    for (const munData of ionianIslandsMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Ionian Islands'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Ionian Islands'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Ionian Islands`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Ionian Islands`);
      }
    }

    // Create municipalities in Western Greece (5 total)
    const westernGreeceMunicipalities = [
      { name: 'Agrinio', name_local: 'Αγρίνιο', lat: 38.6214, lng: 21.4078 },
      { name: 'Messolonghi', name_local: 'Μεσολόγγι', lat: 38.3714, lng: 21.4315 },
      { name: 'Pyrgos', name_local: 'Πύργος', lat: 37.6751, lng: 21.4410 },
      { name: 'Amaliada', name_local: 'Αμαλιάδα', lat: 37.7984, lng: 21.3507 },
      { name: 'Nafpaktos', name_local: 'Ναύπακτος', lat: 38.3917, lng: 21.8275 }
    ];

    for (const munData of westernGreeceMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Western Greece'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Western Greece'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Western Greece`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Western Greece`);
      }
    }

    // Create municipalities in Eastern Macedonia and Thrace (6 total)
    const easternMacedoniaMunicipalities = [
      { name: 'Alexandroupoli', name_local: 'Αλεξανδρούπολη', lat: 40.8457, lng: 25.8779 },
      { name: 'Komotini', name_local: 'Κομοτηνή', lat: 41.1224, lng: 25.4066 },
      { name: 'Xanthi', name_local: 'Ξάνθη', lat: 41.1349, lng: 24.8880 },
      { name: 'Kavala', name_local: 'Καβάλα', lat: 40.9396, lng: 24.4069 },
      { name: 'Drama', name_local: 'Δράμα', lat: 41.1500, lng: 24.1467 },
      { name: 'Didymoteicho', name_local: 'Διδυμότειχο', lat: 41.3500, lng: 26.5000 }
    ];

    for (const munData of easternMacedoniaMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Eastern Macedonia and Thrace'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Eastern Macedonia and Thrace'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Eastern Macedonia and Thrace`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Eastern Macedonia and Thrace`);
      }
    }

    // Create municipalities in Western Macedonia (5 total)
    const westernMacedoniaMunicipalities = [
      { name: 'Kozani', name_local: 'Κοζάνη', lat: 40.3007, lng: 21.7890 },
      { name: 'Kastoria', name_local: 'Καστοριά', lat: 40.5217, lng: 21.2634 },
      { name: 'Florina', name_local: 'Φλώρινα', lat: 40.7820, lng: 21.4098 },
      { name: 'Grevena', name_local: 'Γρεβενά', lat: 40.0850, lng: 21.4275 },
      { name: 'Ptolemaida', name_local: 'Πτολεμαΐδα', lat: 40.5170, lng: 21.6830 }
    ];

    for (const munData of westernMacedoniaMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Western Macedonia'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Western Macedonia'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Western Macedonia`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Western Macedonia`);
      }
    }

    // Create municipalities in Epirus (5 total)
    const epirusMunicipalities = [
      { name: 'Ioannina', name_local: 'Ιωάννινα', lat: 39.6650, lng: 20.8528 },
      { name: 'Arta', name_local: 'Άρτα', lat: 39.1601, lng: 20.9856 },
      { name: 'Preveza', name_local: 'Πρέβεζα', lat: 38.9575, lng: 20.7517 },
      { name: 'Igoumenitsa', name_local: 'Ηγουμενίτσα', lat: 39.5045, lng: 20.2639 },
      { name: 'Parga', name_local: 'Πάργα', lat: 39.2857, lng: 20.4004 }
    ];

    for (const munData of epirusMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Epirus'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Epirus'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Epirus`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Epirus`);
      }
    }

    // Create municipalities in Central Greece (5 total)
    const centralGreeceMunicipalities = [
      { name: 'Lamia', name_local: 'Λαμία', lat: 38.9000, lng: 22.4330 },
      { name: 'Chalcis', name_local: 'Χαλκίδα', lat: 38.4625, lng: 23.5950 },
      { name: 'Livadeia', name_local: 'Λιβαδειά', lat: 38.4362, lng: 22.8767 },
      { name: 'Thebes', name_local: 'Θήβα', lat: 38.3250, lng: 23.3189 },
      { name: 'Amfissa', name_local: 'Άμφισσα', lat: 38.5281, lng: 22.3771 }
    ];

    for (const munData of centralGreeceMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['Central Greece'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['Central Greece'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in Central Greece`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in Central Greece`);
      }
    }

    // Create municipalities in North Aegean (5 total)
    const northAegeanMunicipalities = [
      { name: 'Mytilene', name_local: 'Μυτιλήνη', lat: 39.1077, lng: 26.5553 },
      { name: 'Chios', name_local: 'Χίος', lat: 38.3678, lng: 26.1358 },
      { name: 'Samos', name_local: 'Σάμος', lat: 37.7543, lng: 26.9770 },
      { name: 'Lemnos', name_local: 'Λήμνος', lat: 39.9167, lng: 25.2500 },
      { name: 'Ikaria', name_local: 'Ικαρία', lat: 37.5833, lng: 26.1667 }
    ];

    for (const munData of northAegeanMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['North Aegean'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['North Aegean'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in North Aegean`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in North Aegean`);
      }
    }

    // Create municipalities in South Aegean (8 total)
    const southAegeanMunicipalities = [
      { name: 'Rhodes', name_local: 'Ρόδος', lat: 36.4400, lng: 28.2200 },
      { name: 'Kos', name_local: 'Κως', lat: 36.8933, lng: 27.2889 },
      { name: 'Mykonos', name_local: 'Μύκονος', lat: 37.4453, lng: 25.3287 },
      { name: 'Santorini', name_local: 'Σαντορίνη', lat: 36.4150, lng: 25.4325 },
      { name: 'Naxos', name_local: 'Νάξος', lat: 37.1056, lng: 25.3764 },
      { name: 'Paros', name_local: 'Πάρος', lat: 37.0833, lng: 25.1500 },
      { name: 'Syros', name_local: 'Σύρος', lat: 37.4500, lng: 24.9000 },
      { name: 'Karpathos', name_local: 'Κάρπαθος', lat: 35.5833, lng: 27.1333 }
    ];

    for (const munData of southAegeanMunicipalities) {
      let municipality = await Location.findOne({ 
        where: { name: munData.name, type: 'municipality', parent_id: createdPrefectures['South Aegean'].id } 
      });
      
      if (!municipality) {
        await Location.create({
          ...munData,
          type: 'municipality',
          parent_id: createdPrefectures['South Aegean'].id,
          slug: `municipality-${munData.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        console.log(`  ✓ Municipality ${munData.name} created in South Aegean`);
      } else {
        console.log(`  ✓ Municipality ${munData.name} already exists in South Aegean`);
      }
    }

    console.log('\n✓ Location seeding completed successfully!');
    console.log('\n========================================');
    console.log('COMPREHENSIVE GREEK LOCATION DATA');
    console.log('========================================');
    console.log('- Greece (country)');
    console.log('\n13 PREFECTURES (All regions of Greece):');
    console.log('  1. Attica (16 municipalities)');
    console.log('  2. Central Macedonia (9 municipalities)');
    console.log('  3. Crete (7 municipalities)');
    console.log('  4. Thessaly (7 municipalities)');
    console.log('  5. Peloponnese (9 municipalities)');
    console.log('  6. Ionian Islands (7 municipalities - ALL 7 islands included!)');
    console.log('  7. Western Greece (5 municipalities)');
    console.log('  8. Eastern Macedonia and Thrace (6 municipalities)');
    console.log('  9. Western Macedonia (5 municipalities)');
    console.log('  10. Epirus (5 municipalities)');
    console.log('  11. Central Greece (5 municipalities)');
    console.log('  12. North Aegean (5 municipalities)');
    console.log('  13. South Aegean (8 municipalities)');
    console.log('\nTOTAL: 94 municipalities across all Greek regions');
    console.log('\nIonian Islands (ALL 7):');
    console.log('  ✓ Corfu (Κέρκυρα)');
    console.log('  ✓ Zakynthos (Ζάκυνθος)');
    console.log('  ✓ Kefalonia (Κεφαλονιά)');
    console.log('  ✓ Lefkada (Λευκάδα)');
    console.log('  ✓ Ithaca (Ιθάκη)');
    console.log('  ✓ Paxoi (Παξοί)');
    console.log('  ✓ Kythira (Κύθηρα)');
    console.log('========================================\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding locations:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedLocations();
