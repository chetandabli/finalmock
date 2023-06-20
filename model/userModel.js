const mongoose = require("mongoose");

const schema = mongoose.Schema({
    "name": String,
    "email": String,
    "password": String,
    "friends": [mongoose.Schema.Types.Mixed],
    "groups": [mongoose.Schema.Types.Mixed]
});

const UserModel = mongoose.model("user", schema);

module.exports = {
    UserModel
}