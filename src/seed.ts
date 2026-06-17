import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL is not defined. Set it in .env");
  process.exit(1);
}

// ── Imports ──────────────────────────────────────────────────────────
import User from "./app/modules/user/user.model.js";
import { WorkShop, Level } from "./app/modules/workshop/workshop.model.js";
import { Category } from "./app/modules/category/category.model.js";
import Enrollment from "./app/modules/enrollment/enrollment.model.js";
import Payment from "./app/modules/payment/payment.model.js";
import Review from "./app/modules/review/review.model.js";
import Contact from "./app/modules/contact/contact.model.js";

type EnrollmentStatus = "PENDING" | "CANCEL" | "COMPLETE" | "FAILED";
type PaymentStatus = "PAID" | "UNPAID" | "CANCELLED" | "FAILED" | "REFUNDED";
type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

const PASSWORD = "Seed@123";

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setHours(d.getHours() - Math.floor(Math.random() * 72));
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(d.getHours() - Math.floor(Math.random() * 24));
  return d;
}

function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

// ── Seed Data ────────────────────────────────────────────────────────

const LEVEL_NAMES = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "All Levels",
  "Fundamental",
  "Introductory",
  "Professional",
  "Masterclass",
  "Essentials",
  "Specialization",
  "Capstone",
];

const CATEGORY_DATA = [
  { name: "Web Development", slug: "web-development", description: "Build modern web applications with industry-standard technologies." },
  { name: "Data Science", slug: "data-science", description: "Analyze data, build models, and derive actionable insights." },
  { name: "Digital Marketing", slug: "digital-marketing", description: "Master SEO, social media, and paid advertising strategies." },
  { name: "Graphic Design", slug: "graphic-design", description: "Create stunning visuals using professional design tools." },
  { name: "Mobile App Development", slug: "mobile-app-development", description: "Build iOS and Android apps with modern frameworks." },
  { name: "Cloud Computing", slug: "cloud-computing", description: "Deploy and manage infrastructure on AWS, Azure, and GCP." },
  { name: "Cybersecurity", slug: "cybersecurity", description: "Protect systems and networks from digital threats." },
  { name: "UI/UX Design", slug: "ui-ux-design", description: "Design intuitive user interfaces and seamless experiences." },
  { name: "DevOps", slug: "devops", description: "Automate deployments and streamline development pipelines." },
  { name: "Artificial Intelligence", slug: "artificial-intelligence", description: "Explore machine learning, NLP, and computer vision." },
  { name: "Business & Entrepreneurship", slug: "business-entrepreneurship", description: "Develop business acumen and entrepreneurial skills." },
  { name: "Photography & Video", slug: "photography-video", description: "Capture and edit professional photos and videos." },
];

const USER_DATA = [
  { name: "Super Admin", email: "superadmin@seed.com", role: "SUPER_ADMIN" as const },
  { name: "Admin Rahman", email: "admin1@seed.com", role: "ADMIN" as const },
  { name: "Admin Khatun", email: "admin2@seed.com", role: "ADMIN" as const },
  { name: "Instructor Hasan", email: "instructor1@seed.com", role: "INSTRUCTOR" as const },
  { name: "Instructor Ahmed", email: "instructor2@seed.com", role: "INSTRUCTOR" as const },
  { name: "Instructor Sultana", email: "instructor3@seed.com", role: "INSTRUCTOR" as const },
  { name: "Student Karim", email: "student1@seed.com", role: "STUDENT" as const },
  { name: "Student Akter", email: "student2@seed.com", role: "STUDENT" as const },
  { name: "Student Islam", email: "student3@seed.com", role: "STUDENT" as const },
  { name: "Student Hossain", email: "student4@seed.com", role: "STUDENT" as const },
  { name: "Student Nasrin", email: "student5@seed.com", role: "STUDENT" as const },
  { name: "Student Parvez", email: "student6@seed.com", role: "STUDENT" as const },
];

const WORKSHOP_DATA = [
  { title: "Full-Stack Web Development Bootcamp", slug: "full-stack-web-development-bootcamp", description: "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB to become a full-stack developer.", location: "Dhaka", price: 2500, maxSeats: 30, whatYouLearn: ["React & Next.js", "Node.js & Express", "MongoDB & PostgreSQL", "REST & GraphQL APIs", "Authentication & Authorization", "Deployment & DevOps"], prerequisites: ["Basic computer literacy"], benefits: ["Build 3 real-world projects", "Get a verifiable certificate", "Portfolio-ready codebase"], syllabus: ["HTML5 & CSS3 Fundamentals", "JavaScript ES6+", "React & State Management", "Node.js & Express.js", "Database Design", "Authentication & Security", "Deployment & CI/CD"], },
  { title: "Data Science with Python", slug: "data-science-with-python", description: "Master Python, Pandas, Scikit-learn, and TensorFlow for data analysis and machine learning.", location: "Chattogram", price: 3000, maxSeats: 25, whatYouLearn: ["Python for data analysis", "Machine learning algorithms", "Data visualization", "Statistical modeling", "Deep learning basics"], prerequisites: ["Basic programming knowledge"], benefits: ["Work with real datasets", "Kaggle competition experience", "Industry-recognized certificate"], syllabus: ["Python Refresher", "NumPy & Pandas", "Matplotlib & Seaborn", "Machine Learning Fundamentals", "Supervised Learning", "Unsupervised Learning", "Neural Networks & Deep Learning"], },
  { title: "Digital Marketing Mastery", slug: "digital-marketing-mastery", description: "Master SEO, SEM, social media marketing, email marketing, and content strategy.", location: "Dhaka", price: 2000, maxSeats: 40, whatYouLearn: ["SEO & SEM strategies", "Social media advertising", "Email marketing automation", "Content marketing", "Analytics & reporting"], prerequisites: ["None"], benefits: ["Run a live campaign", "Google Analytics certified", "Portfolio of case studies"], syllabus: ["Digital Marketing Landscape", "SEO & Keyword Research", "Google Ads & PPC", "Social Media Strategy", "Content Marketing", "Email Marketing", "Analytics & Optimization"], },
  { title: "UI/UX Design Masterclass", slug: "ui-ux-design-masterclass", description: "Design beautiful, user-centered interfaces using Figma, with a focus on usability and accessibility.", location: "Remote", price: 1800, maxSeats: 20, whatYouLearn: ["User research methods", "Wireframing & prototyping", "Visual design principles", "Design systems", "Usability testing"], prerequisites: ["No prior design experience needed"], benefits: ["Figma portfolio project", "User testing certificate", "Design system you built"], syllabus: ["Design Thinking", "User Research", "Information Architecture", "Wireframing & Prototyping", "Visual Design", "Design Systems", "Usability Testing"], },
  { title: "Cloud Computing with AWS", slug: "cloud-computing-with-aws", description: "Deploy scalable applications on AWS. Learn EC2, S3, Lambda, RDS, and CloudFormation.", location: "Dhaka", price: 3500, maxSeats: 20, whatYouLearn: ["AWS core services", "Serverless architecture", "Infrastructure as Code", "Monitoring & scaling", "Cost optimization"], prerequisites: ["Basic Linux knowledge"], benefits: ["AWS practice exam access", "Free AWS credits", "Deploy a production app"], syllabus: ["AWS Fundamentals", "EC2 & Networking", "S3 & Storage", "Lambda & Serverless", "RDS & Databases", "IAM & Security", "CloudFormation & CI/CD"], },
  { title: "Mobile App Development with React Native", slug: "mobile-app-development-react-native", description: "Build cross-platform mobile apps for iOS and Android using React Native.", location: "Chattogram", price: 2800, maxSeats: 25, whatYouLearn: ["React Native fundamentals", "Navigation & state management", "Native device APIs", "App store deployment", "Performance optimization"], prerequisites: ["Basic React knowledge"], benefits: ["Publish to App Store & Play Store", "Real-time chat app project", "Developer account guidance"], syllabus: ["React Native Setup", "Components & Styling", "Navigation", "State Management", "Native APIs", "Networking & Data", "Deployment & Publishing"], },
  { title: "Cybersecurity Essentials", slug: "cybersecurity-essentials", description: "Learn ethical hacking, network security, encryption, and incident response.", location: "Dhaka", price: 3200, maxSeats: 15, whatYouLearn: ["Network security fundamentals", "Ethical hacking tools", "Encryption & cryptography", "Incident response", "Compliance & governance"], prerequisites: ["Basic networking knowledge"], benefits: ["Hands-on lab environment", "Capture The Flag challenges", "Certification prep guide"], syllabus: ["Security Fundamentals", "Network Security", "Cryptography", "Ethical Hacking", "Web Application Security", "Incident Response", "Compliance & Governance"], },
  { title: "DevOps & CI/CD Pipeline", slug: "devops-ci-cd-pipeline", description: "Automate deployments with Docker, Kubernetes, Jenkins, and GitHub Actions.", location: "Remote", price: 3000, maxSeats: 20, whatYouLearn: ["Docker & containerization", "Kubernetes orchestration", "CI/CD pipelines", "Infrastructure as Code", "Monitoring & logging"], prerequisites: ["Basic Linux & Git knowledge"], benefits: ["Deploy a microservice app", "Kubernetes cluster setup", "DevOps portfolio project"], syllabus: ["Version Control & Git", "Docker Fundamentals", "Container Orchestration", "CI/CD with Jenkins", "Kubernetes Basics", "Monitoring & Logging", "Infrastructure as Code"], },
  { title: "Artificial Intelligence & Machine Learning", slug: "ai-machine-learning", description: "Dive deep into AI, neural networks, NLP, and computer vision with hands-on projects.", location: "Dhaka", price: 4000, maxSeats: 20, whatYouLearn: ["Deep learning architectures", "Natural Language Processing", "Computer Vision", "Reinforcement Learning", "MLOps fundamentals"], prerequisites: ["Python & basic statistics"], benefits: ["Build an AI-powered app", "Research paper walkthrough", "AI certificate of completion"], syllabus: ["ML Fundamentals", "Neural Networks", "Convolutional Neural Networks", "Recurrent Neural Networks", "Natural Language Processing", "Computer Vision", "MLOps & Deployment"], },
  { title: "Graphic Design with Adobe Suite", slug: "graphic-design-adobe-suite", description: "Master Photoshop, Illustrator, and InDesign for professional graphic design.", location: "Chattogram", price: 1500, maxSeats: 30, whatYouLearn: ["Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Typography", "Brand identity design"], prerequisites: ["No prior experience needed"], benefits: ["Design a brand identity", "Portfolio-ready projects", "Adobe certified associate prep"], syllabus: ["Design Principles", "Photoshop Basics", "Illustrator Mastery", "Typography", "Brand Identity", "Layout & InDesign", "Portfolio Review"], },
  { title: "Business & Entrepreneurship 101", slug: "business-entrepreneurship-101", description: "Learn business modeling, financial planning, marketing strategy, and pitching.", location: "Dhaka", price: 1200, maxSeats: 50, whatYouLearn: ["Business model canvas", "Financial planning", "Marketing strategy", "Pitch deck creation", "Legal fundamentals"], prerequisites: ["None"], benefits: ["Pitch to real investors", "Business plan template", "Startup networking event"], syllabus: ["Ideation & Validation", "Business Model Canvas", "Financial Planning", "Marketing & Sales", "Legal & Compliance", "Pitching", "Growth & Scaling"], },
  { title: "Professional Photography & Videography", slug: "professional-photography-videography", description: "Master camera techniques, lighting, composition, and post-production editing.", location: "Dhaka", price: 2200, maxSeats: 15, whatYouLearn: ["Camera settings & techniques", "Lighting & composition", "Portrait & landscape", "Video shooting & editing", "Post-processing"], prerequisites: ["A DSLR or mirrorless camera"], benefits: ["Build a photo portfolio", "Film a short video", "Exhibition opportunity"], syllabus: ["Camera Fundamentals", "Composition & Lighting", "Portrait Photography", "Landscape & Street", "Video Fundamentals", "Editing with Lightroom/Premiere", "Portfolio Review"], },
];

const INSTRUCTOR_EXPERTISE = [
  "Full-Stack Development",
  "Data Science & AI",
  "Digital Strategy",
  "Product Design",
  "Cloud Architecture",
  "Mobile Engineering",
  "Security Engineering",
  "Platform Engineering",
  "Deep Learning",
  "Visual Design",
  "Business Strategy",
  "Visual Media",
];

const INSTRUCTOR_BIO = [
  "10+ years of experience building web applications for Fortune 500 companies.",
  "PhD in Computer Science with specialisation in machine learning and data analytics.",
  "Helped 50+ businesses grow through data-driven digital marketing strategies.",
  "Former design lead at a top UX agency with award-winning product launches.",
  "AWS Certified Solutions Architect with expertise in large-scale distributed systems.",
  "Built and shipped 20+ mobile apps with millions of collective downloads.",
  "Certified ethical hacker and former security consultant for government agencies.",
  "Led platform engineering teams at multiple unicorn startups.",
  "Published 15+ papers in top-tier AI conferences and journals.",
  "Creative director with 12 years of experience across branding and illustration.",
  "Founded two successful startups and mentored 100+ early-stage founders.",
  "Award-winning documentary filmmaker and commercial photographer.",
];

const STUDENT_ADDRESSES = [
  "House 12, Road 3, Dhanmondi, Dhaka",
  "Flat 5B, 45 Gulshan Avenue, Dhaka",
  "Village: Kaliganj, Upazila: Lohagara, Chattogram",
  "House 24, Road 8, Banani, Dhaka",
  "Quarter 12, Staff Housing, Rajshahi University",
  "Bashundhara Residential Area, Block C, Dhaka",
];

const CONTACT_SUBJECTS = [
  "Partnership inquiry for corporate training",
  "Question about workshop schedule",
  "Request for group enrollment discount",
  "Feedback on recent web development workshop",
  "Technical issue with payment gateway",
  "Suggestion for new workshop topic",
  "Collaboration proposal for university outreach",
  "Certificate verification request",
  "Inquiry about instructor onboarding",
  "Report inappropriate content on workshop listing",
  "Refund request for duplicate payment",
  "General feedback and appreciation",
];

const CONTACT_MESSAGES = [
  "Our company is interested in a corporate training partnership. We have 50 employees who would benefit from your web development and data science workshops. Please reach out to discuss custom pricing and scheduling.",
  "I'd like to know the detailed schedule for the upcoming month. I'm particularly interested in evening batches as I work during the day. Do you have any plans for weekend workshops?",
  "We are a group of 15 students from a local university. Is there a group discount available for the Digital Marketing Mastery workshop? We would love to attend together.",
  "The Web Development Bootcamp was excellent! The hands-on projects were very practical. I would suggest adding more advanced React content in future iterations. The instructor was fantastic.",
  "I tried to complete my payment but the gateway showed an error after I entered my card details. The amount was deducted but I haven't received any confirmation. Please help.",
  "Have you considered offering a workshop on Rust programming? With its growing popularity in systems programming, I believe many developers in Bangladesh would be interested.",
  "We would like to invite your instructors to conduct a workshop series at our university campus. We can provide the venue and handle local arrangements.",
  "I completed the Data Science workshop last month and received my certificate. However, the QR code on the certificate is not scanning properly. Could you please reissue it?",
  "I'm an experienced DevOps engineer and would like to become an instructor on your platform. I have 8 years of industry experience and can teach Docker, Kubernetes, and CI/CD.",
  "One of the workshop listings appears to use stock images that don't accurately represent the actual learning environment. This could be misleading for prospective students.",
  "I accidentally made two payments for the same enrollment. The first one went through but the second one is still showing as pending. Please cancel the duplicate.",
  "This platform has been incredibly helpful for my career growth. The UI/UX Design Masterclass gave me the skills I needed to switch careers. Thank you for providing such quality education!",
];

const PHONE_NUMBERS = [
  "+8801712345678", "+8801812345678", "+8801912345678",
  "+8801512345678", "+8801612345678", "+8801312345678",
  "+8801712345679", "+8801812345679", "+8801912345679",
  "+8801512345679", "+8801612345679", "+8801312345679",
];

const WORKSHOP_IMAGES = [
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc3185?w=800&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
  "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&q=80",
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
];

const REVIEW_TITLES = [
  "Excellent workshop! Highly recommended",
  "Great learning experience",
  "Good content but room for improvement",
  "Life-changing skills learned here",
  "Average experience overall",
  "Outstanding instructor and material",
  "Decent workshop for beginners",
  "Worth every penny",
  "Exceeded my expectations",
  "Could be better organized",
  "Perfect for career switchers",
  "Solid foundation course",
];

const REVIEW_CONTENTS = [
  "The workshop was incredibly well-structured. The instructor explained complex concepts clearly and the hands-on exercises reinforced the learning. I walked away with practical skills I could immediately apply.",
  "I really enjoyed the practical approach. The real-world examples made it easy to understand how concepts apply in actual work scenarios. The Q&A sessions were particularly helpful.",
  "The content was good but I felt some topics were rushed towards the end. More time on advanced topics would have been beneficial. The basics were well covered though.",
  "This workshop completely changed my perspective on the subject. The instructor's experience and teaching style made complex topics accessible. I've already recommended it to colleagues.",
  "It was an okay experience. The material was basic for my level but I can see how it would be valuable for beginners. The instructor was knowledgeable and responsive to questions.",
  "The instructor was phenomenal - deep industry knowledge and excellent teaching skills. The curriculum was comprehensive and the support materials were top-notch.",
  "As someone completely new to the field, I found this workshop very approachable. The step-by-step guidance and patient instruction made the learning curve manageable.",
  "The investment was absolutely worth it. I landed a freelance project using skills I learned in this workshop within a week of completing it. The certificate also added credibility.",
  "I came in with some prior knowledge but still learned a lot. The advanced modules covered topics I hadn't explored before. Great balance of theory and practice.",
  "The schedule felt a bit disorganized. Some sessions started late and the material could have flowed better. However, the content itself was valuable and the instructor knowledgeable.",
  "This workshop gave me the confidence to pursue a career change. The instructor shared real industry insights and the project work helped build a strong portfolio piece.",
  "Excellent introduction to the topic. The fundamentals were covered thoroughly and I now have a clear roadmap for further learning. Great starting point for beginners.",
];

const REVIEW_RATINGS: number[] = [5, 5, 3, 5, 3, 5, 4, 5, 4, 2, 5, 4];

// ── Helpers ──────────────────────────────────────────────────────────

function generateTransactionId(): string {
  return `SEED${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// ── Main Seed Function ───────────────────────────────────────────────

async function seed() {
  const args = process.argv.slice(2);
  const isFresh = args.includes("--fresh");
  const isClear = args.includes("--clear");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(DB_URL);
  console.log("Connected.\n");

  // ── Clear existing data if --fresh or --clear ────────────────────
  if (isFresh || isClear) {
    console.log("Clearing existing seed data...");
    const collections = ["levels", "categories", "users", "workshops", "enrollments", "payments", "reviews", "contacts"];
    const skipUsers = isClear; // --clear only clears non-user data
    for (const name of collections) {
      if (skipUsers && name === "users") {
        console.log(`  Skipping ${name} (--clear mode)`);
        continue;
      }
      const count = await mongoose.connection.db?.collection(name).countDocuments() ?? 0;
      if (count > 0) {
        await mongoose.connection.db?.collection(name).deleteMany({});
        console.log(`  Cleared ${name} (${count} documents removed)`);
      }
    }
    if (isClear) {
      console.log("\nData cleared. Exiting (--clear mode).\n");
      await mongoose.disconnect();
      process.exit(0);
    }
    console.log();
  }

  // ── 1. Seed Levels ───────────────────────────────────────────────
  console.log("Seeding Levels...");
  const levelDocs = LEVEL_NAMES.map((name) => ({ name }));
  const levels = await Level.insertMany(levelDocs);
  console.log(`  Created ${levels.length} levels`);

  // ── 2. Seed Categories ───────────────────────────────────────────
  console.log("Seeding Categories...");
  const categoryDocs = CATEGORY_DATA.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    thumbnail: "",
  }));
  const categories = await Category.insertMany(categoryDocs);
  console.log(`  Created ${categories.length} categories`);

  // ── 3. Seed Users ────────────────────────────────────────────────
  console.log("Seeding Users...");
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  const userDocs = USER_DATA.map((u, i) => ({
    name: u.name,
    email: u.email,
    password: hashedPassword,
    role: u.role,
    isActive: "ACTIVE" as const,
    isVerified: true,
    phone: PHONE_NUMBERS[i],
    age: 25 + i,
    address: u.role === "STUDENT" ? STUDENT_ADDRESSES[i - 6] ?? STUDENT_ADDRESSES[0] : "Office 12, Level 7, BTI Building, Dhaka",
    expertise: u.role === "INSTRUCTOR" ? INSTRUCTOR_EXPERTISE[i] : undefined,
    bio: u.role === "INSTRUCTOR" ? INSTRUCTOR_BIO[i] : undefined,
    auths: [{ provider: "credentials", providerId: u.email }],
  }));
  const users = await User.insertMany(userDocs);
  console.log(`  Created ${users.length} users`);

  const instructors = users.filter((u) => u.role === "INSTRUCTOR");
  const students = users.filter((u) => u.role === "STUDENT");

  // ── 4. Seed Workshops ────────────────────────────────────────────
  console.log("Seeding Workshops...");
  const workshopDocs = WORKSHOP_DATA.map((w, i) => ({
    title: w.title,
    slug: w.slug,
    description: w.description,
    images: [WORKSHOP_IMAGES[i]],
    location: w.location,
    price: w.price,
    startDate: futureDate(10 + i * 15),
    endDate: futureDate(14 + i * 15),
    whatYouLearn: w.whatYouLearn,
    prerequisites: w.prerequisites,
    benefits: w.benefits,
    syllabus: w.syllabus,
    maxSeats: w.maxSeats,
    minAge: 14,
    currentEnrollments: 0,
    category: categories[i % categories.length]._id,
    level: levels[i % levels.length]._id,
    createdBy: instructors[i % instructors.length]._id,
  }));
  const workshops = await WorkShop.insertMany(workshopDocs);
  console.log(`  Created ${workshops.length} workshops`);

  // ── 5 & 6. Seed Enrollments and Payments ─────────────────────────
  // Create enrollments without payment ref first, then payments,
  // then update enrollments with payment refs.
  console.log("Seeding Enrollments & Payments...");

  // Distribute statuses: 4 COMPLETE, 3 PENDING, 3 CANCEL, 2 FAILED
  const enrollmentStatuses: { es: EnrollmentStatus; ps: PaymentStatus }[] = [
    { es: "COMPLETE", ps: "PAID" },
    { es: "COMPLETE", ps: "PAID" },
    { es: "COMPLETE", ps: "PAID" },
    { es: "COMPLETE", ps: "PAID" },
    { es: "PENDING", ps: "UNPAID" },
    { es: "PENDING", ps: "UNPAID" },
    { es: "PENDING", ps: "UNPAID" },
    { es: "CANCEL", ps: "CANCELLED" },
    { es: "CANCEL", ps: "CANCELLED" },
    { es: "CANCEL", ps: "REFUNDED" },
    { es: "FAILED", ps: "FAILED" },
    { es: "FAILED", ps: "FAILED" },
  ];

  const enrollmentDocs = [];
  for (let i = 0; i < 12; i++) {
    const workshop = workshops[i % workshops.length];
    // Update currentEnrollments on the workshop as we go
    const studentCount = i < 4 ? 1 : (i % 3 === 0 ? 2 : 1);
    workshop.currentEnrollments += studentCount;

    const createdAt = i < 4
      ? daysAgo(5 + i * 2)
      : i < 7
        ? daysAgo(15 + i * 2)
        : monthsAgo(1 + Math.floor(i / 2));

    enrollmentDocs.push({
      user: students[i % students.length]._id,
      workshop: workshop._id,
      studentCount,
      status: enrollmentStatuses[i].es,
      createdAt,
    });
  }

  const enrollments = await Enrollment.insertMany(enrollmentDocs);
  // Update workshops with actual enrollment counts
  for (const ws of workshops) {
    await WorkShop.findByIdAndUpdate(ws._id, {
      currentEnrollments: ws.currentEnrollments,
    });
  }

  // Create payments linked to enrollments
  const paymentDocs = [];
  for (let i = 0; i < 12; i++) {
    const enrollment = enrollments[i];
    const workshop = workshops[i % workshops.length];
    const amount = workshop.price * enrollment.studentCount;

    paymentDocs.push({
      enrollment: enrollment._id,
      transactionId: generateTransactionId(),
      amount,
      status: enrollmentStatuses[i].ps,
      paymentGatewayData: enrollmentStatuses[i].ps === "PAID"
        ? { status: "VALID", val_id: `seed_val_${i}`, bank_txn: "SEEDBANK" }
        : undefined,
      createdAt: enrollment.createdAt,
    });
  }

  const payments = await Payment.insertMany(paymentDocs);

  // Update enrollments with payment refs
  for (let i = 0; i < 12; i++) {
    await Enrollment.findByIdAndUpdate(enrollments[i]._id, {
      payment: payments[i]._id,
    });
  }
  console.log(`  Created ${enrollments.length} enrollments`);
  console.log(`  Created ${payments.length} payments`);

  // ── 7. Seed Reviews ──────────────────────────────────────────────
  console.log("Seeding Reviews...");
  const reviewDocs = [];
  for (let i = 0; i < 12; i++) {
    const status: ReviewStatus = i < 2 ? "PENDING" : "APPROVED";
    reviewDocs.push({
      user: students[i % students.length]._id,
      workshop: workshops[i % workshops.length]._id,
      rating: REVIEW_RATINGS[i],
      title: REVIEW_TITLES[i],
      content: REVIEW_CONTENTS[i],
      status,
      createdAt: daysAgo(30 - i * 2),
    });
  }
  const reviews = await Review.insertMany(reviewDocs);
  console.log(`  Created ${reviews.length} reviews`);

  // ── 8. Seed Contacts ─────────────────────────────────────────────
  console.log("Seeding Contacts...");
  const contactDocs = CONTACT_SUBJECTS.map((subject, i) => ({
    name: USER_DATA[i].name,
    email: USER_DATA[i].email,
    subject,
    message: CONTACT_MESSAGES[i],
    isRead: i < 5,
    createdAt: daysAgo(60 - i * 4),
  }));
  const contacts = await Contact.insertMany(contactDocs);
  console.log(`  Created ${contacts.length} contacts`);

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n── Seed Complete ──────────────────────────────────────");
  console.log(`  Levels:       ${levels.length}`);
  console.log(`  Categories:   ${categories.length}`);
  console.log(`  Users:        ${users.length}`);
  console.log(`  Workshops:    ${workshops.length}`);
  console.log(`  Enrollments:  ${enrollments.length}`);
  console.log(`  Payments:     ${payments.length}`);
  console.log(`  Reviews:      ${reviews.length}`);
  console.log(`  Contacts:     ${contacts.length}`);
  console.log("───────────────────────────────────────────────────────\n");
  console.log(`Demo login password for all seed users: ${PASSWORD}`);
  console.log(`Super Admin: superadmin@seed.com`);
  console.log(`Admin:       admin1@seed.com / admin2@seed.com`);
  console.log(`Instructor:  instructor1-3@seed.com`);
  console.log(`Student:     student1-6@seed.com`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
