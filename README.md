
[SPM performance monitoring by Sematext](http://sematext.com/spm/) - this is the Docker monitoring agent for SPM.

Following information is collected and transmitted to SPM (Cloud or On-Premises version):

- OS Metrics of the Host machine (CPU / Mem / Swap) 
- Stats from containers
	- CPU Usaage
	- Memory Usage
	- Network Stats
	- Disk I/O Stats
- Aggregations/ Filters by 
  - image name
  - container id
  - name tag 

# Status

Currently only for internal use by Sematext - testrelease for the integration with the SPM user interface 
Stay tuned on our [blog](http://blog.sematext.com) for future announcements.

# Installation 

```
npm i spm-agent-docker -g 
```

# Usage

1. Get a free account and create a Node.js API token at [www.sematext.com](https://apps.sematext.com/users-web/register.do)
2. Run it on your docker host machine and pass the SPM Application Token as parameter

```
spm-docker SPM_TOKEN
```


# TODO
- Wrap it into a container ...
- Show stats on terminal
