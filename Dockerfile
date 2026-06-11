FROM nginx:alpine
# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf
# Copy site files
COPY . /usr/share/nginx/html/
# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80
EXPOSE 80
# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
