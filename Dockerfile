FROM node:4.6
WORKDIR /app
ADD . /app
RUN npm install
EXPOSE 8080
CMD npm start
