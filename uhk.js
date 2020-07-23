var config;

$( document ).ready(function() {
	$("#upConfig").change(uploadFile);
	$("#downConfig").click(downloadFile);
	$("#newKeymap").click(createKeymap);
	$("#keymapName").on('input', function(){keymapNameCheck();});
	$("#keymapAbbr").on('input', function(){keymapAbbrCheck();});
	$("#keymapName").change(keymapNameChange);
	
	
	function keymapNameCheck() {
		name = $("#keymapName").val();
		abbr = $("#keymapAbbr").val();
		if (checkName(name)) {
			$("#keymapNameError").hide();
			$("#newKeymap").prop('disabled', (!checkAbbr(abbr) || name.length == 0 || abbr.length == 0));
		} else {
			$("#keymapNameError").show();
			$("#newKeymap").prop('disabled', true);
		}
	}
	
	function keymapAbbrCheck() {
		name = $("#keymapName").val();
		abbr = $("#keymapAbbr").val();
		if (checkAbbr(abbr)) {
			$("#keymapAbbrError").hide();
			$("#newKeymap").prop('disabled', (!checkName(name) || name.length == 0 || abbr.length == 0));
		} else {
			$("#keymapAbbrError").show();
			$("#newKeymap").prop('disabled', true);
		}
	}
	
	function keymapNameChange() {
		kname = $("#keymapName");
		kabbr = $("#keymapAbbr");
		count = 2;
		if (kname.val().length > 0) {
			if (kabbr.val().length == 0) {
				kabbr.val(kname.val().slice(0, 3).toUpperCase());
				count = 2;
				while ((count < 10) && (!checkAbbr(kabbr.val()))) {
					kabbr.val(kabbr.val().slice(0, 2) + String(count++));
				}
			}
		}
		keymapNameCheck();//$("#newKeymap").prop('disabled', (!checkName(kname.val()) && kname.val().length > 0 && kabbr.val().length > 0));
	}
	
	function createKeymap() {
		// Create a new blank keymap
		let layer = [{modules: [{id: 0, keyactions: []}, {id: 1, keyactions: []}, {id: 2, keyactions: []}]}, {modules: [{id: 0, keyactions: []}, {id: 1, keyactions: []}]}, {modules: [{id: 0, keyactions: []}, {id: 1, keyactions: []}]}, {modules: [{id: 0, keyactions: []}, {id: 1, keyactions: []}]}];
		for (i=0; i<layer.length; i++)
			for (j=0; j<2; j++)
				for (k=0; k<35; k++)
					layer[i].modules[j].keyactions.push(null);
		let keymap = {isDefault: false, abbreviation: $("#keymapAbbr").val(), name: $("#keymapName").val(), description: $("#keymapDesc").val(), layers: layer};
		let index = 0
		let capsname = $("#keymapName").val().toUpperCase();
		while (index < config.keymaps.length && config.keymaps[index].name.toUpperCase() < capsname) {
			index++;
		}
		//for (i=0; i<config.keymaps.length; i++)
		//	if (config.keymaps
		console.log(index);
		config.keymaps.splice(index, 0, keymap);
	}
	
	function checkName(name) {
		// Check if name is free and can be used
		// Returns False if is already used
		name = name.toUpperCase();
		for (i=0; i<config.keymaps.length; i++)
			if (config.keymaps[i].name.toUpperCase() == name)
				return false;
		return true;
	}
	
	function checkAbbr(name) {
		// Check if abbreviation is free and can be used
		// Returns False if is already used
		name = name.toUpperCase();
		for (i=0; i<config.keymaps.length; i++)
			if (config.keymaps[i].abbreviation.toUpperCase() == name)
				return false;
		return true;
	}
	
	function downloadFile() {
		let textToSave = JSON.stringify(config, null, 2);
	
		if(config !== undefined) {
			let hiddenElement = document.createElement('a');
			hiddenElement.href = 'data:attachment/text,' + encodeURI(textToSave);
			hiddenElement.target = '_blank';
			hiddenElement.download = 'userConfiguration-MOD.json';
			hiddenElement.click();
		}
	}
	
	function uploadFile(event) {
		config = undefined;
		$("#downConfig").prop('disabled', true);
		const input = event.target;
		if ('files' in input && input.files.length > 0) {
			getFileConfig(input.files[0]);
		}
	}
	
	function getFileConfig(file) {
		readFileContent(file).then(content => {
			$("#downConfig").prop('disabled', false);
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
});