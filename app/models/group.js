// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
// define the schema for our group model
var groupSchema = mongoose.Schema({

    name: String,
    creatorId: ObjectId, 
    messages: [{
        messageOwnerId: ObjectId,
        messageOwnerName: String,
        message: String,
        time: Date
    }],
    created_at: Date,
    updated_at: Date

});

// groupSchema.methods.addMessage = function(ownerId, ownerName, message, cb) {
//     this.
// };

module.exports = mongoose.model('Group', groupSchema);
