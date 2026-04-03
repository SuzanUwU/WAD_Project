// Run once to populate your MongoDB hackathon collection.
// Usage: node data/hackathon-data.js

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const mongoose = require('mongoose');
const Hackathon = require('../models/hackathonModel');

const hackathons = [
  {
    title: "HackSMU 2026",
    name: "HackSMU",
    description: "SMU's flagship 24-hour hackathon focused on FinTech and smart city solutions. Open to all SMU students with prizes worth $8,000.",
    category: "Hackathon",
    eligibleSchools: ["scis", "soe", "sob"],
    eligibleMajors: ["ba", "fai", "econs", "fb"],
    teamSizeMin: 2,
    teamSizeMax: 4,
    startDate: new Date("2026-05-10T09:00:00Z"),
    endDate: new Date("2026-05-11T09:00:00Z"),
    registrationDeadline: new Date("2026-04-30T23:59:00Z"),
    status: "open",
    image: { data: null, contentType: null }
  },
  {
    title: "CodeForGood 2026",
    name: "CodeForGood",
    description: "A 36-hour hackathon partnered with local nonprofits. Build tech solutions for social impact. Mentorship from industry professionals provided.",
    category: "Hackathon",
    eligibleSchools: ["open"],
    eligibleMajors: ["open"],
    teamSizeMin: 2,
    teamSizeMax: 5,
    startDate: new Date("2026-06-20T08:00:00Z"),
    endDate: new Date("2026-06-21T20:00:00Z"),
    registrationDeadline: new Date("2026-06-10T23:59:00Z"),
    status: "upcoming",
    image: { data: null, contentType: null }
  },
  {
    title: "LegalTech Hackathon 2026",
    name: "LegalTech Hack",
    description: "Collaborate with law and computing students to build tools that simplify legal processes. Judged by practitioners from top Singapore law firms.",
    category: "Hackathon",
    eligibleSchools: ["sol", "scis"],
    eligibleMajors: ["law", "pdev", "itsm"],
    teamSizeMin: 2,
    teamSizeMax: 4,
    startDate: new Date("2026-07-05T09:00:00Z"),
    endDate: new Date("2026-07-06T18:00:00Z"),
    registrationDeadline: new Date("2026-06-25T23:59:00Z"),
    status: "upcoming",
    image: { data: null, contentType: null }
  },
  {
    title: "BizTech Challenge 2026",
    name: "BizTech Challenge",
    description: "A business-meets-technology hackathon where teams pitch data-driven startup ideas. Cash prizes and potential incubator opportunities.",
    category: "Hackathon",
    eligibleSchools: ["soa", "scis", "soe"],
    eligibleMajors: ["finfor", "ba", "dsa"],
    teamSizeMin: 3,
    teamSizeMax: 5,
    startDate: new Date("2026-04-18T10:00:00Z"),
    endDate: new Date("2026-04-19T18:00:00Z"),
    registrationDeadline: new Date("2026-04-08T23:59:00Z"),
    status: "closed",
    image: { data: null, contentType: null }
  },
  {
    title: "MindHack 2026",
    name: "MindHack",
    description: "A mental health and psychology focused hackathon. Build apps and platforms that support student wellbeing and mental health awareness.",
    category: "Hackathon",
    eligibleSchools: ["soss", "scis"],
    eligibleMajors: ["psych", "socio", "tbs", "fintec"],
    teamSizeMin: 2,
    teamSizeMax: 4,
    startDate: new Date("2026-08-15T09:00:00Z"),
    endDate: new Date("2026-08-16T17:00:00Z"),
    registrationDeadline: new Date("2026-08-01T23:59:00Z"),
    status: "upcoming",
    image: { data: null, contentType: null }
  },
  {
    title: "EcoHack 2026",
    name: "EcoHack",
    description: "Sustainability-themed hackathon challenging teams to tackle climate and environmental issues using data, policy, and technology.",
    category: "Hackathon",
    eligibleSchools: ["soss", "soe", "scis", "cis"],
    eligibleMajors: ["ss", "ple", "hem", "techb", "comst"],
    teamSizeMin: 2,
    teamSizeMax: 5,
    startDate: new Date("2026-09-12T09:00:00Z"),
    endDate: new Date("2026-09-13T18:00:00Z"),
    registrationDeadline: new Date("2026-09-01T23:59:00Z"),
    status: "upcoming",
    image: { data: null, contentType: null }
  },
  {
    title: "DataDive 2025",
    name: "DataDive",
    description: "An intensive 48-hour data analytics competition. Teams work with real-world datasets provided by sponsors to derive actionable business insights.",
    category: "Hackathon",
    eligibleSchools: ["scis", "soa", "sob"],
    eligibleMajors: ["pdev", "itsm", "dsa", "stratm"],
    teamSizeMin: 2,
    teamSizeMax: 4,
    startDate: new Date("2025-11-01T09:00:00Z"),
    endDate: new Date("2025-11-03T09:00:00Z"),
    registrationDeadline: new Date("2025-10-20T23:59:00Z"),
    status: "completed",
    image: { data: null, contentType: null }
  },
  {
    title: "PolicyHack 2026",
    name: "PolicyHack",
    description: "Interdisciplinary hackathon bridging public policy, social science and technology. Teams propose and prototype solutions to public governance challenges.",
    category: "Hackathon",
    eligibleSchools: ["soss", "sol", "soe"],
    eligibleMajors: ["ppm", "polsci", "ple", "econs", "law"],
    teamSizeMin: 3,
    teamSizeMax: 5,
    startDate: new Date("2026-10-03T09:00:00Z"),
    endDate: new Date("2026-10-04T17:00:00Z"),
    registrationDeadline: new Date("2026-09-20T23:59:00Z"),
    status: "upcoming",
    image: { data: null, contentType: null }
  },
  {
    title: "HealthTech Sprint 2025",
    name: "HealthTech Sprint",
    description: "A 24-hour hackathon targeting healthcare innovation. Build digital health tools, patient management systems, or wellness apps. Judged by healthcare professionals.",
    category: "Hackathon",
    eligibleSchools: ["open"],
    eligibleMajors: ["open"],
    teamSizeMin: 2,
    teamSizeMax: 4,
    startDate: new Date("2025-12-06T09:00:00Z"),
    endDate: new Date("2025-12-07T09:00:00Z"),
    registrationDeadline: new Date("2025-11-25T23:59:00Z"),
    status: "completed",
    image: { data: null, contentType: null }
  },
  {
    title: "GlobalAsia Hack 2026",
    name: "GlobalAsia Hack",
    description: "Explore Asia-Pacific challenges through a social sciences and tech lens. Topics include migration, urbanisation, and regional identity. Open to interdisciplinary teams.",
    category: "Hackathon",
    eligibleSchools: ["soss", "cis", "soe"],
    eligibleMajors: ["ga", "polsci", "socio", "ss", "ere"],
    teamSizeMin: 2,
    teamSizeMax: 4,
    startDate: new Date("2026-11-14T09:00:00Z"),
    endDate: new Date("2026-11-15T18:00:00Z"),
    registrationDeadline: new Date("2026-11-01T23:59:00Z"),
    status: "upcoming",
    image: { data: null, contentType: null }
  }
];

async function seedHackathons() {
  try {
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected");

    // Clear existing hackathon documents before re-seeding
    await Hackathon.deleteMany({});
    console.log("Existing hackathons cleared");

    await Hackathon.insertMany(hackathons);
    console.log("10 hackathons inserted successfully");

  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

seedHackathons();