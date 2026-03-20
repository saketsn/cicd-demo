# Step 1 — choose the base image
FROM node:18-alpine

# Step 2 — set the working directory inside the container
WORKDIR /app

# Step 3 — copy package files first (for layer caching)
COPY package*.json ./

# Step 4 — install dependencies
RUN npm install --production

# Step 5 — copy the rest of the app code
COPY . .

# Step 6 — expose the port the app runs on
EXPOSE 3000

# Step 7 — command to start the app
CMD ["node", "app.js"]