# Dockerfile
FROM node:carbon

# Create app directory
WORKDIR /app

# Copy package(-lock).json
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

EXPOSE 7070

CMD ["npm", "run", "start"]

