var mongoose = require('mongoose');

var TenantSchema = new mongoose.Schema({
    name: String,
    apartmentNumber: Number,
    rentPaid: Boolean
});

mongoose.model('Tenants', TenantSchema);
