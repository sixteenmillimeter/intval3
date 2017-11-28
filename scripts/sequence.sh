#!/bin/bash 
URL=$1
COUNTER=0
FRAMES=25
while [  $COUNTER -lt $FRAMES ]; do
    echo The counter is $COUNTER
    curl "$URL/frame"
    sleep 60
    ((COUNTER++))
done
