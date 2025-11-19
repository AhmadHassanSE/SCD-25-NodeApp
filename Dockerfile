FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Change this line - replace "app.js" with your actual main file
CMD ["node", "app.js"]
