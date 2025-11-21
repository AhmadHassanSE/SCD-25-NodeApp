FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy all source code including app.js
COPY . .

# Create backups directory
RUN mkdir -p backups

EXPOSE 3000

CMD ["npm", "start"]
