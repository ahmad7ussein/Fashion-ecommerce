import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import Review from '../models/Review';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stylecraft');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    await User.deleteMany({});

    const users = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@stylecraft.com',
        password: 'Admin@123',
        role: 'admin',
      },
      {
        firstName: 'Employee',
        lastName: 'User',
        email: 'employee@stylecraft.com',
        password: 'Employee@123',
        role: 'employee',
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Customer@123',
        role: 'customer',
      },
    ];

    await User.create(users);
    console.log('✅ Users seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};

const seedProducts = async () => {
  try {
    await Product.deleteMany({});

    const products = [
      { name: 'Classic White Tee', price: 29.99, image: '/white-t-shirt.png', category: 'T-Shirts', gender: 'Men', season: 'Summer', style: 'Plain', occasion: 'Casual', stock: 100 },
      { name: 'Premium Black Tee', price: 32.99, image: '/black-t-shirt-premium.jpg', category: 'T-Shirts', gender: 'Men', season: 'Summer', style: 'Plain', occasion: 'Casual', stock: 100 },
      { name: 'V-Neck White Tee', price: 28.99, image: '/white-t-shirt.png', category: 'T-Shirts', gender: 'Men', season: 'Summer', style: 'Plain', occasion: 'Casual', stock: 100 },
      { name: 'Graphic T-Shirt', price: 34.99, image: '/graphic-t-shirt.png', category: 'T-Shirts', gender: 'Men', season: 'Summer', style: 'Graphic', occasion: 'Casual', stock: 100 },
      { name: 'Navy Pocket T-Shirt', price: 31.99, image: '/navy-pocket-t-shirt.jpg', category: 'T-Shirts', gender: 'Men', season: 'Summer', style: 'Plain', occasion: 'Casual', stock: 100 },
      { name: 'Gray Pullover Hoodie', price: 59.99, image: '/gray-pullover-hoodie.png', category: 'Hoodies', gender: 'Men', season: 'Winter', style: 'Plain', occasion: 'Casual', stock: 80 },
      { name: 'Black Hoodie', price: 64.99, image: '/black-hoodie.png', category: 'Hoodies', gender: 'Men', season: 'Winter', style: 'Plain', occasion: 'Streetwear', stock: 80 },
      { name: 'Oversized Hoodie', price: 69.99, image: '/oversized-hoodie.png', category: 'Hoodies', gender: 'Unisex', season: 'Winter', style: 'Plain', occasion: 'Casual', stock: 70 },
      { name: 'Cropped Hoodie', price: 54.99, image: '/cropped-hoodie.png', category: 'Hoodies', gender: 'Women', season: 'Fall', style: 'Plain', occasion: 'Casual', stock: 60 },
      { name: 'Gray Sweatshirt', price: 49.99, image: '/gray-sweatshirt.png', category: 'Sweatshirts', gender: 'Men', season: 'Winter', style: 'Plain', occasion: 'Casual', stock: 90 },
      { name: 'Crewneck Sweatshirt', price: 52.99, image: '/crewneck-sweatshirt.jpg', category: 'Sweatshirts', gender: 'Unisex', season: 'Fall', style: 'Plain', occasion: 'Casual', stock: 85 },
      { name: 'Embroidered Sweatshirt', price: 57.99, image: '/embroidered-sweatshirt.jpg', category: 'Sweatshirts', gender: 'Women', season: 'Winter', style: 'Embroidered', occasion: 'Casual', stock: 75 },
      { name: 'Oversized Sweatshirt', price: 54.99, image: '/oversized-sweatshirt.jpg', category: 'Sweatshirts', gender: 'Unisex', season: 'Fall', style: 'Plain', occasion: 'Casual', stock: 80 },
      { name: 'Cargo Pants', price: 69.99, image: '/cargo-pants.png', category: 'Pants', gender: 'Men', season: 'All Season', style: 'Plain', occasion: 'Casual', stock: 70 },
      { name: 'Chino Pants', price: 64.99, image: '/chino-pants.png', category: 'Pants', gender: 'Men', season: 'All Season', style: 'Plain', occasion: 'Formal', stock: 75 },
      { name: 'Jogger Pants', price: 54.99, image: '/jogger-pants.png', category: 'Pants', gender: 'Unisex', season: 'All Season', style: 'Plain', occasion: 'Sport', stock: 80 },
      { name: 'Athletic Shorts', price: 34.99, image: '/athletic-shorts.png', category: 'Shorts', gender: 'Men', season: 'Summer', style: 'Plain', occasion: 'Sport', stock: 90 },
      { name: 'Cargo Shorts', price: 44.99, image: '/cargo-shorts.png', category: 'Shorts', gender: 'Men', season: 'Summer', style: 'Plain', occasion: 'Casual', stock: 85 },
      { name: 'Denim Shorts', price: 39.99, image: '/denim-shorts.png', category: 'Shorts', gender: 'Unisex', season: 'Summer', style: 'Plain', occasion: 'Casual', stock: 80 },
      { name: 'Classic Leather Jacket', price: 199.99, image: '/classic-leather-jacket.png', category: 'Jackets', gender: 'Men', season: 'Winter', style: 'Plain', occasion: 'Classic', stock: 40 },
      { name: 'Denim Jacket', price: 89.99, image: '/classic-denim-jacket.png', category: 'Jackets', gender: 'Unisex', season: 'Fall', style: 'Plain', occasion: 'Casual', stock: 50 },
      { name: 'Bomber Jacket', price: 129.99, image: '/bomber-jacket.png', category: 'Jackets', gender: 'Men', season: 'Fall', style: 'Plain', occasion: 'Casual', stock: 45 },
      { name: 'Tank Top', price: 24.99, image: '/tank-top.png', category: 'Tank Tops', gender: 'Men', season: 'Summer', style: 'Plain', occasion: 'Sport', stock: 100 },
      { name: 'Racerback Tank', price: 26.99, image: '/racerback-tank.jpg', category: 'Tank Tops', gender: 'Women', season: 'Summer', style: 'Plain', occasion: 'Sport', stock: 95 },
      { name: 'Muscle Tank', price: 27.99, image: '/muscle-tank-top.jpg', category: 'Tank Tops', gender: 'Men', season: 'Summer', style: 'Plain', occasion: 'Sport', stock: 90 },
      { name: 'Performance Polo', price: 44.99, image: '/performance-polo.jpg', category: 'Polo Shirts', gender: 'Men', season: 'Summer', style: 'Plain', occasion: 'Sport', stock: 70 },
      { name: 'Raglan Baseball Tee', price: 32.99, image: '/raglan-baseball-tee.jpg', category: 'T-Shirts', gender: 'Unisex', season: 'Spring', style: 'Plain', occasion: 'Casual', stock: 85 },
      { name: 'Henley Shirt', price: 36.99, image: '/henley-shirt.png', category: 'T-Shirts', gender: 'Men', season: 'Fall', style: 'Plain', occasion: 'Casual', stock: 80 },
    ];

    await Product.create(products);
    console.log('✅ Products seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
};

const seedReviews = async () => {
  try {
    // Get some customers from database
    const customers = await User.find({ role: 'customer' }).limit(10);
    
    if (customers.length === 0) {
      console.log('⚠️  No customers found. Skipping reviews seeding.');
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

    // Create reviews (alternate between Arabic and English)
    const reviewsToCreate = reviewsData.map((reviewData, index) => {
      const useArabic = index % 2 === 0;
      
      return {
        user: reviewData.user,
        rating: reviewData.rating,
        title: useArabic ? reviewData.title : reviewData.titleEn,
        comment: useArabic ? reviewData.comment : reviewData.commentEn,
        status: 'approved' as const,
        createdAt: new Date(Date.now() - (reviewsData.length - index) * 24 * 60 * 60 * 1000),
      };
    });

    const createdReviews = await Review.insertMany(reviewsToCreate);
    console.log(`✅ Created ${createdReviews.length} approved reviews`);
    
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
  
  console.log('🌱 Starting database seeding...');
  console.log('');
  
  await seedUsers();
  await seedProducts();
  await seedReviews();
  
  console.log('');
  console.log('✅ Database seeding completed!');
  console.log('');
  console.log('📝 Test Credentials:');
  console.log('   Admin: admin@stylecraft.com / Admin@123');
  console.log('   Employee: employee@stylecraft.com / Employee@123');
  console.log('   Customer: john@example.com / Customer@123');
  console.log('');
  
  process.exit(0);
};

seedDatabase();

