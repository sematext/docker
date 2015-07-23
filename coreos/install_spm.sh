#!/bin/bash
if [[ -n "$1" && -n "$2" && -n "$3"  ]] ; then 

	export SPM_TOKEN=$1
	export LOGSENE_TOKEN=$2
	export LOGSENE_GATEWAY_PORT=$3

	etcdctl set /sematext.com/myapp/spm/token $SPM_TOKEN
	etcdctl set /sematext.com/myapp/logsene/token $LOGSENE_TOKEN
	etcdctl set /sematext.com/myapp/logsene/gateway_port $LOGSENE_GATEWAY_PORT

	wget https://raw.githubusercontent.com/sematext/spm-agent-docker/master/coreos/spm-agent.service
	fleetctl load spm-agent.service; fleetctl start spm-agent.service
	wget https://raw.githubusercontent.com/sematext/spm-agent-docker/master/coreos/logsene.service
	fleetctl load logsene.service; fleetctl start logsene.service;

else 
	echo "Missing paramaters. Usage:"
	echo "install_spm.sh SPM_TOKEN LOGSENE_TOKEN LOGSENE_GATEWAY_PORT (e.g. 9000)"
	echo "Please optain your access tokens here: https://apps.sematext.com/"
fi 
