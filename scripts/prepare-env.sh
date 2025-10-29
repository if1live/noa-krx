#!/bin/bash

export TZ="Etc/GMT-9"
export TODAY_KST=$(date "+%Y-%m-%d")
export YESTERDAY_KST=$(date --date="yesterday" "+%Y-%m-%d")
export START_DATE=$(date -d "14 days ago" +"%Y-%m-%d")
export END_DATE=$(date "+%Y-%m-%d")

echo TODAY_KST=$TODAY_KST
echo YESTERDAY_KST=$YESTERDAY_KST
echo START_DATE=$START_DATE
echo END_DATE=$END_DATE
