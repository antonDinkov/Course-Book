const mongoose = require('mongoose');
require('../models/User');
require('../models/Data');//TODO import real data model


async function configDatabase() {
    //TODO set database name
    const connectionsString = 'mongodb://localhost:27017/course-book-db';

    await mongoose.connect(connectionsString, {});

    console.log('Database connected');
};

module.exports = { configDatabase };