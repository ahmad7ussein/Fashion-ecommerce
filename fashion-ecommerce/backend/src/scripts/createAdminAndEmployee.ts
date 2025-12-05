import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

// Load env vars
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stylecraft';

async function createAdminAndEmployee() {
  try {
    console.log('🌐 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin credentials
    const adminData = {
      firstName: 'Admin',
      lastName: 'StyleCraft',
      email: 'admin@stylecraft.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+1 (555) 000-0001',
    };

    // Employee credentials
    const employeeData = {
      firstName: 'Employee',
      lastName: 'StyleCraft',
      email: 'employee@stylecraft.com',
      password: 'Employee@123',
      role: 'employee',
      phone: '+1 (555) 000-0002',
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
    } else {
      const admin = await User.create(adminData);
      console.log('✅ Admin created successfully!');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
      console.log('👤 ID:', admin._id);
    }

    console.log('');

    // Check if employee already exists
    const existingEmployee = await User.findOne({ email: employeeData.email });
    if (existingEmployee) {
      console.log('⚠️  Employee already exists');
      console.log('📧 Email:', employeeData.email);
      console.log('🔑 Password:', employeeData.password);
    } else {
      const employee = await User.create(employeeData);
      console.log('✅ Employee created successfully!');
      console.log('📧 Email:', employeeData.email);
      console.log('🔑 Password:', employeeData.password);
      console.log('👤 ID:', employee._id);
    }

    console.log('');
    console.log('🎉 ========================================');
    console.log('🎉 Admin and Employee accounts ready!');
    console.log('🎉 ========================================');
    console.log('');
    console.log('📝 Admin Login:');
    console.log('   Email: admin@stylecraft.com');
    console.log('   Password: Admin@123');
    console.log('');
    console.log('📝 Employee Login:');
    console.log('   Email: employee@stylecraft.com');
    console.log('   Password: Employee@123');
    console.log('');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminAndEmployee();

