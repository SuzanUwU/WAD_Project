const mongoose = require("mongoose");

const ccaSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  organizer: { 
    type: String, 
    required: true 
  }, 
  description: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  clubType: { 
    type: String, 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  attendees: { 
    type: Number, 
    default: 0 
  },
  image: {
    data: Buffer,
    contentType: String
  }
});

module.exports = mongoose.model("CCA", ccaSchema, "cca");