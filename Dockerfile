FROM mhart/alpine-node:6

WORKDIR /src
ADD . .

EXPOSE 3030
CMD ["npm", "start"]
