#!/bin/sh

PROJECT_HOME=`pwd`

if [ ! -d "$PROJECT_HOME/hot-deploy" ];then
  echo "$PROJECT_HOME/hot-deploy 该目录不存在，请在ofbiz项目目录中执行$0, 后缀带sh的，请加上x权限"
  exit
fi

case "$1" in
   start)

	pids=`ps aux|grep java|grep "ofbiz.jar"|awk '{print $2}'`
        if [ -n "$pids" ]; then
                echo "ofbiz server is running"
		exit
        else
	       echo "ofbiz server is start..."
	       ulimit -SHn 65535
               $PROJECT_HOME/tools/startofbiz.sh 1>/dev/null 2>$PROJECT_HOME/tools/startofbiz.log &
	       sleep 10
	       $PROJECT_HOME/$0 status
        fi
   ;;
   stop)
            
           pids=`ps aux|grep java|grep "ofbiz.jar"|awk '{print $2}'`
             if [ -n "$pids" ]; then
                    echo "执行ofbiz自带的stopofbiz.sh"
                   $PROJECT_HOME/tools/stopofbiz.sh &
             fi              
            closed=0
            sleep_time=1
             while [ $closed -eq 0 ]
              do
                  pids=`ps aux|grep java|grep "ofbiz.jar"|awk '{print $2}'`
                  if [ -n "$pids" ]; then
                       echo "等待ofbiz结束:$sleep_time,10秒后将强制关闭"
                       sleep_time=$((sleep_time+1))                        
                       if [ $sleep_time -gt 10 ];then
                           kill -9 $pids
                           echo "超过10秒，强制kill -9 ofbiz"                            
                           closed=1
                       else
                           sleep 1
                       fi
                  else
                      closed=1
                  fi                  
              done
	     $PROJECT_HOME/$0 status
   ;;
   restart)
       echo "暂时不用，因未写成service服务"
       # $PROJECT_HOME/$0 stop
       # $PROJECT_HOME/$0 start
   ;;
   status)
	pids=`ps aux | grep java| grep "ofbiz.jar" | grep -v grep | awk '{print $2}'`
        if [ -n "$pids" ]; then
                echo "ofbiz server is running"
        else
                echo "ofbiz server is stop"
        fi
   ;;
   *)
        echo $"Usage: $0 {start|stop|restart|status}"
        exit $?
   ;;
esac
