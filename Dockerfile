FROM nginx:alpine
COPY index.html style.css parser.js app.js /usr/share/nginx/html/
EXPOSE 80
