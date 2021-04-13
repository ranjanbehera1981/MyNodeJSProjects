var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");
var exec = require('ssh-exec');
const fs = require('fs')
var var_line = `"\\n\\nY\\nY\\nY"`
var newline=`"\\n"`
var v_line = `'#!/bin/bash
cd /opt/MetricStream/SYSTEMi/Systemi/bin
./S99systemi.sh stop
ServiceFlag=0
DONE=false
file1=$(cat /opt/MetricStream/url.txt)
installers=$(echo $file1 | tr "~" ${newline})

for addr in $installers
	do
	instName=$(echo $addr | sed "s|.*/||")
	echo $instName
	if [[ $addr =~ "MSUI" ]]
	then
		echo "====================================================="
		echo "\${instName} installation Started"
		echo "====================================================="
		cd /opt/MetricStream
		if [ -e "$instName" ]
		then
			rm "$instName"
		fi
		wget -q $addr
		#provide the sudo access
		#echo "password" | sudo -su root
		echo $instName
		chmod 755 $instName
		echo "password" | sudo -S ./$instName /opt/MetricStream/
		echo "password" | sudo -S chown -R ms:ms SYSTEMi
		echo "password" | sudo -S chown -R ms:ms metricstream-installer-app
	   
		#Writing all services name in installer.txt file
		if [[ "$ServiceFlag" -eq 0 ]];
		then
			echo "====================================================="
			echo "Services Installation Started"
			echo "====================================================="
			cd /opt/MetricStream/metricstream-installer-app/ms-packages
			rm Tomcat_Linux_64.msar Apache_Linux_64.msar
			cp -r Apache-Tomcat-7 .
			echo "Apache_Linux_64.msar" > installer-list.txt 
			echo "Tomcat_Linux_64.msar" >> installer-list.txt 
			echo "apache-activemq-5.16.0.msar" >> installer-list.txt
			echo "datarouter.msar" >> installer-list.txt
			echo "elasticsearch-2.4.1.msar" >> installer-list.txt
			echo "node-js.msar" >> installer-list.txt
			
			#Install the services
			cd /opt/MetricStream/metricstream-installer-app
			printf ${var_line} |./ms-installer.sh -p password -mongoDbPwd password
			ServiceFlag=1
		fi
	else
		echo "====================================================="
		echo "\${instName} Installation Started"
		echo "====================================================="
		if [[ $addr =~ "Platform" ]];
		then
			if [[ "$ServiceFlag" -eq 0 ]];
			then
				echo "====================================================="
				echo "Services Installation Started"
				echo "====================================================="
				cd /opt/MetricStream/metricstream-installer-app/ms-packages
				rm Tomcat_Linux_64.msar Apache_Linux_64.msar
				cp -r Apache-Tomcat-7 .
				echo "Apache_Linux_64.msar" > installer-list.txt 
				echo "Tomcat_Linux_64.msar" >> installer-list.txt 
				echo "apache-activemq-5.16.0.msar" >> installer-list.txt
				echo "datarouter.msar" >> installer-list.txt
				echo "elasticsearch-2.4.1.msar" >> installer-list.txt
				echo "node-js.msar" >> installer-list.txt
				
				#Install the services
				cd /opt/MetricStream/metricstream-installer-app
				printf ${var_line} |./ms-installer.sh -p password -mongoDbPwd password
				ServiceFlag=1
			fi 
		fi
		cd /opt/MetricStream/metricstream-installer-app/ms-packages
		if [ -e "$instName" ]
		then
			rm "$instName"
		fi
		wget -q $addr
		echo $instName > installer-list.txt
		cd /opt/MetricStream/metricstream-installer-app
		printf ${var_line} |./ms-installer.sh -p password -mongoDbPwd password
	fi
done'`

var app = express();
var server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));
app.use(helmet());
app.use(limiter);
	
app.get('/', function(req,res){
  res.sendFile(path.join(__dirname,'./public/form.html'));
});


console.log();
app.post('/install', function(req,res){
	var v_line1=req.body.INSTALLERS.split("\r\n")
	var v_line2 = v_line1.join('~')
	console.log(v_line2)
	exec(`echo ${v_line} > DownloadFiles.sh && chmod 777 DownloadFiles.sh && echo ${v_line2} > url.txt && chmod 777 url.txt && ./DownloadFiles.sh`,{
	  user: req.body.USER,
	  host: req.body.SERVER, 
	  password: req.body.PASSWORD,
	  port: req.body.PORT
	}, function(err, stdout) {
		if (err) {
			throw err;
		}
	}).pipe(res);
});

server.listen(3000,function(){ 
    console.log("Server listening on port: 3000");
});