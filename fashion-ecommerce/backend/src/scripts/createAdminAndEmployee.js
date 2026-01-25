"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stylecraft';
async function createAdminAndEmployee() {
    try {
        console.log(' Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log(' Connected to MongoDB');
        const adminData = {
            firstName: 'Admin',
            lastName: 'StyleCraft',
            email: 'admin@fashionhub.com',
            password: 'Admin@123',
            role: 'admin',
            phone: '+1 (555) 000-0001',
        };
        const employeeData = {
            firstName: 'Employee',
            lastName: 'StyleCraft',
            email: 'employee@stylecraft.com',
            password: 'Employee@123',
            role: 'employee',
            phone: '+1 (555) 000-0002',
        };
        const existingAdmin = await User_1.default.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('  Admin already exists');
            console.log(' Email:', adminData.email);
            console.log(' Password:', adminData.password);
        }
        else {
            const admin = await User_1.default.create(adminData);
            console.log(' Admin created successfully!');
            console.log(' Email:', adminData.email);
            console.log(' Password:', adminData.password);
            console.log(' ID:', admin._id);
        }
        console.log('');
        const existingEmployee = await User_1.default.findOne({ email: employeeData.email });
        if (existingEmployee) {
            console.log(' Employee already exists');
            console.log('Email:', employeeData.email);
            console.log(' Password:', employeeData.password);
        }
        else {
            const employee = await User_1.default.create(employeeData);
            console.log(' Employee created successfully!');
            console.log(' Email:', employeeData.email);
            console.log(' Password:', employeeData.password);
            console.log(' ID:', employee._id);
        }
        console.log('');
        console.log(' ========================================');
        console.log(' Admin and Employee accounts ready!');
        console.log(' ========================================');
        console.log('');
        console.log(' Admin Login:');
        console.log('   Email: admin@fashionhub.com');
        console.log('   Password: Admin@123');
        console.log('');
        console.log(' Employee Login:');
        console.log('   Email: employee@stylecraft.com');
        console.log('   Password: Employee@123');
        console.log('');
        await mongoose_1.default.disconnect();
        console.log(' Disconnected from MongoDB');
        process.exit(0);
    }
    catch (error) {
        console.error(' Error:', error.message);
        process.exit(1);
    }
}
createAdminAndEmployee();
