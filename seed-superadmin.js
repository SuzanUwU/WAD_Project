const mongoose = require('mongoose');
const express = require("express");
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

// Specify the path to the environment variablef file 'config.env'
dotenv.config({ path: './config.env' });

async function seedSuperAdmin() {
    try {
        // Connect to your Atlas DB
        //wait mongoose.connect(process.env.MONGODB_URI);
        await mongoose.connect(process.env.DB);
            console.log("MongoDB connected successfully");
        console.log('✅ Connected to MongoDB');
        
        // Check if Super Admin exists
        const existing = await User.findOne({ userId: 'A000' });
        if (existing) {
            console.log('❌ Super Admin A000 already exists!');
            return;
        }
        
        // Create Super Admin
        const hashedPassword = await bcrypt.hash('superpassw', 10);
        const superAdmin = new User({
            userId: 'A000',
            username: 'Super Admin',
            email: 'super.2026@admin.smu.edu.sg',
            password: hashedPassword,
            role: 'superadmin'
        });
        
        await superAdmin.save();
        console.log('🎉 SUPER ADMIN CREATED!');
        console.log('👤 ID: A000');
        console.log('📧 Email: super.2026@admin.smu.edu.sg');
        console.log('🔑 Password: superpassw');
        
    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        mongoose.connection.close();
    }
}

seedSuperAdmin();
