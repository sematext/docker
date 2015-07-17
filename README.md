
# SPM for Docker

[SPM performance monitoring by Sematext](http://sematext.com/spm/integrations/docker-monitoring.html) - this is the  monitoring agent for Docker.

Following information is collected and transmitted to SPM (Cloud or On-Premises version):

- OS Metrics of the Host machine (CPU / Mem / Swap) 
- Stats from containers
	- CPU Usage
	- Memory Usage
	- Network Stats
	- Disk I/O Stats
- Aggregations / Filters by 
  - host name
  - image name
  - container id
  - name tag 
- Events
    - Version Information on Startup:
        - server-info – created by spm-agent framework with node.js and OS version info on startup
        - docker-info – Docker Version, API Version, Kernel Version on startup
    - Docker Status Events:
        - Container Lifecycle Events like
            - create, exec_create, destroy, export
        - Container Runtime Events like
            - die, exec_start, kill, oom, pause, restart, start, stop, unpause
- Docker Logs - fields
	- hostname / IP address
	- container id
	- container name
	- image name
	- message

![](https://sematext.files.wordpress.com/2015/06/spm-for-docker.png?w=630&h=455)


## Installation 
1. Get a free account [apps.sematext.com](https://apps.sematext.com/users-web/register.do)  
2. [Create an SPM App of type “Docker”](https://apps.sematext.com/spm-reports/registerApplication.do) and copy the SPM Application Token 
   - For logs you need to [create a Logsene App](https://apps.sematext.com/logsene-reports/registerApplication.do) to obtain a second App Token for [Logsene](http://www.sematext.com/logsene/)  
3. Run the image 
	```
	docker pull sematext/spm-agent-docker
	docker run -d --name spm-agent -e SPM_TOKEN=YOUR_SPM_TOKEN -e LOGSENE_TOKEN=YOUR_LOGSENE_TOKEN  -e HOSTNAME=$HOSTNAME  -v /var/run/docker.sock:/var/run/docker.sock sematext/spm-agent-docker
	```

	*Required Parameters:*
	- -e SPM_TOKEN - SPM Application Token
	- -e HOSTNAME - Name of the docker host
			e.g. '169.254.169.254/latest/meta-data/local-hostname"
	- -v /var/run/docker.sock - Path to the docker socket
	
	Optional Parameters:
	- --priviledged might be required for Security Enhanced Linux (the better way is to have the right policy ...)
	- -e HOSTNAME_LOOKUP_URL - On Amazon ECS, a [metadata query](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html) must be used to get the instance hostname (e.g. "169.254.169.254/latest/meta-data/local-hostname")
	
	_Docker Logs Parameters_
	- -e LOGSENE_TOKEN - Logsene Application Token for logs
	Whitelist containers for logging 
	- -e MATCH_BY_NAME - A regular expression to white list container names 
	- -e MATCH_BY_IMAGE - A regular expression to white list image names 
	Blacklist containers 
	- -e SKIP_BY_NAME - A regular expression to black list container names 
	- -e SKIP_BY_IMAGE - A regular expression to black list image names for logging 


	You’ll see your Docker metrics in SPM after about a minute.
	
5. Watch metrics, use anomaly detection for alerts, create e-mail reports and [much more ...](http://blog.sematext.com/2015/06/09/docker-monitoring-support/)

![](https://sematext.files.wordpress.com/2015/06/docker-overview-2.png)

![](https://sematext.files.wordpress.com/2015/06/docker-network-metrics.png)

Docker Events:
![](https://sematext.files.wordpress.com/2015/06/bildschirmfoto-2015-06-24-um-13-56-39.png)

## Installation on CoreOS Linux

1. Get a free account [apps.sematext.com](https://apps.sematext.com/users-web/register.do)  
2. [Create an SPM App of type “Docker”](https://apps.sematext.com/spm-reports/registerApplication.do) and copy the SPM Application Token
3. Set the value of the SPM application token in etcd

	```
	etcdctl set /sematext.com/myapp/spm/token YOUR_SPM_TOKEN
	```

	If you like to add centralized logging set the Logsene Token (see logging section below): 

	```
	etcdctl set /sematext.com/myapp/logsene/token YOUR_LOGSENE_TOKEN
	```
	
4. Start SPM Agent (for tests only - see Unit File for fleet)

	```
	docker run -d --name spm-agent -e SPM_TOKEN=`etcdctl get /sematext.com/myapp/spm/token` -e HOSTNAME=$HOSTNAME -v /var/run/docker.sock:/var/run/docker.sock sematext/spm-agent-docker
	```

### Unit File for fleet

To initialize SPM for Docker with fleet please use [this unit file](https://github.com/sematext/spm-agent-docker/blob/master/coreos/spm-agent-v2.service).

```
wget https://raw.githubusercontent.com/sematext/spm-agent-docker/master/coreos/spm-agent-v2.service
```

To activate SPM Docker Agent for the entire cluster save the file as spm-agent.service. Load and start the service with

```
	fleetctl load spm-agent-v2.service && fleetctl start spm-agent-v2.service
```

After one minute you should see the metrics in SPM. If you are interested in an overview instead of details shown above, 
use the 'Birds Eye View' - listing current health status of all monitored machines

![](https://sematext.files.wordpress.com/2015/07/core-os-bev.png)

### Centralize all journal logs

Create a [Logsene](http://www.sematext.com/logsene/) App 
Set the Logsene Application Token in etcd:
```
etcdctl set /sematext.com/myapp/logsene/token YOUR_LOGSENE_TOKEN
```

Then install the service from [this unit file](https://github.com/sematext/spm-agent-docker/blob/master/coreos/logsene-v2.service):

```
	wget https://raw.githubusercontent.com/sematext/spm-agent-docker/master/coreos/logsene-v2.service
	fleetctl load logsene-v2.service; fleetctl start logsene-v2.service; 
```

More about [Logsene 1-click ELK Stack: Hosted Kibana4](http://blog.sematext.com/2015/06/11/1-click-elk-stack-hosted-kibana-4/)

![](https://sematext.files.wordpress.com/2015/06/spm-logsene-coreos.png)

# Support

1. Please check the [SPM for Docker Wiki](https://sematext.atlassian.net/wiki/display/PUBSPM/SPM+for+Docker)
2. If you have questions about SPM for Docker, chat with us in the [SPM user interface](https://apps.sematext.com/users-web/login.do) or drop an e-mail to support@sematext.com
3. Open an issue [here](https://github.com/sematext/spm-agent-docker/issues) 
4. Contribution guide [here](https://github.com/sematext/spm-agent-docker/blob/master/contribute.md)


