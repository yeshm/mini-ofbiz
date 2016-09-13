#!/bin/sh

PROJECT_HOME=`pwd`
echo "PROJECT_HOME:$PROJECT_HOME"

if [ ! -d "$PROJECT_HOME/hot-deploy" ];then
    echo "$PROJECT_HOME/hot-deploy 该目录不存在，请在ofbiz项目目录中执行$0, 后缀带sh的，请加上x权限"
    exit
fi

case "$1" in
    start)
        pids=`ps aux|grep ofbiz|grep "$PROJECT_HOME/tools/[s]tartofbiz.sh"|awk '{print $2}'`
        if [ -n "$pids" ]; then
            echo "ofbiz server is running"
            exit
        else
	        echo "ofbiz server is start..."
	        ulimit -SHn 65535
            $PROJECT_HOME/tools/[s]tartofbiz.sh 1>/dev/null 2>$PROJECT_HOME/runtime/logs/startofbiz.log &
        fi
    ;;
    debug)
        pids=`ps aux|grep ofbiz|grep "$PROJECT_HOME/tools/[s]tartofbiz.sh"|awk '{print $2}'`
        if [ -n "$pids" ]; then
            echo "ofbiz server is running"
		    exit
        else
            echo "ofbiz server is start debug..."
	        ulimit -SHn 65535
            $PROJECT_HOME/ant start-debug 1>/dev/null 2>$PROJECT_HOME/runtime/logs/startofbiz.log &
	        sleep 10
	        $PROJECT_HOME/$0 status
        fi
    ;;
    stop)
        pids=`ps aux|grep ofbiz|grep "$PROJECT_HOME/tools/[s]tartofbiz.sh"|awk '{print $2}'`
            if [ -n "$pids" ]; then
                echo "run stopofbiz.sh"
                $PROJECT_HOME/tools/stopofbiz.sh &
            else
                echo "ofbiz server isn't running"
            fi
    ;;
    log)
        tail -100f $PROJECT_HOME/runtime/logs/ofbiz.log
    ;;
    error)
        tail -100f $PROJECT_HOME/runtime/logs/error.log
    ;;
    restart)
        echo "暂时不用，因未写成service服务"
        # $PROJECT_HOME/$0 stop
        # $PROJECT_HOME/$0 start
    ;;
    status)
	    pids=`ps aux|grep ofbiz|grep "$PROJECT_HOME/tools/[s]tartofbiz.sh"|awk '{print $2}'`
        if [ -n "$pids" ]; then
            echo "ofbiz server is running"
        else
            echo "ofbiz server is stop"
        fi
    ;;
    *)
        echo $"Usage: $0 {start|stop|debug|status|log|error}"
        exit $?
    ;;
esac
