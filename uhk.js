var config;
document.getElementById("upConfig").addEventListener('change', uploadFile);
document.getElementById("downConfig").addEventListener('click', downloadFile);


function uploadFile(event) {
	config = undefined;
	document.getElementById("downConfig").disabled = true;
	const input = event.target;
	if ('files' in input && input.files.length > 0) {
		getFileConfig(input.files[0]);
	}
}

function downloadFile(event) {
	let textToSave = JSON.stringify(config, null, 2);

	if(config !== undefined) {
		let hiddenElement = document.createElement('a');
		hiddenElement.href = 'data:attachment/text,' + encodeURI(textToSave);
		hiddenElement.target = '_blank';
		hiddenElement.download = 'userConfiguration-MOD.json';
		hiddenElement.click();
	}
}

function getFileConfig(file) {
	readFileContent(file).then(content => {
		document.getElementById("downConfig").disabled = false;
		config = JSON.parse(content);
	}).catch(error => console.log(error));
}

function readFileContent(file) {
	const reader = new FileReader()
	return new Promise((resolve, reject) => {
		reader.onload = event => resolve(event.target.result);
		reader.onerror = error => reject(error);
		reader.readAsText(file);
	})
}