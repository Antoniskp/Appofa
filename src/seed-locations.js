const { Location, sequelize } = require('./models');

/**
 * Seed script for hierarchical locations
 * Populates database with official location data following ISO/GeoNames standards
 */

async function seedLocations() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync();
    console.log('Database synced');
    
    // Clear existing locations (be careful in production!)
    if (process.env.NODE_ENV !== 'production') {
      await Location.destroy({ where: {}, truncate: true, cascade: true });
      console.log('Cleared existing locations');
    }
    
    // Create World/International level
    const world = await Location.create({
      name: 'World',
      type: 'international',
      slug: 'world',
      lat: 0,
      lng: 0
    });
    console.log('Created: World');
    
    // Create sample countries
    const japan = await Location.create({
      name: 'Japan',
      name_local: '日本',
      type: 'country',
      parent_id: world.id,
      code: 'JP',
      slug: 'japan',
      lat: 36.2048,
      lng: 138.2529
    });
    console.log('Created: Japan');
    
    const usa = await Location.create({
      name: 'United States',
      name_local: 'USA',
      type: 'country',
      parent_id: world.id,
      code: 'US',
      slug: 'united-states',
      lat: 37.0902,
      lng: -95.7129
    });
    console.log('Created: United States');
    
    const greece = await Location.create({
      name: 'Greece',
      name_local: 'Ελλάδα',
      type: 'country',
      parent_id: world.id,
      code: 'GR',
      slug: 'greece',
      lat: 39.0742,
      lng: 21.8243
    });
    console.log('Created: Greece');
    
    // Japan prefectures
    const tokyo = await Location.create({
      name: 'Tokyo',
      name_local: '東京都',
      type: 'prefecture',
      parent_id: japan.id,
      code: 'JP-13',
      slug: 'tokyo',
      lat: 35.6762,
      lng: 139.6503
    });
    console.log('Created: Tokyo Prefecture');
    
    const osaka = await Location.create({
      name: 'Osaka',
      name_local: '大阪府',
      type: 'prefecture',
      parent_id: japan.id,
      code: 'JP-27',
      slug: 'osaka',
      lat: 34.6937,
      lng: 135.5023
    });
    console.log('Created: Osaka Prefecture');
    
    const kyoto = await Location.create({
      name: 'Kyoto',
      name_local: '京都府',
      type: 'prefecture',
      parent_id: japan.id,
      code: 'JP-26',
      slug: 'kyoto',
      lat: 35.0116,
      lng: 135.7681
    });
    console.log('Created: Kyoto Prefecture');
    
    // Tokyo municipalities
    const shibuya = await Location.create({
      name: 'Shibuya',
      name_local: '渋谷区',
      type: 'municipality',
      parent_id: tokyo.id,
      slug: 'shibuya',
      lat: 35.6595,
      lng: 139.7004
    });
    console.log('Created: Shibuya');
    
    const shinjuku = await Location.create({
      name: 'Shinjuku',
      name_local: '新宿区',
      type: 'municipality',
      parent_id: tokyo.id,
      slug: 'shinjuku',
      lat: 35.6938,
      lng: 139.7034
    });
    console.log('Created: Shinjuku');
    
    const minato = await Location.create({
      name: 'Minato',
      name_local: '港区',
      type: 'municipality',
      parent_id: tokyo.id,
      slug: 'minato',
      lat: 35.6581,
      lng: 139.7514
    });
    console.log('Created: Minato');
    
    // US states
    const california = await Location.create({
      name: 'California',
      type: 'prefecture',
      parent_id: usa.id,
      code: 'US-CA',
      slug: 'california',
      lat: 36.7783,
      lng: -119.4179
    });
    console.log('Created: California');
    
    const newYork = await Location.create({
      name: 'New York',
      type: 'prefecture',
      parent_id: usa.id,
      code: 'US-NY',
      slug: 'new-york-state',
      lat: 42.1657,
      lng: -74.9481
    });
    console.log('Created: New York State');
    
    // California cities
    const sanFrancisco = await Location.create({
      name: 'San Francisco',
      type: 'municipality',
      parent_id: california.id,
      slug: 'san-francisco',
      lat: 37.7749,
      lng: -122.4194
    });
    console.log('Created: San Francisco');
    
    const losAngeles = await Location.create({
      name: 'Los Angeles',
      type: 'municipality',
      parent_id: california.id,
      slug: 'los-angeles',
      lat: 34.0522,
      lng: -118.2437
    });
    console.log('Created: Los Angeles');
    
    // New York cities
    const newYorkCity = await Location.create({
      name: 'New York City',
      type: 'municipality',
      parent_id: newYork.id,
      slug: 'new-york-city',
      lat: 40.7128,
      lng: -74.0060
    });
    console.log('Created: New York City');
    
    // Greece regions
    const attica = await Location.create({
      name: 'Attica',
      name_local: 'Αττική',
      type: 'prefecture',
      parent_id: greece.id,
      code: 'GR-I',
      slug: 'attica',
      lat: 38.0,
      lng: 23.7
    });
    console.log('Created: Attica');
    
    // Greece municipalities
    const athens = await Location.create({
      name: 'Athens',
      name_local: 'Αθήνα',
      type: 'municipality',
      parent_id: attica.id,
      slug: 'athens',
      lat: 37.9838,
      lng: 23.7275
    });
    console.log('Created: Athens');
    
    console.log('\n✅ Location seeding completed successfully!');
    console.log(`Total locations created: ${await Location.count()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding locations:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedLocations();
}

module.exports = seedLocations;
