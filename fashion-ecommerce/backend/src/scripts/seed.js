"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
const Review_1 = __importDefault(require("../models/Review"));
dotenv_1.default.config();
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stylecraft');
        console.log(' MongoDB Connected');
    }
    catch (error) {
        console.error(' MongoDB Connection Error:', error);
        process.exit(1);
    }
};
const seedUsers = async () => {
    try {
        await User_1.default.deleteMany({});
        const users = [
            {
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@fashionhub.com',
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
        await User_1.default.create(users);
        console.log(' Users seeded successfully');
    }
    catch (error) {
        console.error(' Error seeding users:', error);
    }
};
const seedProducts = async () => {
    try {
        await Product_1.default.deleteMany({});
        const products = [
            {
                name: 'Tropical Leaf Summer Shirt',
                nameAr: 'قميص صيفي بأوراق استوائية',
                description: 'Casual short-sleeved shirt with tropical leaf pattern in blue tones. Perfect for summer days.',
                descriptionAr: 'قميص كاجوال بأكمام قصيرة مع طبع أوراق استوائية بألوان زرقاء. مثالي لأيام الصيف.',
                price: 45.99,
                image: '/MenSummer/summer-shirt-main.png',
                images: ['/MenSummer/summer-shirt-2.png', '/MenSummer/summer-shirt-3.png', '/MenSummer/summer-shirt-4.png'],
                category: 'Tops',
                categoryAr: 'ترنك',
                gender: 'Men',
                genderAr: 'رجال',
                season: 'Summer',
                seasonAr: 'صيف',
                style: 'Printed',
                styleAr: 'مطبوع',
                occasion: 'Casual',
                occasionAr: 'كاجوال',
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                colors: ['White', 'Light Blue'],
                stock: 100,
                featured: true,
                active: true,
                onSale: false,
                salePercentage: 0
            },
            {
                name: 'Ribbed Texture T-Shirt',
                nameAr: 'تي شيرت بنسيج مضلع',
                description: 'Dark grey short-sleeved t-shirt with distinctive vertical ribbed texture. Comfortable and stylish for summer casual wear.',
                descriptionAr: 'تي شيرت رمادي داكن بأكمام قصيرة مع نسيج مضلع عمودي مميز. مريح وأنيق للاستخدام الكاجوال في الصيف.',
                price: 38.99,
                image: '/MenSummer/ribbed-tshirt-main.png',
                images: ['/MenSummer/ribbed-tshirt-2.png', '/MenSummer/ribbed-tshirt-3.png', '/MenSummer/ribbed-tshirt-4.png'],
                category: 'T-Shirts',
                categoryAr: 'تي شيرت',
                gender: 'Men',
                genderAr: 'رجال',
                season: 'Summer',
                seasonAr: 'صيف',
                style: 'Plain',
                styleAr: 'عادي',
                occasion: 'Casual',
                occasionAr: 'كاجوال',
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                colors: ['Dark Grey', 'Grey'],
                stock: 100,
                featured: true,
                active: true,
                onSale: false,
                salePercentage: 0
            },
            {
                name: 'Quarter-Zip Polo Shirt',
                nameAr: 'قميص بولو بسحاب ربع',
                description: 'Light beige polo shirt with quarter-zip placket, white collar and cuffs. Features waffle knit texture for comfort and breathability. Perfect for smart-casual summer wear.',
                descriptionAr: 'قميص بولو بيج فاتح مع سحاب ربع، ياقة بيضاء وأكمام بيضاء. يتميز بنسيج waffle مريح ومسامي. مثالي للاستخدام الكاجوال الذكي في الصيف.',
                price: 49.99,
                image: '/MenSummer/polo-shirt-main.png',
                images: ['/MenSummer/polo-shirt-2.png', '/MenSummer/polo-shirt-3.png', '/MenSummer/polo-shirt-4.png'],
                category: 'Polo Shirts',
                categoryAr: 'بولو',
                gender: 'Men',
                genderAr: 'رجال',
                season: 'Summer',
                seasonAr: 'صيف',
                style: 'Plain',
                styleAr: 'عادي',
                occasion: 'Casual',
                occasionAr: 'كاجوال',
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                colors: ['Beige', 'Tan', 'Light Beige'],
                stock: 100,
                featured: true,
                active: true,
                onSale: false,
                salePercentage: 0
            },
            {
                name: 'V-Neck Ribbed T-Shirt',
                nameAr: 'تي شيرت V-neck بنسيج مضلع',
                description: 'Terracotta/brick red V-neck t-shirt with vertical ribbed texture. Slim fit design with notched V-neck detail. Comfortable and stylish for summer casual wear.',
                descriptionAr: 'تي شيرت V-neck بلون terracotta/بني محمر مع نسيج مضلع عمودي. تصميم slim fit مع تفصيل V-neck منحوت. مريح وأنيق للاستخدام الكاجوال في الصيف.',
                price: 35.99,
                image: '/MenSummer/vneck-ribbed-main.png',
                images: ['/MenSummer/vneck-ribbed-2.png', '/MenSummer/vneck-ribbed-3.png', '/MenSummer/vneck-ribbed-4.png'],
                category: 'T-Shirts',
                categoryAr: 'تي شيرت',
                gender: 'Men',
                genderAr: 'رجال',
                season: 'Summer',
                seasonAr: 'صيف',
                style: 'Plain',
                styleAr: 'عادي',
                occasion: 'Casual',
                occasionAr: 'كاجوال',
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                colors: ['Terracotta', 'Brick Red', 'Burnt Orange'],
                stock: 100,
                featured: true,
                active: true,
                onSale: false,
                salePercentage: 0
            },
        ];
        await Product_1.default.create(products);
        console.log(' Products seeded successfully');
    }
    catch (error) {
        console.error(' Error seeding products:', error);
    }
};
const seedReviews = async () => {
    try {
        const customers = await User_1.default.find({ role: 'customer' }).limit(10);
        if (customers.length === 0) {
            console.log('  No customers found. Skipping reviews seeding.');
            return;
        }
        console.log(` Found ${customers.length} customers. Creating reviews...`);
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
        const reviewsToCreate = reviewsData.map((reviewData, index) => {
            const useArabic = index % 2 === 0;
            return {
                user: reviewData.user,
                rating: reviewData.rating,
                title: useArabic ? reviewData.title : reviewData.titleEn,
                comment: useArabic ? reviewData.comment : reviewData.commentEn,
                status: 'approved',
                createdAt: new Date(Date.now() - (reviewsData.length - index) * 24 * 60 * 60 * 1000),
            };
        });
        const createdReviews = await Review_1.default.insertMany(reviewsToCreate);
        console.log(` Created ${createdReviews.length} approved reviews`);
        console.log('\n Reviews Summary:');
        console.log(`   Total: ${createdReviews.length}`);
        console.log(`   5 Stars: ${createdReviews.filter(r => r.rating === 5).length}`);
        console.log(`   4 Stars: ${createdReviews.filter(r => r.rating === 4).length}`);
        console.log(`   Status: All approved`);
    }
    catch (error) {
        console.error(' Error seeding reviews:', error);
    }
};
const seedDatabase = async () => {
    await connectDB();
    console.log(' Starting database seeding...');
    console.log('');
    await seedUsers();
    await seedProducts();
    await seedReviews();
    console.log('');
    console.log(' Database seeding completed!');
    console.log('');
    console.log(' Test Credentials:');
    console.log('   Admin: admin@stylecraft.com / Admin@123');
    console.log('   Employee: employee@stylecraft.com / Employee@123');
    console.log('   Customer: john@example.com / Customer@123');
    console.log('');
    process.exit(0);
};
seedDatabase();
