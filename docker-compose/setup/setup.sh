#!/bin/bash

kafka-topics \
  --bootstrap-server kafka:9092 \
  --create \
  --topic channel-svc.public.channels \
  --partitions 1 \
  --replication-factor 1

curl -X POST -H "Content-Type: application/json" --data @/setup/debezium/source.json http://source-connector:8083/connectors

curl -X PUT "http://es:9200/channels" -H "Content-Type: application/json" -d @/setup/init-elastic/channel.json

curl -X PUT "http://es:9200/categories" -H "Content-Type: application/json" -d @/setup/init-elastic/category.json

curl -X PUT "http://es:9200/streams" -H "Content-Type: application/json" -d @/setup/init-elastic/stream.json