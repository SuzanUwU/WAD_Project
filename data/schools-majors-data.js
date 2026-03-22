// Static data for schools and their majors under SMU.
// Run once to populate your MongoDB hackathon collection.
// Usage: node data/schools-majors-data.js
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const mongoose = require('mongoose');
const School = require('./../models/School');
const Major = require('./../models/Major');

const schoolsData = [
    { code: "soa", name: "School of Accountancy" },
    { code: "sob", name: "LKC School of Business" },
    { code: "soe", name: "School of Economics" },
    { code: "sol", name: "YPH School of Law" },
    { code: "scis", name: "School of Computing & Information Systems" },    
    { code: "soss", name: "School of Social Sciences" },
];

// Each major references its school by code (not ObjectId — that's only for MongoDB)
const majorsData = [
    // SOA
    { code: "acc", name: "Accounting", schoolCode: "soa" },
    { code: "atsa", name: "Accounting with Track in Sustainability Accounting", schoolCode: "soa" },
    { code: "ada", name: "Accounting Data and Analytics", schoolCode: "soa" },
    { code: "finfor", name: "Financial Forensics", schoolCode: "soa" },

    // SOB
    { code: "cman", name: "Communication Management", schoolCode: "sob" },
    { code: "cmddc", name: "Communication Management with track in Data, Design, & Communication", schoolCode: "sob" },
    { code: "fin", name: "Finance", schoolCode: "sob" },
    { code: "ffa", name: "Finance with track in Finance Analytics", schoolCode: "sob" },
    { code: "fre", name: "Finance with track in Real Estate", schoolCode: "sob" },
    { code: "fwm", name: "Finance with track in Wealth Management", schoolCode: "sob" },
    { code: "fit", name: "Finance with track in International Trading", schoolCode: "sob" },
    { code: "fb", name: "Finance with track in Banking", schoolCode: "sob" },
    { code: "fsf", name: "Finance with track in Sustainable Finance", schoolCode: "sob" },
    { code: "fpb", name: "Finance with Private Banking Work-Study Degree", schoolCode: "sob" },
    { code: "inent", name: "Innovation & Entrepreneurship", schoolCode: "sob" },
    { code: "mark", name: "Marketing", schoolCode: "sob" },
    { code: "mma", name: "Marketing with track in Marketing Analytics", schoolCode: "sob" },
    { code: "opm", name: "Operations Management", schoolCode: "sob" },
    { code: "omoa", name: "Operations Management with track in Operations Analytics", schoolCode: "sob" },
    { code: "ommbo", name: "Operations Management with track in Maritime Business & Operations", schoolCode: "sob" },
    { code: "obhr", name: "Organisational Behaviour & Human Resources", schoolCode: "sob" },
    { code: "qfin", name: "Quantitative Finance", schoolCode: "sob" },
    { code: "stratm", name: "Strategic Management", schoolCode: "sob" },
    { code: "digib", name: "Digital Business", schoolCode: "sob" },
    { code: "sustm", name: "Sustainability Management", schoolCode: "sob" },

    // SOE
    { code: "econs", name: "Economics", schoolCode: "soe" },
    { code: "eqe", name: "Economics with track in Quantitative Economics", schoolCode: "soe" },
    { code: "ere", name: "Economics with track in Real Estate", schoolCode: "soe" },
    { code: "asci", name: "Actuarial Science", schoolCode: "soe" },
    { code: "asiit", name: "Actuarial Science with Industry Integration Track", schoolCode: "soe" },
    { code: "hem", name: "Health Economics & Management", schoolCode: "soe" },
    { code: "dsa", name: "Data Science and Analytics", schoolCode: "soe" },

    // SOL
    { code: "law", name: "Law", schoolCode: "sol" },
    { code: "legst", name: "Legal Studies", schoolCode: "sol" },

    // SCIS
    { code: "techb", name: "Technology for Business", schoolCode: "scis" },
    { code: "ba", name: "Business Analytics", schoolCode: "scis" },
    { code: "fintec", name: "Financial Technology", schoolCode: "scis" },
    { code: "pdev", name: "Product Development", schoolCode: "scis" },
    { code: "scmt", name: "Smart-City Management and Technology", schoolCode: "scis" },
    { code: "fai", name: "Frontier AI", schoolCode: "scis" },
    { code: "cybsec", name: "Cybersecurity", schoolCode: "scis" },
    { code: "swsys", name: "Software Systems", schoolCode: "scis" },
    { code: "itsm", name: "IT Solution Management", schoolCode: "scis" },
    { code: "cnl", name: "Computing and Law", schoolCode: "scis" },
    { code: "sweng", name: "Software Engineering", schoolCode: "scis" },
    { code: "comst", name: "Computing Studies", schoolCode: "scis" },
    { code: "tbs", name: "Technology for Business Solutions", schoolCode: "scis" },

    // SOSS
    { code: "ple", name: "Politics, Law and Economics", schoolCode: "soss" },
    { code: "polsci", name: "Political Science", schoolCode: "soss" },
    { code: "psych", name: "Psychology", schoolCode: "soss" },
    { code: "socio", name: "Sociology", schoolCode: "soss" },
    { code: "ga", name: "Global Asia", schoolCode: "soss" },
    { code: "ppm", name: "Public Policy and Public Management", schoolCode: "soss" },
    { code: "ss", name: "Sustainable Societies", schoolCode: "soss" },

];

/* Given a school code, returns the majors that belong to it.
 * This mirrors what the MongoDB query will do later.
 * @param {string} schoolCode - e.g. "soss"
 * @returns {Array} - array of major objects
 */

function getMajorsBySchoolCode(schoolCode) {
  return majorsData.filter(m => m.schoolCode === schoolCode);
}
 
module.exports = { schoolsData, majorsData, getMajorsBySchoolCode };

async function seedSchMajData() {
    try {
        await mongoose.connect(process.env.DB);
        console.log("MongoDB connected");
 
        // 1. Clear and re-insert schools
        await School.deleteMany({});
        console.log("Existing school data cleared");
 
        await School.insertMany(schoolsData);
        console.log("schoolsData inserted successfully");
 
        // 2. Fetch inserted schools to get their MongoDB _id values
        const insertedSchools = await School.find({});
 
        // 3. Build a { schoolCode -> ObjectId } lookup map
        const schoolIdMap = {};
        insertedSchools.forEach(s => { schoolIdMap[s.code] = s._id; });
 
        // 4. Replace schoolCode string with the actual ObjectId before inserting
        //    Major schema requires `school` to be an ObjectId ref — not a plain string
        const majorsWithIds = majorsData.map(m => ({
            code:   m.code,
            name:   m.name,
            school: schoolIdMap[m.schoolCode], // resolves "soss" -> ObjectId("...")
        }));
 
        // 5. Clear and re-insert majors
        await Major.deleteMany({});
        console.log("Existing major data cleared");
 
        await Major.insertMany(majorsWithIds);
        console.log("majorsData inserted successfully");
 
    } catch (err) {
        console.error("Seeding failed:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
    }
}
 
seedSchMajData();