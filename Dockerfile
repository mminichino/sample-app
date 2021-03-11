FROM node:15
WORKDIR /app
ADD . /app
RUN npm install -g npm@latest
RUN npm install
EXPOSE 8080
CMD npm start
