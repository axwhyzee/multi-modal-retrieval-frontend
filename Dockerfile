FROM node:18-alpine

COPY package*.json .
 
RUN npm install
 
COPY . .
 
EXPOSE 3000
