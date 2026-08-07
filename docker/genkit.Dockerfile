FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy source
COPY . ./

ENV NODE_ENV=production

# Expose port if genkit uses one (adjust if needed)
EXPOSE 3000

# Start Genkit flows
CMD ["npm", "run", "genkit:start"]
