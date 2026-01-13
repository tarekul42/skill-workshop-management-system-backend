# Use an official Node.js LTS image
FROM node:22.12.0-slim

# Set working directory inside the container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install all dependencies (including dev ones, needed for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to JavaScript (this creates /app/dist)
RUN npm run build

# Run the production app using the "start" script
CMD ["npm", "start"]