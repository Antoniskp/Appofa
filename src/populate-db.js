const { sequelize, User, Article, Poll, PollOption, Location, LocationLink } = require('./models');
require('dotenv').config();

const isCodespaceEnv = () => {
  return process.env.CODESPACES === 'true' || Boolean(process.env.CODESPACE_NAME);
};

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

    if (isCodespaceEnv()) {
      console.log('\nCodespace demo seed: creating polls and news with images...');

      const admin = await User.findOne({ where: { email: 'admin@admin.gr' } });
      if (!admin) {
        console.log('Warning: Could not find admin user. Skipping codespace demo seed.');
      } else {
        const athens = await Location.findOne({ where: { slug: 'municipality-athens' } });
        const thessaloniki = await Location.findOne({ where: { slug: 'municipality-thessaloniki' } });

        const pollSeeds = [
          {
            title: 'Best weekend getaway near the coast?',
            description: 'Vote for the destination that feels most relaxing this season.',
            type: 'complex',
            allowUserContributions: false,
            allowUnauthenticatedVotes: true,
            visibility: 'public',
            resultsVisibility: 'always',
            status: 'active',
            locationId: athens ? athens.id : null,
            options: [
              {
                text: 'Santorini',
                displayText: 'Santorini',
                answerType: 'custom',
                photoUrl: 'https://picsum.photos/seed/santorini/640/420',
                linkUrl: 'https://en.wikipedia.org/wiki/Santorini'
              },
              {
                text: 'Naxos',
                displayText: 'Naxos',
                answerType: 'custom',
                photoUrl: 'https://picsum.photos/seed/naxos/640/420',
                linkUrl: 'https://en.wikipedia.org/wiki/Naxos'
              },
              {
                text: 'Paros',
                displayText: 'Paros',
                answerType: 'custom',
                photoUrl: 'https://picsum.photos/seed/paros/640/420',
                linkUrl: 'https://en.wikipedia.org/wiki/Paros'
              }
            ]
          },
          {
            title: 'Favorite local food spot this week?',
            description: 'Pick the place you want to visit next.',
            type: 'simple',
            allowUserContributions: true,
            allowUnauthenticatedVotes: true,
            visibility: 'public',
            resultsVisibility: 'always',
            status: 'active',
            locationId: thessaloniki ? thessaloniki.id : null,
            options: [
              { text: 'Harbor Grill' },
              { text: 'Market Street Bites' },
              { text: 'Sunrise Bakery' },
              { text: 'Olive & Thyme' }
            ]
          }
        ];

        let createdPollCount = 0;
        for (const pollSeed of pollSeeds) {
          const existingPoll = await Poll.findOne({ where: { title: pollSeed.title } });
          if (existingPoll) {
            continue;
          }

          const createdPoll = await Poll.create({
            title: pollSeed.title,
            description: pollSeed.description,
            type: pollSeed.type,
            allowUserContributions: pollSeed.allowUserContributions,
            allowUnauthenticatedVotes: pollSeed.allowUnauthenticatedVotes,
            visibility: pollSeed.visibility,
            resultsVisibility: pollSeed.resultsVisibility,
            deadline: null,
            locationId: pollSeed.locationId,
            creatorId: admin.id,
            status: pollSeed.status
          });

          const optionRecords = pollSeed.options.map((option, index) => ({
            pollId: createdPoll.id,
            text: option.text || null,
            photoUrl: option.photoUrl || null,
            linkUrl: option.linkUrl || null,
            displayText: option.displayText || null,
            answerType: option.answerType || null,
            order: index
          }));

          await PollOption.bulkCreate(optionRecords);

          if (pollSeed.locationId) {
            await LocationLink.create({
              location_id: pollSeed.locationId,
              entity_type: 'poll',
              entity_id: createdPoll.id
            });
          }

          createdPollCount += 1;
        }

        const newsSeeds = [
          {
            title: 'City transit upgrades roll out this month',
            summary: 'New stations and faster routes bring shorter commute times.',
            category: 'City',
            bannerImageUrl: 'https://picsum.photos/seed/transit/1200/630',
            content: `The city has announced a phased rollout of new transit upgrades. Riders can expect expanded service hours, station accessibility improvements, and a more frequent schedule on key routes. Officials say the project will continue through the next quarter with weekly community feedback sessions.

The transit authority will begin with three high-volume corridors and expand service as additional vehicles enter the fleet. A digital dashboard is also launching to provide real-time arrival updates and crowding estimates.

Video: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
          },
          {
            title: 'Community beach cleanup sets new record',
            summary: 'Volunteers collected over two tons of waste in a single day.',
            category: 'Community',
            bannerImageUrl: 'https://picsum.photos/seed/cleanup/1200/630',
            content: `Hundreds of volunteers gathered for the annual beach cleanup and removed record amounts of waste. Organizers reported strong turnout from schools, local businesses, and neighborhood groups. The effort highlighted ongoing initiatives to protect coastal ecosystems.

Marine biologists are now analyzing the collected materials to better target future prevention programs and improve recycling operations.

Video: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4`
          },
          {
            title: 'Local markets extend weekend hours',
            summary: 'Fresh produce and artisan goods now available later in the day.',
            category: 'Lifestyle',
            bannerImageUrl: 'https://picsum.photos/seed/market/1200/630',
            content: `Popular local markets are extending their weekend hours to meet growing demand. Vendors say the new schedule helps families shop after morning activities and gives small businesses more exposure. The expanded hours begin this Saturday.

Market managers also announced a rotating showcase for small producers and community food workshops focused on seasonal cooking.

Video: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4`
          },
          {
            title: 'Innovation hub opens to support climate startups',
            summary: 'A new incubator will fund early-stage climate and energy ventures.',
            category: 'Business',
            bannerImageUrl: 'https://picsum.photos/seed/innovation/1200/630',
            content: `A new innovation hub opened today to support startups working on climate resilience and clean energy. The program will provide seed funding, lab access, and mentorship from a network of researchers, investors, and industry partners.

Leaders say the hub aims to accelerate projects in energy storage, water management, and circular economy solutions. The first cohort will be announced next month.

Video: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4`
          },
          {
            title: 'Regional health system launches telehealth expansion',
            summary: 'New virtual care clinics aim to shorten appointment wait times.',
            category: 'Health',
            bannerImageUrl: 'https://picsum.photos/seed/telehealth/1200/630',
            content: `The regional health system has launched a telehealth expansion focused on primary care, mental health, and chronic condition management. Patients can now schedule same-week virtual visits and access care teams across multiple specialties.

The initiative includes new digital intake tools and multilingual support to improve access for rural and underserved communities.

Video: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4`
          }
        ];

        let createdNewsCount = 0;
        for (const newsSeed of newsSeeds) {
          const existingNews = await Article.findOne({ where: { title: newsSeed.title } });
          if (existingNews) {
            continue;
          }

          await Article.create({
            title: newsSeed.title,
            content: newsSeed.content,
            summary: newsSeed.summary,
            category: newsSeed.category,
            status: 'published',
            publishedAt: new Date(),
            authorId: admin.id,
            isNews: true,
            type: 'news',
            newsApprovedAt: new Date(),
            newsApprovedBy: admin.id,
            bannerImageUrl: newsSeed.bannerImageUrl
          });

          createdNewsCount += 1;
        }

        console.log(`✓ Created ${createdPollCount} demo polls`);
        console.log(`✓ Created ${createdNewsCount} demo news items`);

        const articleSeeds = [
          {
            title: 'How neighborhoods are redesigning public spaces',
            summary: 'Local planners focus on walkability, shade, and shared community use.',
            category: 'Urban Design',
            bannerImageUrl: 'https://picsum.photos/seed/public-space/1200/630',
            content: `City neighborhoods are rethinking public spaces to favor walking, cycling, and shared community use. Pop-up plazas and flexible street designs are reducing traffic speeds while creating more room for seating, greenery, and events.

Urban designers point to a growing body of research linking shade trees and safe crossings to improved health outcomes and stronger local economies.

Video: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4`
          },
          {
            title: 'A practical guide to building a news reading habit',
            summary: 'Small changes make it easier to stay informed without feeling overwhelmed.',
            category: 'Media',
            bannerImageUrl: 'https://picsum.photos/seed/reading/1200/630',
            content: `Readers often struggle to stay informed because the volume of news is overwhelming. Editors recommend a simple routine: choose two trusted sources, set a fixed time window, and focus on summaries before diving into long-form pieces.

Curating a small list of topics also helps prevent notification fatigue and keeps attention on issues that matter most to you.

Video: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`
          },
          {
            title: 'Why local food systems are gaining momentum',
            summary: 'Regional supply chains reduce waste and improve freshness.',
            category: 'Food',
            bannerImageUrl: 'https://picsum.photos/seed/local-food/1200/630',
            content: `Local food systems are growing quickly as communities look for fresher produce and more resilient supply chains. Shorter transport routes reduce spoilage and give farmers a more predictable market for seasonal crops.

Community-supported agriculture programs are also expanding, helping families plan meals while backing local farms.

Video: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4`
          },
          {
            title: 'The rise of evening learning programs',
            summary: 'Flexible classes help working adults upskill at their own pace.',
            category: 'Education',
            bannerImageUrl: 'https://picsum.photos/seed/evening-classes/1200/630',
            content: `Evening learning programs are expanding to support working adults who want to build new skills. Libraries, universities, and community colleges are offering modular courses with flexible schedules and hybrid options.

Program leaders say completion rates are rising when courses include guided study groups and short weekly projects.

Video: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4`
          }
        ];

        let createdArticleCount = 0;
        for (const articleSeed of articleSeeds) {
          const existingArticle = await Article.findOne({ where: { title: articleSeed.title } });
          if (existingArticle) {
            continue;
          }

          await Article.create({
            title: articleSeed.title,
            content: articleSeed.content,
            summary: articleSeed.summary,
            category: articleSeed.category,
            status: 'published',
            publishedAt: new Date(),
            authorId: admin.id,
            isNews: false,
            type: 'articles',
            bannerImageUrl: articleSeed.bannerImageUrl
          });

          createdArticleCount += 1;
        }

        console.log(`✓ Created ${createdArticleCount} demo articles`);
      }
    } else {
      console.log('\nSkipping codespace-only demo seed.');
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
