const { sequelize, User, Article } = require('./models');
require('dotenv').config();

const populateDatabase = async () => {
  try {
    console.log('Starting database population...');
    
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync database models (create tables if they don't exist)
    // Using { force: false } to avoid dropping existing tables
    await sequelize.sync();
    console.log('Database models synchronized.');

    // Check if users already exist
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log(`Database already has ${existingUsers} users. Skipping user creation.`);
      console.log('If you want to reset the database, please clear it manually first.');
    } else {
      console.log('Creating user accounts...');

      // Create admin account
      // NOTE: Passwords are automatically hashed by the User model's beforeCreate hook
      // These are development/testing credentials only - NOT for production use
      const admin = await User.create({
        username: 'admin',
        email: 'admin@admin.gr',
        password: 'admin123', // Will be hashed automatically
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      });
      console.log('✓ Admin account created');

      // Create moderator account
      const moderator = await User.create({
        username: 'moderator',
        email: 'moderator@moderator.gr',
        password: 'moderator123',
        role: 'moderator',
        firstName: 'Moderator',
        lastName: 'User'
      });
      console.log('✓ Moderator account created');

      // Create editor account
      const editor = await User.create({
        username: 'editor',
        email: 'editor@editor.gr',
        password: 'editor123',
        role: 'editor',
        firstName: 'Editor',
        lastName: 'User'
      });
      console.log('✓ Editor account created');

      console.log('\nUser accounts created successfully!');
      console.log('Login credentials:');
      console.log('- Admin: admin@admin.gr / admin123');
      console.log('- Moderator: moderator@moderator.gr / moderator123');
      console.log('- Editor: editor@editor.gr / editor123');
    }

    // Check if articles already exist
    const existingArticles = await Article.count();
    if (existingArticles > 0) {
      console.log(`\nDatabase already has ${existingArticles} articles. Skipping article creation.`);
    } else {
      console.log('\nCreating dummy articles...');

      // Get the admin user to be the author
      const admin = await User.findOne({ where: { email: 'admin@admin.gr' } });
      const editor = await User.findOne({ where: { email: 'editor@editor.gr' } });
      
      if (!admin || !editor) {
        console.log('Warning: Could not find admin or editor user. Cannot create articles.');
        return;
      }

      const dummyArticles = [
        {
          title: 'Breaking: Technology Advances in AI Research',
          content: 'Artificial Intelligence continues to make groundbreaking strides in recent years. Researchers at leading universities have developed new neural network architectures that promise to revolutionize machine learning. These advancements could lead to more efficient AI systems that require less computational power while delivering superior results. The implications for industries ranging from healthcare to finance are profound, as AI becomes increasingly integrated into our daily lives.',
          summary: 'New AI research promises revolutionary advances in machine learning and efficiency.',
          category: 'Technology',
          tags: ['AI', 'Research'],
          status: 'published',
          publishedAt: new Date(),
          authorId: admin.id,
          isNews: true,
          newsApprovedAt: new Date(),
          newsApprovedBy: admin.id
        },
        {
          title: 'Global Climate Summit Reaches Historic Agreement',
          content: 'World leaders gathered at the annual Global Climate Summit have reached a historic agreement on carbon emission reductions. The comprehensive deal commits participating nations to achieve net-zero emissions by 2050, with intermediate targets set for 2030 and 2040. Environmental organizations have praised the agreement as a crucial step forward, though some critics argue that more aggressive action is needed to address the climate crisis effectively.',
          summary: 'Historic climate agreement sets ambitious targets for global carbon emission reductions.',
          category: 'Environment',
          tags: ['Climate', 'Policy'],
          status: 'published',
          publishedAt: new Date(),
          authorId: editor.id,
          isNews: true,
          newsApprovedAt: new Date(),
          newsApprovedBy: admin.id
        },
        {
          title: 'New Medical Breakthrough in Cancer Treatment',
          content: 'Medical researchers have announced a significant breakthrough in cancer treatment. A novel immunotherapy approach has shown remarkable success in clinical trials, with patients experiencing unprecedented recovery rates. The treatment works by enhancing the body\'s natural immune response to cancer cells, offering new hope to millions of patients worldwide. The therapy is expected to receive regulatory approval within the next year.',
          summary: 'Revolutionary immunotherapy shows promising results in cancer treatment trials.',
          category: 'Health',
          tags: ['Health', 'Research'],
          status: 'published',
          publishedAt: new Date(),
          authorId: admin.id,
          isNews: true,
          newsApprovedAt: new Date(),
          newsApprovedBy: admin.id
        },
        {
          title: 'Space Exploration: New Mars Mission Announced',
          content: 'The international space community is excited about the announcement of a new Mars exploration mission scheduled for the near future. The mission will deploy advanced rovers equipped with cutting-edge scientific instruments designed to search for signs of past or present microbial life. Additionally, the mission will collect samples for potential return to Earth, marking a significant milestone in our understanding of the Red Planet.',
          summary: 'Ambitious new Mars mission aims to discover signs of life and collect samples.',
          category: 'Science',
          tags: ['Space', 'Exploration'],
          status: 'published',
          publishedAt: new Date(),
          authorId: editor.id,
          isNews: false
        },
        {
          title: 'Economic Growth Surpasses Expectations in Q1',
          content: 'The global economy has demonstrated remarkable resilience, with first quarter growth figures exceeding analyst predictions. Multiple factors contributed to this positive trend, including increased consumer spending, robust business investment, and improving labor markets. Economists remain cautiously optimistic about sustained growth throughout the year, though they warn that geopolitical tensions and inflation concerns could pose challenges.',
          summary: 'Q1 economic data shows stronger than expected growth across major economies.',
          category: 'Business',
          tags: ['Economy', 'Markets'],
          status: 'published',
          publishedAt: new Date(),
          authorId: admin.id,
          isNews: false
        },
        {
          title: 'Revolutionary Electric Vehicle Battery Unveiled',
          content: 'A leading automotive technology company has unveiled a revolutionary battery technology that could transform the electric vehicle industry. The new solid-state batteries offer triple the energy density of current lithium-ion batteries, enabling electric vehicles to travel over 1,000 miles on a single charge. Furthermore, the batteries can be charged to 80% capacity in just 10 minutes, addressing two of the major barriers to widespread EV adoption.',
          summary: 'New solid-state battery technology promises to revolutionize electric vehicles.',
          category: 'Technology',
          tags: ['EV', 'Technology'],
          status: 'published',
          publishedAt: new Date(),
          authorId: editor.id,
          isNews: true,
          newsApprovedAt: new Date(),
          newsApprovedBy: admin.id
        },
        {
          title: 'Ancient Civilization Discovery Rewrites History',
          content: 'Archaeologists have made an extraordinary discovery that challenges our understanding of ancient civilizations. Excavations in a remote region have uncovered evidence of a sophisticated urban settlement dating back 5,000 years. The site features advanced architectural structures, intricate art, and a complex writing system that predates previously known examples. This finding suggests that human civilization may have reached advanced stages of development earlier than previously thought.',
          summary: 'Archaeological discovery reveals advanced ancient civilization, challenging historical timelines.',
          category: 'History',
          tags: ['Archaeology', 'History'],
          status: 'published',
          publishedAt: new Date(),
          authorId: admin.id,
          isNews: false
        },
        {
          title: 'Cybersecurity Concerns Rise with New Threats',
          content: 'Cybersecurity experts are warning about a new wave of sophisticated cyber threats targeting critical infrastructure and businesses worldwide. Recent attacks have demonstrated unprecedented levels of complexity, utilizing advanced AI algorithms to bypass traditional security measures. Organizations are being urged to upgrade their security protocols and invest in next-generation threat detection systems. Government agencies are working with private sector partners to develop comprehensive defense strategies.',
          summary: 'New sophisticated cyber threats prompt urgent calls for enhanced security measures.',
          category: 'Technology',
          tags: ['Security', 'Technology'],
          status: 'draft',
          authorId: editor.id,
          isNews: false
        },
        {
          title: 'Sustainable Agriculture Practices Gain Momentum',
          content: 'Farmers around the world are increasingly adopting sustainable agriculture practices that promise to protect the environment while maintaining productivity. These methods include precision farming techniques, crop rotation, reduced pesticide use, and water conservation strategies. Early results show that sustainable practices can actually increase yields while reducing environmental impact. Agricultural experts believe these approaches will be essential for feeding the growing global population while preserving natural resources.',
          summary: 'Sustainable farming methods show promise for environmental protection and productivity.',
          category: 'Agriculture',
          tags: ['Sustainability', 'Agriculture'],
          status: 'published',
          publishedAt: new Date(),
          authorId: admin.id,
          isNews: false
        },
        {
          title: 'Educational Technology Transforms Learning Experience',
          content: 'The education sector is experiencing a digital transformation as innovative technologies reshape how students learn. Virtual reality classrooms, AI-powered tutoring systems, and adaptive learning platforms are creating personalized educational experiences tailored to individual student needs. Research indicates that these technologies can significantly improve learning outcomes and student engagement. However, educators emphasize the importance of maintaining human interaction and ensuring equitable access to technology.',
          summary: 'Innovative educational technologies are revolutionizing the learning experience.',
          category: 'Education',
          tags: ['Education', 'Technology'],
          status: 'published',
          publishedAt: new Date(),
          authorId: editor.id,
          isNews: false
        }
      ];

      for (const articleData of dummyArticles) {
        await Article.create(articleData);
      }

      console.log(`✓ Created ${dummyArticles.length} dummy articles`);
      console.log('\nArticles created with various categories:');
      console.log('- Technology, Environment, Health, Science');
      console.log('- Business, History, Agriculture, Education');
      console.log('- Mix of published, draft, and news-approved articles');
    }

    console.log('\n✅ Database population completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Start the application: npm start');
    console.log('2. Login with any of the created accounts');
    console.log('3. View the articles on the frontend');

  } catch (error) {
    console.error('❌ Error populating database:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the population script
populateDatabase();
