FROM ubuntu

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . /usr/src/app

CMD ["spark-submit", "run_image_processor.py", "-i", "test/test1.jpg", "-o", "test/test_out.jpg"]
