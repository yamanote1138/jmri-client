var jmri = require('./lib/jmri.js'),
	prompt = require('prompt');


prompt.start();

prompt.get(['host'], function (err, result) {
    if (err) { console.log(err); return; }
	
	var jmriClient = new jmri({
		host: result.host
	});

	jmriClient.getThrottle(11, function(err, data){
		if(!err) console.log(data);
	});
});
