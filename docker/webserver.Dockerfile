FROM node:lts-buster-slim

RUN npm install -g static-server@2.2.1

WORKDIR /app

ENTRYPOINT ["static-server"]

# EXPOSE 9080
