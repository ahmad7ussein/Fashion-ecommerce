import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review';
import User from '../models/User';

// Load env vars
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stylecraft';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedReviews = async () => {
  try {
    // Get some customers from database
    const customers = await User.find({ role: 'customer' }).limit(10);
    
    if (customers.length === 0) {
      console.log('⚠️  No customers found. Please create customers first.');
      return;
    }

    console.log(`📝 Found ${customers.length} customers. Creating reviews...`);

    // Sample reviews in Arabic and English
    const reviewsData = [
      {
        user: customers[0]._id,
        rating: 5,
        title: 'تجربة رائعة!',
        titleEn: 'Amazing Experience!',
        comment: 'المنتجات عالية الجودة والتوصيل سريع جداً. أنصح الجميع بالتسوق من هنا.',
        commentEn: 'High quality products and very fast delivery. I recommend everyone to shop here.',
      },
      {
        user: customers[Math.min(1, customers.length - 1)]?._id || customers[0]._id,
        rating: 5,
        title: 'أفضل متجر أونلاين',
        titleEn: 'Best Online Store',
        comment: 'خدمة عملاء ممتازة ومنتجات أصلية. الأسعار مناسبة والجودة ممتازة.',
        commentEn: 'Excellent customer service and authentic products. Prices are reasonable and quality is excellent.',
      },
      {
        user: customers[Math.min(2, customers.length - 1)]?._id || customers[0]._id,
        rating: 5,
        title: 'راضٍ تماماً',
        titleEn: 'Completely Satisfied',
        comment: 'اشتريت عدة منتجات وكلها كانت كما هو موضح في الموقع. التصميم جميل والقماش مريح.',
        commentEn: 'I bought several products and they were all as described on the site. Beautiful design and comfortable fabric.',
      },
      {
        user: customers[Math.min(3, customers.length - 1)]?._id || customers[0]._id,
        rating: 4,
        title: 'جودة ممتازة',
        titleEn: 'Excellent Quality',
        comment: 'المنتجات جيدة جداً والتوصيل كان في الوقت المحدد. أنصح بالتسوق من هنا.',
        commentEn: 'Products are very good and delivery was on time. I recommend shopping here.',
      },
      {
        user: customers[Math.min(4, customers.length - 1)]?._id || customers[0]._id,
        rating: 5,
        title: 'متجر موثوق',
        titleEn: 'Trusted Store',
        comment: 'تعاملت مع المتجر عدة مرات وكل مرة كانت تجربة ممتازة. الجودة والخدمة في أعلى مستوى.',
        commentEn: 'I have dealt with the store several times and each time was an excellent experience. Quality and service are at the highest level.',
      },
      {
        user: customers[Math.min(5, customers.length - 1)]?._id || customers[0]._id,
        rating: 5,
        title: 'أنصح به بشدة',
        titleEn: 'Highly Recommended',
        comment: 'منتجات أصلية وجودة عالية. التوصيل سريع والتغليف احترافي. شكراً لكم.',
        commentEn: 'Authentic products and high quality. Fast delivery and professional packaging. Thank you.',
      },
      {
        user: customers[Math.min(6, customers.length - 1)]?._id || customers[0]._id,
        rating: 4,
        title: 'تجربة جيدة',
        titleEn: 'Good Experience',
        comment: 'المنتجات جيدة والخدمة ممتازة. الأسعار مناسبة والجودة مقبولة.',
        commentEn: 'Products are good and service is excellent. Prices are reasonable and quality is acceptable.',
      },
      {
        user: customers[Math.min(7, customers.length - 1)]?._id || customers[0]._id,
        rating: 5,
        title: 'أفضل من توقعاتي',
        titleEn: 'Better Than Expected',
        comment: 'لم أتوقع أن تكون الجودة بهذا المستوى. المنتجات أفضل مما رأيته في الصور. شكراً جزيلاً.',
        commentEn: 'I did not expect the quality to be at this level. Products are better than what I saw in the pictures. Thank you very much.',
      },
    ];

    // Delete existing approved reviews (optional - comment out if you want to keep them)
    // await Review.deleteMany({ status: 'approved' });
    // console.log('🗑️  Deleted existing approved reviews');

    // Create reviews
    const reviewsToCreate = reviewsData.map((reviewData, index) => {
      // Alternate between Arabic and English for variety
      const useArabic = index % 2 === 0;
      
      return {
        user: reviewData.user,
        rating: reviewData.rating,
        title: useArabic ? reviewData.title : reviewData.titleEn,
        comment: useArabic ? reviewData.comment : reviewData.commentEn,
        status: 'approved' as const,
        createdAt: new Date(Date.now() - (reviewsData.length - index) * 24 * 60 * 60 * 1000), // Spread over days
      };
    });

    const createdReviews = await Review.insertMany(reviewsToCreate);
    console.log(`✅ Created ${createdReviews.length} approved reviews`);
    
    // Display summary
    console.log('\n📊 Reviews Summary:');
    console.log(`   Total: ${createdReviews.length}`);
    console.log(`   5 Stars: ${createdReviews.filter(r => r.rating === 5).length}`);
    console.log(`   4 Stars: ${createdReviews.filter(r => r.rating === 4).length}`);
    console.log(`   Status: All approved`);
    
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
  }
};

const seedDatabase = async () => {
  await connectDB();
  
  console.log('🌱 Starting reviews seeding...');
  console.log('');
  
  await seedReviews();
  
  console.log('');
  console.log('✅ Reviews seeding completed!');
  console.log('');
  
  process.exit(0);
};

seedDatabase();

