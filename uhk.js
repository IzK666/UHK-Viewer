var jsondata;


$( document ).ready(function() {
	$("#cfgUp").change(uploadFile);
	$("#cfgDown").click(downloadFile);

	$("#nkCreate").click(nkCreate);
	$("#nkName").on('input', function(){nkNameCheck();});
	$("#nkAbbr").on('input', function(){nmkAbbrCheck();});
	$("#nkName").change(nkNameChange);

	$("a").click(menuselect);

	$("#cpKF").change(copyChange);
	$("#cpKT").change(copyChange);
	$("#cpLF").change(function(){if ($("#cpLF").val()=="all"){$("#cpLT").val("all")}else if ($("#cpLT").val()=="all"){$("#cpLT").val("0")};copyChange();}); // If layer is All, destiny should be all
	$("#cpLT").change(function(){if ($("#cpLT").val()=="all"){$("#cpLF").val("all")}else if ($("#cpLF").val()=="all"){$("#cpLF").val("0")};copyChange();});
	$("#cpSF").change(function(){$("#cpST").val($("#cpSF").val());copyChange();}); // We need to match sides (Left-left, right-right, both-both
	$("#cpST").change(function(){$("#cpSF").val($("#cpST").val());copyChange();});
	$("#cpCopy").click(copyLayer);
	$("#clClear").click(clearLayer);
	$('#clKeymap').change(clearCheck);
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
				changeKeymap($(this).attr("data-index"));
			} else if (view == "divMacro") {
				viewMacro($(this).attr("data-index"));
			}
		}
	}

	/************************************/



	/************************************/
	/*	CREATE NEW KEYMAP				*/
	/************************************/

	function nkNameCheck() {
		// Check name while you write
		name = $("#nkName").val();
		abbr = $("#nkAbbr").val();
		if (checkName(name)) {
			$("#nkNameError").hide();
			$("#nkCreate").prop('disabled', (!checkAbbr(abbr) || name.length == 0 || abbr.length == 0));
		} else {
			$("#nkNameError").show();
			$("#nkCreate").prop('disabled', true);
		}
	}

	function nkAbbrCheck() {
		// Check abbreviation while you write
		name = $("#nkName").val();
		abbr = $("#nkAbbr").val();
		if (checkAbbr(abbr)) {
			$("#nkAbbrError").hide();
			$("#nkCreate").prop('disabled', (!checkName(name) || name.length == 0 || abbr.length == 0));
		} else {
			$("#nkAbbrError").show();
			$("#nkCreate").prop('disabled', true);
		}
	}

	function nkNameChange() {
		// If abbreviation is empty, get it from the name (first 3 letters)
		kname = $("#nkName");
		kabbr = $("#nkAbbr");
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
		nkNameCheck();
	}

	function nkCreate() {
		// Create a new blank keymap
		let layer = [{modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}];
		for (i=0; i<layer.length; i++)
			for (j=0; j<2; j++)
				for (k=0; k<35; k++)
					layer[i].modules[j].keyActions.push(null);
		let keymap = {isDefault: false, abbreviation: $("#nkAbbr").val(), name: $("#nkName").val(), description: $("#nkDesc").val(), layers: layer};
		let index = 0
		let capsname = $("#nkName").val().toUpperCase();
		while (index < jsondata.keymaps.length && jsondata.keymaps[index].name.toUpperCase() < capsname) {
			index++;
		}
		jsondata.keymaps.splice(index, 0, keymap);
		let source = $("#nkSource").val();
		if (source != "blank") {
			if (source >= index)
				source++;
			for (i=0; i<4; i++)
				for (j=0; j<2; j++)
					jsondata.keymaps[index].layers[i].modules[j] = jsondata.keymaps[source].layers[i].modules[j];
		}
		loadKeymaps();
		loadMacros();
		$("#nkInfo").show().delay(2000).hide(0);
		$("#nkName").val("");
		$("#nkAbbr").val("");
		$("#nkDesc").val("");
		$("#nkCreate").attr("disabled", true);
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
		if ($('#cpKF').val() === null || $('#cpLF').val() === null || $('#cpKT').val() === null || $('#cpLT').val() === null)
			return false;

		// Check Layer. All-All or Other-Other
		if (!((($('#cpLF').val() == "all") && ($('#cpLT').val() == "all")) || (($('#cpLF').val() != "all") && ($('#cpLT').val() != "all"))))
			return false;

		// Check sides
		if ($('#cpSF').val() != $('#cpST').val())
			return false;

		if ($('#cpLF').val() != "all")
				return (!($('#cpLF').val() == $('#cpLT').val() && $('#cpKF').val() == $('#cpKT').val()));
		else
			return ($('#cpKF').val() != $('#cpKT').val());
	}

	function copyChange() {
		$('#cpCopy').attr("disabled", !checkCopyOptions());
	}

	function copyLayer() {
		if (checkCopyOptions()) {
			side1 = ($('#cpSF').val() == "both") ? 0 : $('#cpSF').val();
			side2 = ($('#cpSF').val() == "both") ? 1 : $('#cpSF').val();
			if ($('#cpLT').val() == "all") {
				for (i=0; i< 4; i++) {
					if ($('#cpSF').val() != "1")
						jsondata.keymaps[$('#cpKT').val()].layers[i].modules[0] = jsondata.keymaps[$('#cpKF').val()].layers[i].modules[0];
					if ($('#cpSF').val() != "0")
						jsondata.keymaps[$('#cpKT').val()].layers[i].modules[1] = jsondata.keymaps[$('#cpKF').val()].layers[i].modules[1];
				}
			} else {
				if ($('#cpSF').val() != "1")
					jsondata.keymaps[$('#cpKT').val()].layers[$('#cpLT').val()].modules[0] = jsondata.keymaps[$('#cpKF').val()].layers[$('#cpLF').val()].modules[0];
				if ($('#cpSF').val() != "0")
					jsondata.keymaps[$('#cpKT').val()].layers[$('#cpLT').val()].modules[1] = jsondata.keymaps[$('#cpKF').val()].layers[$('#cpLF').val()].modules[1];
			}
			$("#cpInfo").show().delay(2000).hide(0);
		}
	}

	/************************************/



	/************************************/
	/*	Clear layers					*/
	/************************************/

	function clearLayer() {
		for (i=0; i<36; i++) {
			if ($('#clSide').val() != "1")
				jsondata.keymaps[$('#clKeymap').val()].layers[$('#clLayer').val()].modules[0].keyActions[i] = null;
			if ($('#clSide').val() != "0")
				jsondata.keymaps[$('#clKeymap').val()].layers[$('#clLayer').val()].modules[1].keyActions[i] = null;
		}
		$("#clInfo").show().delay(2000).hide(0);
	}
	
	function clearCheck() {
		$('#clClear').attr('disabled', ($('#clKeymap').val() == null));
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
		$("#cfgDown").prop('disabled', true);
		const input = event.target;
		if ('files' in input && input.files.length > 0) {
			getFileConfig(input.files[0]);
		}
	}

	function getFileConfig(file) {
		readFileContent(file).then(content => {
			$("#cfgDown").prop('disabled', false);
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
	/*	Keymaps							*/
	/************************************/

	/* Load keymaps on side menu and select dropdowns. */
	function loadKeymaps() {
		$("a").off(); // Remove menu listeners
		while ($('#mk').next().attr('id') != "mm") // Remove all keyboard from menu
			$('#mk').next().remove();
		
		 // Remove keyboards from selects
		for (i=0; i<$('#cpKF').children().length; i++) {
			$('#cpKF').children().remove();
			$('#cpKT').children().remove();
			$('#clKeymap').children().remove();
			$('#nkSource').children().remove();
		}


		// Create first options
		$("#cpKT").append('<option disabled selected value></option>');
		$("#cpKF").append('<option disabled selected value></option>');
		$("#clKeymap").append('<option disabled selected value></option>');
		$("#nkSource").append('<option value="blank"><< Blank keymap >></option>');

		// Insert keyboard list on selects
		items = "";
		for (i=0; i<jsondata.keymaps.length; i++) {
			items += "<a href=\"#\" data-menu=\"divKeymap\" data-index=\"" + i + "\">" + jsondata.keymaps[i].name + ((jsondata.keymaps[i].isDefault == true) ? " * " : "") + "</a>";
			$("#cpKT").append('<option value="' + i + '">' + jsondata.keymaps[i].name + '</option>');
			$("#cpKF").append('<option value="' + i + '">' + jsondata.keymaps[i].name + '</option>');
			$("#clKeymap").append('<option value="' + i + '">' + jsondata.keymaps[i].name + '</option>');
			$("#nkSource").append('<option value="' + i + '">' + jsondata.keymaps[i].name + '</option>');
		}
		$('#mk').after(items);
		$("a").click(menuselect); // Create menu listeners
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
				if (key.scancode) {
					$('#rKey'+i).text(scancode[key.scancode]);
					if (key.modifierMask) {
	 					value = ""
	 					for (j=0; j<4; j++)
	 						value += (key.modifierMask & Math.pow(2, j)) ? capitalize(modifier[Math.pow(2, j)].slice(1, 2)) : ((key.modifierMask >> 4) & Math.pow(2, j) ? capitalize(modifier[Math.pow(2, j)].slice(1, 2)) : "-");
						$('#rKey'+i).append("<br><span class='tiny'>" + value + "</span>");
					}
 				} else if (key.modifierMask) {
 					value = ""
 					modifier.forEach(function(item, index){if (index & key.modifierMask) value += item + " + ";});
					$('#rKey'+i).text(value.slice(0, -3));
				} else if (key.layer)
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
				if (key.scancode) {
					$('#lKey'+i).text(scancode[key.scancode]);
					if (key.modifierMask) {
	 					value = ""
	 					for (j=0; j<4; j++)
	 						value += (key.modifierMask & Math.pow(2, j)) ? capitalize(modifier[Math.pow(2, j)].slice(1, 2)) : ((key.modifierMask >> 4) & Math.pow(2, j) ? capitalize(modifier[Math.pow(2, j)].slice(1, 2)) : "-");
						$('#lKey'+i).append("<br><span class='tiny'>" + value + "</span>");
					}
				} else if (key.modifierMask)
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



	/************************************/



	/************************************/
	/*	Macros							*/
	/************************************/
	
	
	function loadMacros() {
		$("a").off();
		while ($('#mm').next().attr('href') !== undefined)
			$('#mm').next().remove();
		items = "";
		for (i=0; i<jsondata.macros.length; i++) {
			items += "<a href=\"#\" data-menu=\"divMacro\" data-index=" + i + ">" + jsondata.macros[i].name + "</a>";
		}
		$('#mm').after(items);
		$("a").click(menuselect);
	}

	function viewMacro(macro) {
		$('#macroTitle').text(jsondata.macros[macro].name);
		while ($('#tmacro tr').length > 0)
			$('#tmacro tr')[0].remove();
		for (i=0; i<jsondata.macros[macro].macroActions.length; i++) {
			action = jsondata.macros[macro].macroActions[i].macroActionType;
			if (action == "text") {
				$('#tmacro').append("<tr><td>Write text</td><td>" + jsondata.macros[macro].macroActions[i].text + "</td></tr>")
			} else if (action == "key") {
				action = capitalize(jsondata.macros[macro].macroActions[i].action) + " key";
				value = "";
				if (jsondata.macros[macro].macroActions[i].modifierMask) {
					//value += modifier[jsondata.macros[macro].macroActions[i].modifierMask] + " + ";
					modifier.forEach(function(item, index){if (index & jsondata.macros[macro].macroActions[i].modifierMask) value += item + " + ";});
				}
				if (jsondata.macros[macro].macroActions[i].scancode)
					value += scancode[jsondata.macros[macro].macroActions[i].scancode];
				if (value.endsWith(" + "))
					value = value.slice(0, -3);
				$('#tmacro').append("<tr><td>" + action + "</td><td>" + value + "</td></tr>")
			} else if (action == "delay") {
				$('#tmacro').append("<tr><td>Delay</td><td>" + jsondata.macros[macro].macroActions[i].delay + "</td></tr>")
			} else if (action == "moveMouse") {
				$('#tmacro').append("<tr><td>Move mouse</td><td>x:" + jsondata.macros[macro].macroActions[i].x + ", y:"+ jsondata.macros[macro].macroActions[i].y + "</td></tr>")
			} else if (action == "scrollMouse") {
				$('#tmacro').append("<tr><td>Scroll mouse</td><td>x:" + jsondata.macros[macro].macroActions[i].x + ", y:"+ jsondata.macros[macro].macroActions[i].y + "</td></tr>")
			} else if (action == "mouseButton") {
				value = "";
				mouse.forEach(function(item, index){if (index & jsondata.macros[macro].macroActions[i].mouseButtonsMask) value += item + " + ";});
				if (value.endsWith(" + "))
					value = value.slice(0, -3);
				$('#tmacro').append("<tr><td>" + capitalize(jsondata.macros[macro].macroActions[i].action) + " button</td><td>" + value + "</td></tr>");
			} else
				$('#tmacro').append("<tr><td colspan='2'>" + jsondata.macros[macro].macroActions[i].macroActionType + "</td></tr>")
		}
	}



	/************************************/



	/************************************/
	/*	General							*/
	/************************************/


	function capitalize(word) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	}
});
