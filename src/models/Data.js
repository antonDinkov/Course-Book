const { Schema, model, Types } = require('mongoose');

//TODO replace with data model from exam description

const dataSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    certificate: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true,
        validate: {
            validator: (v) => /^https?:\/\//.test(v),
            message: 'Image URL must start with http:// or https://'
        }
    },
    signUpList: {
        type: [/* Types.ObjectId */],
        ref: 'User',
    },
    owner: {
        type: Types.ObjectId,
        ref: 'User'
    }
});

const Data = model('Data', dataSchema);

module.exports = { Data };
