FROM node:20-alpine

WORKDIR /app

# Copy package definitions
COPY package.json package-lock.json ./

# Install npm dependencies
RUN npm install

# Copy frontend source code
COPY . /app

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

