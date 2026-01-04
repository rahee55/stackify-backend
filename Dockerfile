# backend/Dockerfile

# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies first (caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port your server runs on
EXPOSE 5000

# Start the server
CMD ["npm", "start"]