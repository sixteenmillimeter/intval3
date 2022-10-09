#!/bin/bash

STOPWORD="${1}"
FILE=$(mktemp)
TMPFILE=$(mktemp)

cat intval3.scad | grep -e "${STOPWORD} ==" | awk -F'== "' '{print $2}' | awk -F'"' '{print $1}' > ${TMPFILE}

if [[ "${STOPWORD}"  == "MODEL" ]]; then
	cat ${TMPFILE} | sed 's/^/.\/stl\/intval3_/' | sed 's/$/.stl/' > ${FILE}
elif [[ "${STOPWORD}" == "LASER" ]]; then
	cat ${TMPFILE} | sed 's/^/.\/dxf\/intval3_/' | sed 's/$/.dxf/' > ${FILE}
fi

rm -f ${TMPFILE}
cat ${FILE} | tr '\n' ' '
rm -f ${FILE}