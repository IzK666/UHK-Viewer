var jsondata;

$( document ).ready(function() {
	$("#upConfig").change(uploadFile);
	$("#downConfig").click(downloadFile);
	$("#newKeymap").click(createKeymap);
	$("#keymapName").on('input', function(){keymapNameCheck();});
	$("#keymapAbbr").on('input', function(){keymapAbbrCheck();});
	$("#keymapName").change(keymapNameChange);
	$("a").click(menuselect);
	


	function menuselect() {
		if ($(this).hasClass("sidetitle"))
			return;
		view = $(this).attr("data-menu");
		if (jsondata === undefined && view != "divConfig" && view != "divAbout") {
			$("#divError").show().delay(2000).fadeOut(500);
		} else {
			$(".element").addClass("hide");
			$('.sideselected').removeClass('sideselected');
			$(this).addClass('sideselected');
			if (view != "keymap" && view != "macro")
				$("#" + view).removeClass("hide");
		}
	}

	/****************************/

	/****************************/
	/*	CREATE NEW BLANK KEYMAP	*/
	/****************************/

	function keymapNameCheck() {
		// Check name while you write
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
		// Check abbreviation while you write
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
		// If abbreviation is empty, get it from the name (first 3 letters)
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
		keymapNameCheck();
	}

	function createKeymap() {
		// Create a new blank keymap
		let layer = [{modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}];
		for (i=0; i<layer.length; i++)
			for (j=0; j<2; j++)
				for (k=0; k<35; k++)
					layer[i].modules[j].keyActions.push(null);
		let keymap = {isDefault: false, abbreviation: $("#keymapAbbr").val(), name: $("#keymapName").val(), description: $("#keymapDesc").val(), layers: layer};
		let index = 0
		let capsname = $("#keymapName").val().toUpperCase();
		while (index < jsondata.keymaps.length && jsondata.keymaps[index].name.toUpperCase() < capsname) {
			index++;
		}
		console.log(index);
		jsondata.keymaps.splice(index, 0, keymap);
		updateKeymaps();
		updateMacros();
		$("#newKeymapInfo").show().delay(3000).hide(0);
		$("#keymapName").val("");
		$("#keymapAbbr").val("");
		$("#keymapDesc").val("");
	}

	function checkName(name) {
		// Check if name is not used
		// Returns True if available
		name = name.toUpperCase();
		for (i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].name.toUpperCase() == name)
				return false;
		return true;
	}

	function checkAbbr(name) {
		// Check if abbreviation is not used
		// Returns True if available
		name = name.toUpperCase();
		for (i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].abbreviation.toUpperCase() == name)
				return false;
		return true;
	}

	/****************************/


	/****************************/
	/*	IMPORT/EXPORT JSON		*/
	/****************************/
	function downloadFile() {
		if(jsondata !== undefined) {
			let textToSave = JSON.stringify(jsondata, null, 2);
			let hiddenElement = document.createElement('a');
			hiddenElement.href = 'data:attachment/text,' + encodeURIComponent(textToSave);
			hiddenElement.target = '_blank';
			hiddenElement.download = 'userConfiguration-mod.json';
			hiddenElement.click();
		}
	}

	function uploadFile(event) {
		jsondata = undefined;
		$("#downConfig").prop('disabled', true);
		const input = event.target;
		if ('files' in input && input.files.length > 0) {
			getFileConfig(input.files[0]);
		}
	}

	function getFileConfig(file) {
		readFileContent(file).then(content => {
			$("#downConfig").prop('disabled', false);
			jsondata = JSON.parse(content);
			updateKeymaps();
			updateMacros();
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

	function updateKeymaps() {
		$("a").off();
		while ($('#mk').next().attr('id') != "mm")
			$('#mk').next().remove();
		items = "";
		for (i=0; i<jsondata.keymaps.length; i++) {
			items += "<a href=\"#\" data-menu=\"divKeymap\" data-index=" + i + "\">" + jsondata.keymaps[i].name + ((jsondata.keymaps[i].isDefault == true) ? " * " : "") + "</a>";
		}
		$('#mk').after(items);
		$("a").click(menuselect);
	}

	function updateMacros() {
		$("a").off();
		while ($('#mm').next().attr('href') !== undefined)
			$('#mm').next().remove();
		items = "";
		for (i=0; i<jsondata.macros.length; i++) {
			items += "<a href=\"#\" data-menu=\"divMacro\" data-index=" + i + "\">" + jsondata.macros[i].name + "</a>";
		}
		$('#mm').after(items);
		$("a").click(menuselect);
	}
});