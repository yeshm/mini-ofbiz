#!/bin/sh

OFBIZ_HOME="$( cd -P "$( dirname "$0" )" && pwd )"/..

#1.clean all
ant clean-all

#2.init test data
ant load-demo

#3.check error for init test data
ERROR_LOG_LINE_COUNT=`cat "$OFBIZ_HOME/runtime/logs/error.log"|wc -l`

if [ $ERROR_LOG_LINE_COUNT -gt 1 ]; then
  echo "content of $OFBIZ_HOME/runtime/logs/error.log:"
  cat "$OFBIZ_HOME/runtime/logs/error.log"
  exit 1
fi

#4.run tests
!(ant run-tests)
STATUS=$?

#5.tar test results 目标文件为 runtime/logs/test-results/test-results.tar.gz
cd $OFBIZ_HOME/runtime/logs/test-results
tar -czvf test-results.tar.gz html

if [ $STATUS == 0 ]; then
  echo "ant run-tests return failure"
  exit 1
fi