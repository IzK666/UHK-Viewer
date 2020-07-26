var jsondata;


$( document ).ready(function() {
	$("#upConfig").change(uploadFile);
	$("#btnDownload").click(downloadFile);
	$("#newKeymap").click(createKeymap);
	$("#keymapName").on('input', function(){keymapNameCheck();});
	$("#keymapAbbr").on('input', function(){keymapAbbrCheck();});
	$("#keymapName").change(keymapNameChange);
	$("a").click(menuselect);
	$("#sKeymapF").change(copyChange);
	$("#sKeymapT").change(copyChange);
	$("#sLayerF").change(function(){if ($("#sLayerF").val()=="all"){$("#sLayerT").val("all")}else if ($("#sLayerT").val()=="all"){$("#sLayerT").val("0")};copyChange();}); // If layer is All, destiny should be all
	$("#sLayerT").change(function(){if ($("#sLayerT").val()=="all"){$("#sLayerF").val("all")}else if ($("#sLayerF").val()=="all"){$("#sLayerF").val("0")};copyChange();});
	$("#chkCopy").change(copyChange);
	$("#sSideF").change(function(){$("#sSideT").val($("#sSideF").val());copyChange();}); // We need to match sides (Left-left, right-right, both-both
	$("#sSideT").change(function(){$("#sSideF").val($("#sSideT").val());copyChange();});
	$("#btnCopy").click(copyLayer);
	$("#btnClear").click(clearLayer);
	$("input[type='radio'").change(changeLayer);



	function showError(text) {
		$("#txtError").html(text);
		$("#divError").show().delay(2000).fadeOut(500);
	}

	function menuselect() {
		if ($(this).hasClass("sidetitle"))
			return;
		view = $(this).attr("data-menu");
		if (jsondata === undefined && view != "divConfig" && view != "divAbout") {
			showError("This function is unavailable<br>Load a configuration file")
		} else {
			$(".element").addClass("hide");
			$('.sideselected').removeClass('sideselected');
			$(this).addClass('sideselected');
			$("#" + view).removeClass("hide");
			//if (view != "keymap" && view != "macro")
			if (view == "divKeymap") {
				$('#layer0').prop('checked', true);
				changeKeymap(view = $(this).attr("data-index"));
			}
		}
	}

	/************************************/



	/************************************/
	/*	CREATE NEW BLANK KEYMAP			*/
	/************************************/

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
		let source = $("#keymapSource").val();
		if (source != "blank") {
			if (source >= index)
				source++;
			for (i=0; i<4; i++)
				for (j=0; j<2; j++)
					jsondata.keymaps[index].layers[i].modules[j] = jsondata.keymaps[source].layers[i].modules[j];
		}
		loadKeymaps();
		loadMacros();
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


	/************************************/



	/************************************/
	/*	Copy layers						*/
	/************************************/

	function checkCopyOptions() {
		// Check Layer. All-All or Other-Other
		if (!((($('#sLayerF').val() == "all") && ($('#sLayerT').val() == "all")) || (($('#sLayerF').val() != "all") && ($('#sLayerT').val() != "all"))))
			return false;

		// Check sides
		if ($('#sSideF').val() != $('#sSideT').val())
			return false;

		if ($('#chkCopy').is(':checked') && $('#sLayerF').val() != "all")
				return (!($('#sLayerF').val() == $('#sLayerT').val() && $('#sKeymapF').val() == $('#sKeymapT').val()));
		else
			return ($('#sKeymapF').val() != $('#sKeymapT').val());
	}

	function copyChange() {
		$('#btnCopy').attr("disabled", !checkCopyOptions());
	}

	function copyLayer() {
		if (checkCopyOptions()) {
			side1 = ($('#sSideF').val() == "both") ? 0 : $('#sSideF').val();
			side2 = ($('#sSideF').val() == "both") ? 1 : $('#sSideF').val();
			if ($('#sLayerT').val() == "all") {
				for (i=0; i< 4; i++) {
					if ($('#sSideF').val() != "1")
						jsondata.keymaps[$('#sKeymapT').val()].layers[i].modules[0] = jsondata.keymaps[$('#sKeymapF').val()].layers[i].modules[0];
					if ($('#sSideF').val() != "0")
						jsondata.keymaps[$('#sKeymapT').val()].layers[i].modules[1] = jsondata.keymaps[$('#sKeymapF').val()].layers[i].modules[1];
				}
			} else {
				if ($('#sSideF').val() != "1")
					jsondata.keymaps[$('#sKeymapT').val()].layers[$('#sLayerT').val()].modules[0] = jsondata.keymaps[$('#sKeymapF').val()].layers[$('#sLayerF').val()].modules[0];
				if ($('#sSideF').val() != "0")
					jsondata.keymaps[$('#sKeymapT').val()].layers[$('#sLayerT').val()].modules[1] = jsondata.keymaps[$('#sKeymapF').val()].layers[$('#sLayerF').val()].modules[1];
			}
			$("#btnCopyInfo").show().delay(3000).hide(0);
		}
	}

	/************************************/



	/************************************/
	/*	Clear layers					*/
	/************************************/

	function clearLayer() {
		for (i=0; i<36; i++) {
			if ($('#sSideC').val() != "1")
				jsondata.keymaps[$('#sKeymapC').val()].layers[$('#sLayerC').val()].modules[0].keyActions[i] = null;
			if ($('#sSideC').val() != "0")
				jsondata.keymaps[$('#sKeymapC').val()].layers[$('#sLayerC').val()].modules[1].keyActions[i] = null;
		}
		$("#btnClearInfo").show().delay(3000).hide(0);
	}

	/************************************/



	/************************************/
	/*	IMPORT/EXPORT JSON				*/
	/************************************/

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
		$("#btnDownload").prop('disabled', true);
		const input = event.target;
		if ('files' in input && input.files.length > 0) {
			getFileConfig(input.files[0]);
		}
	}

	function getFileConfig(file) {
		readFileContent(file).then(content => {
			$("#btnDownload").prop('disabled', false);
			jsondata = JSON.parse(content);
			loadKeymaps();
			loadMacros();
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

	/************************************/



	/************************************/
	/*	Keymaps and Macros				*/
	/************************************/

	/* Load keymaps on side menu and select dropdowns. */
	function loadKeymaps() {
		$("a").off();
		while ($('#mk').next().attr('id') != "mm")
			$('#mk').next().remove();
		for (i=0; i<$('#sKeymapF').children().length; i++) {
			$('#sKeymapF').children().remove();
			$('#sKeymapT').children().remove();
			$('#sKeymapC').children().remove();
		}
		for (i=0; i<$('#keymapSource').children().length; i++) {
			$('#keymapSource').children().remove();
		}
		$("#keymapSource").append('<option value="blank"><< Blank keymap >></option>');
		items = "";
		for (i=0; i<jsondata.keymaps.length; i++) {
			items += "<a href=\"#\" data-menu=\"divKeymap\" data-index=\"" + i + "\">" + jsondata.keymaps[i].name + ((jsondata.keymaps[i].isDefault == true) ? " * " : "") + "</a>";
			$("#sKeymapT").append('<option value="' + i + '">' + jsondata.keymaps[i].name + '</option>');
			$("#sKeymapF").append('<option value="' + i + '">' + jsondata.keymaps[i].name + '</option>');
			$("#sKeymapC").append('<option value="' + i + '">' + jsondata.keymaps[i].name + '</option>');
			$("#keymapSource").append('<option value="' + i + '">' + jsondata.keymaps[i].name + '</option>');
		}
		$('#mk').after(items);
		$("a").click(menuselect);
	}

	function loadMacros() {
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

	function changeKeymap(keymap) {
		$('#keymapTitle').text(jsondata.keymaps[keymap].name + " (" + jsondata.keymaps[keymap].abbreviation + ")");
		viewKeymap(keymap, 0);
	}

	function changeLayer() {
		viewKeymap($(".sideselected").attr("data-index"), $(this).val());
	}

	function viewKeymap(keymap, layer) {
		
		for (i=0; i<35; i++) {
			$('#lKey'+i).text("");
			$('#rKey'+i).text("");
		}
		for (i=0; i<35; i++) {
			key = jsondata.keymaps[keymap].layers[layer].modules[0].keyActions[i];
			if (key !== null)
				if (key.scancode)
					$('#rKey'+i).text(scancode[key.scancode]);
				else if (key.modifierMask)
					$('#rKey'+i).text(modifier[key.modifierMask]);
				else if (key.layer)
					$('#rKey'+i).text(key.layer);
				else if (key.keymapAbbreviation)
					$('#rKey'+i).text(key.keymapAbbreviation);
				else if (key.keyActionType == "mouse")
					$('#rKey'+i).text(key.mouseAction);
				else if (key.keyActionType == "playMacro")
					$('#rKey'+i).text(jsondata.macros[key.macroIndex].name);
				else
					$('#rKey'+i).text("?");

			key = jsondata.keymaps[keymap].layers[layer].modules[1].keyActions[i];
			if (key !== null)
				if (key.scancode)
					$('#lKey'+i).text(scancode[key.scancode]);
				else if (key.modifierMask)
					$('#lKey'+i).text(modifier[key.modifierMask]);
				else if (key.layer)
					$('#lKey'+i).text(key.layer);
				else if (key.keymapAbbreviation)
					$('#lKey'+i).text(key.keymapAbbreviation);
				else if (key.mouseAction)
					$('#lKey'+i).text(key.mouseAction);
				else if (key.keyActionType == "playMacro")
					$('#lKey'+i).text(jsondata.macros[key.macroIndex].name);
				else
					$('#lKey'+i).text("?");
		}
	}
});
