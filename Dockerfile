FROM python:3.10-slim

RUN apt-get update && apt-get install -y espeak

WORKDIR /app

COPY . .

RUN pip install flask flask-cors

EXPOSE 8080

CMD ["python", "app.py"]