# Skill Workshop Management System (Backend)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A048.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis-DC382D.svg)](https://redis.io/)

## Executive Summary

The **Skill Workshop Management System** is a robust, secure, and highly performant backend infrastructure designed to bridge the gap between skill seekers and industry experts.

In today’s digital-first economy, the ability to manage educational resources, facilitate secure financial transactions, and maintain high-speed user interactions is paramount. This project demonstrates a production-ready implementation of these critical business functions, emphasizing **security**, **scalability**, and **modular design**.

---

## Core Business Value & Logic

This system is built with a focus on delivering tangible business outcomes:

-   **Seamless Enrollment Flow**: A streamlined pipeline from workshop discovery to registration, ensuring high conversion rates and a frictionless user experience.
-   **Secure Financial Integration**: Integrated with robust payment gateways (SSLCommerz) and Cloudinary for secure asset management, ensuring trust and reliability for both organizers and participants.
-   **Dynamic Content Management**: Efficient handling of complex workshop data, including multi-level categorization, prerequisites, and resource allocation.
-   **Enhanced User Engagement**: Leveraging Redis for high-performance caching and real-time state management, minimizing latency during peak traffic.
-   **Security-First Architecture**: Implements industry-standard authentication (JWT, Passport.js, OAuth 2.0) and rigorous input validation (Zod) to protect sensitive user data and prevent common vulnerabilities.

---

## Technical Stack & Architecture

The backend utilizes a modern, cloud-native stack designed for long-term maintainability:

-   **Runtime & Framework**: Node.js (v20+) with Express.js for a robust and flexible API layer.
-   **Language**: TypeScript for strict type-safety, reducing runtime errors and improving developer productivity in large-scale projects.
-   **Database**: MongoDB (via Mongoose) for a schema-flexible yet powerful document store, ideal for evolving business requirements.
-   **Caching**: Redis for session management and high-speed data retrieval.
-   **Authentication**: Multi-modal auth system supporting Local strategy, Google OAuth 2.0, and OTP verification via Redis.
-   **Cloud Integration**: Cloudinary for optimized image/asset storage and Nodemailer for automated business communications.

### Modular Design Pattern

The codebase adheres to a strict **Component-Based Modular Architecture**. Each domain (User, Workshop, Enrollment, Payment, etc.) is encapsulated within its own module, containing its own:
-   **Interfaces**: Defining clear data contracts.
-   **Models**: Handling data persistence and relationships.
-   **Services**: Encapsulating core business logic (Domain Logic).
-   **Controllers**: Managing request orchestration.
-   **Routes**: Defining public and private API endpoints.
-   **Validations**: Ensuring data integrity via schema-based validation.

---

## Key Features

-   **Workshop Lifecycle Management**: Complete CRUD operations with advanced querying, filtering, and pagination.
-   **Role-Based Access Control (RBAC)**: Fine-grained permissions for Admins and Students.
-   **Automated OTP System**: Secure account verification and password resets using high-speed Redis storage.
-   **Payment Gateway Integration**: Production-ready SSLCommerz integration with transaction logging and status tracking.
-   **Asset Pipeline**: Automated image uploads and management via Cloudinary.
-   **Rate Limiting**: Integrated security middleware to prevent brute-force attacks and API abuse.

---

## Getting Started

### Prerequisites
-   **Node.js**: v20 or higher
-   **MongoDB**: Local instance or MongoDB Atlas URI
-   **Redis**: Local instance or Redis Cloud URI
-   **Package Manager**: `npm` or `bun`

### Installation

1.  **Clone the repository**:
    ```bash
    git clone [repository-url]
    cd skill-workshop-management-system-backend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file based on the `.env.example` template:
    ```bash
    cp .env.example .env
    # Populate the .env with your specific credentials
    ```

4.  **Run in Development Mode**:
    ```bash
    npm run dev
    ```

### Production Build
```bash
npm run build
npm start
```

---

## Development Standards

-   **Linting**: ESLint configured for code consistency and standard compliance.
-   **Security**: CSRF protection, rate limiting, and NoSQL injection prevention measures.
-   **Modularity**: Decoupled services for easier unit testing and future-proofing.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Contact

**Project Lead**: [Tarekul Islam Rifat]
**Email**: [tarekulrifat142@gmail.com]
<!-- **Portfolio**: [Link to Portfolio/LinkedIn] -->
