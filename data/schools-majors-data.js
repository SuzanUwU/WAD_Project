// Static data for schools and their majors under SMU.
// Run once to populate your MongoDB hackathon collection.
// Usage: node data/schools-majors-data.js
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const mongoose = require('mongoose');
const School = require('./../models/school-model');

const schoolsData = [
  {
    code:        'soa',
    displayName: 'SOA',
    fullName:    'School of Accountancy',
    website:     'https://accountancy.smu.edu.sg/',
    majors: [
      { code: 'acc',    name: 'Accounting' },
      { code: 'atsa',   name: 'Accounting with Track in Sustainability Accounting' },
      { code: 'ada',    name: 'Accounting Data and Analytics' },
      { code: 'finfor', name: 'Financial Forensics' },
    ],
  },
  {
    code:        'sob',
    displayName: 'SOB',
    fullName:    'LKC School of Business',
    website:     'https://business.smu.edu.sg/',
    majors: [
      { code: 'cman',   name: 'Communication Management' },
      { code: 'cmddc',  name: 'Communication Management with track in Data, Design, & Communication' },
      { code: 'fin',    name: 'Finance' },
      { code: 'ffa',    name: 'Finance with track in Finance Analytics' },
      { code: 'fre',    name: 'Finance with track in Real Estate' },
      { code: 'fwm',    name: 'Finance with track in Wealth Management' },
      { code: 'fit',    name: 'Finance with track in International Trading' },
      { code: 'fb',     name: 'Finance with track in Banking' },
      { code: 'fsf',    name: 'Finance with track in Sustainable Finance' },
      { code: 'fpb',    name: 'Finance with Private Banking Work-Study Degree' },
      { code: 'inent',  name: 'Innovation & Entrepreneurship' },
      { code: 'mark',   name: 'Marketing' },
      { code: 'mma',    name: 'Marketing with track in Marketing Analytics' },
      { code: 'opm',    name: 'Operations Management' },
      { code: 'omoa',   name: 'Operations Management with track in Operations Analytics' },
      { code: 'ommbo',  name: 'Operations Management with track in Maritime Business & Operations' },
      { code: 'obhr',   name: 'Organisational Behaviour & Human Resources' },
      { code: 'qfin',   name: 'Quantitative Finance' },
      { code: 'stratm', name: 'Strategic Management' },
      { code: 'digib',  name: 'Digital Business' },
      { code: 'sustm',  name: 'Sustainability Management' },
    ],
  },
  {
    code:        'soe',
    displayName: 'SOE',
    fullName:    'School of Economics',
    website:     'https://economics.smu.edu.sg/',
    majors: [
      { code: 'econs', name: 'Economics' },
      { code: 'eqe',   name: 'Economics with track in Quantitative Economics' },
      { code: 'ere',   name: 'Economics with track in Real Estate' },
      { code: 'asci',  name: 'Actuarial Science' },
      { code: 'asiit', name: 'Actuarial Science with Industry Integration Track' },
      { code: 'hem',   name: 'Health Economics & Management' },
      { code: 'dsa',   name: 'Data Science and Analytics' },
    ],
  },
  {
    code:        'sol',
    displayName: 'SOL',
    fullName:    'YPH School of Law',
    website:     'https://law.smu.edu.sg/',
    majors: [
      { code: 'law',   name: 'Law' },
      { code: 'legst', name: 'Legal Studies' },
    ],
  },
  {
    code:        'scis',
    displayName: 'SCIS',
    fullName:    'School of Computing & Information Systems',
    website:     'https://computing.smu.edu.sg',
    majors: [
      { code: 'techb',  name: 'Technology for Business' },
      { code: 'ba',     name: 'Business Analytics' },
      { code: 'fintec', name: 'Financial Technology' },
      { code: 'pdev',   name: 'Product Development' },
      { code: 'scmt',   name: 'Smart-City Management and Technology' },
      { code: 'fai',    name: 'Frontier AI' },
      { code: 'cybsec', name: 'Cybersecurity' },
      { code: 'swsys',  name: 'Software Systems' },
      { code: 'itsm',   name: 'IT Solution Management' },
      { code: 'cnl',    name: 'Computing and Law' },
      { code: 'sweng',  name: 'Software Engineering' },
      { code: 'comst',  name: 'Computing Studies' },
      { code: 'tbs',    name: 'Technology for Business Solutions' },
    ],
  },
  {
    code:        'soss',
    displayName: 'SOSS',
    fullName:    'School of Social Sciences',
    website:     'https://socsc.smu.edu.sg/',
    majors: [
      { code: 'ple',    name: 'Politics, Law and Economics' },
      { code: 'polsci', name: 'Political Science' },
      { code: 'psych',  name: 'Psychology' },
      { code: 'socio',  name: 'Sociology' },
      { code: 'ga',     name: 'Global Asia' },
      { code: 'ppm',    name: 'Public Policy and Public Management' },
      { code: 'ss',     name: 'Sustainable Societies' },
    ],
  },
];

module.exports = { schoolsData };

// ── Seeder — only runs when executed directly: node data/schools-majors-data.js ──
async function seedSchools() {
  try {
    await mongoose.connect(process.env.DB);
    console.log('MongoDB connected');

    await School.deleteMany({});
    console.log('Existing school data cleared');

    await School.insertMany(schoolsData);
    console.log(`${schoolsData.length} schools (with embedded majors) inserted successfully`);

  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

seedSchools();
