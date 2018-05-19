FROM node:carbon-alpine

WORKDIR /gradissue-2017

COPY package*.json .

RUN npm install

COPY . .
