#!/bin/bash

echo "Starting in dev mode"

rm run_dev.sh
jq -r ".apps[0].env | keys[]" ./process.json | while read key ; do
	echo -n "$key=\"">> run_dev.sh
	echo -n "$(jq ".apps[0].env.$key" ./process.json)" >> run_dev.sh
	echo -n "\" ">> run_dev.sh
done
echo -n " node services/bluetooth" >> run_dev.sh

#cat run_dev.sh
sh run_dev.sh