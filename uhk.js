
$.fn.textWidth = function(text, font) {
    if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
    $.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
    return $.fn.textWidth.fakeEl.width();
};

var jsondata;


$( document ).ready(function() {
	$("#cfgUp").change(uploadFile);
	$("#cfgDown").click(downloadFile);

	$("#nkCreate").click(nkCreate);
	$("#nkName").on('input', function(){nkNameCheck();});
	$("#nkAbbr").on('input', function(){nkAbbrCheck();});
	$("#nkName").change(nkNameChange);

	$("#sideMenu a").click(menuselect);
	$('#newKeymap').click(newKeymap);

	$("#cpKF").change(copyChangeForm);
	$("#cpKT").change(copyChangeForm);
	$("#cpLF").change(function(){if ($("#cpLF").val()=="all"){$("#cpLT").val("all")}else if ($("#cpLT").val()=="all"){$("#cpLT").val("0")};copyChangeForm();}); // If layer is All, destiny should be all
	$("#cpLT").change(function(){if ($("#cpLT").val()=="all"){$("#cpLF").val("all")}else if ($("#cpLF").val()=="all"){$("#cpLF").val("0")};copyChangeForm();});
	$("#cpSF").change(function(){$("#cpST").val($("#cpSF").val());copyChangeForm();}); // We need to match sides (Left-left, right-right, both-both
	$("#cpST").change(function(){$("#cpSF").val($("#cpST").val());copyChangeForm();});
	$("#cpCopy").click(copyLayerForm);
	$("#clClear").click(clearLayerForm);
	$('#clKeymap').change(clearCheck);
	$("input[type='radio'").change(changeLayer);

	$('#threeimg').click(showMenu);
	$('#kmName').on('input', function(){$(this).css("width", Math.ceil($(this).textWidth())+18)});
	$('#kmAbbr').on('input', function() {
		var s=$(this)[0].selectionStart;
		var e=$(this)[0].selectionEnd;
		$(this).val($(this).val().toUpperCase());
		$(this)[0].setSelectionRange(s,e);
		$(this).css("width", $(this).textWidth()+10);
	});
	$('#kmName').change(kmNewName);
	$('#kmAbbr').change(kmNewAbbr);

	function showError(text) {
		$("#txtError").html(text);
		$("#divError").show().delay(1500).hide(0);
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
		if (checkNameForm(name)) {
			$("#nkNameError").hide();
			$("#nkCreate").prop('disabled', (!checkAbbrForm(abbr) || name.length == 0 || abbr.length == 0));
		} else {
			$("#nkNameError").show();
			$("#nkCreate").prop('disabled', true);
		}
	}

	function nkAbbrCheck() {
		// Check abbreviation while you write
		name = $("#nkName").val();
		abbr = $("#nkAbbr").val();
		if (checkAbbrForm(abbr)) {
			$("#nkAbbrError").hide();
			$("#nkCreate").prop('disabled', (!checkNameForm(name) || name.length == 0 || abbr.length == 0));
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
				while ((count < 10) && (!checkAbbrForm(kabbr.val()))) {
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
		$("#nkInfo").show().delay(2000).hide(0);
		$("#nkName").val("");
		$("#nkAbbr").val("");
		$("#nkDesc").val("");
		$("#nkCreate").attr("disabled", true);
	}

	function checkNameForm(name) {
		// Check if name is not used
		// Returns True if available
		name = name.toUpperCase();
		for (i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].name.toUpperCase() == name)
				return false;
		return true;
	}

	function checkAbbrForm(name) {
		// Check if abbreviation is not used
		// Returns True if available
		name = name.toUpperCase();
		for (i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].abbreviation.toUpperCase() == name)
				return false;
		return true;
	}

	function newKeymap() {
		var name = "New keymap";
		var abbr = "NEW";
		name = getName(name);
		abbr = getAbbr(abbr);
		createKeymap(name, abbr);

	}

	function getName(name) {
		// Get a valid (not used) name
		var newname = name.toUpperCase();
		for (i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].name.toUpperCase() == newname) {
				var index = name.search(/\(\d+\)$/);
				if (index > 0) {
					var number = parseInt(name.slice(index+1, -1)) + 1;
					name = name.slice(0, index) + "(" + number + ")";
					return getName(name);
				} else {
					return (getName(name + " (2)"));
				}
			}
		return name;
	}

	function getAbbr(name, digits=0) {
		// Check if abbreviation is not used
		// Returns True if available
		var newname = name.toUpperCase();
		for (i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].abbreviation.toUpperCase() == newname) {
				if (digits > 0) {
					var number = parseInt(name.slice(3-digits)) +1;
					name = name.slice(0, 3-(number > 9 ? 2 : 1)) + number;
					return getAbbr(name, (number > 9 ? 2:1));
				} else
					return (getAbbr(name.slice(0,2) + "2", 1));
			}
		return name;
	}

	function createKeymap(aname, abbr) {
		// Create a new blank keymap
		let layer = [{modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}];
		for (i=0; i<layer.length; i++)
			for (j=0; j<2; j++)
				for (k=0; k<35; k++)
					layer[i].modules[j].keyActions.push(null);
		let keymap = {isDefault: false, abbreviation: abbr, name: aname, description: "", layers: layer};
		let index = 0
		let capsname = aname.toUpperCase();
		while (index < jsondata.keymaps.length && jsondata.keymaps[index].name.toUpperCase() < capsname) {
			index++;
		}
		jsondata.keymaps.splice(index, 0, keymap);
		loadKeymaps();
		$('.sidenav a:nth-child('+(+3+index+1)+')').addClass("glow");
		//$('.sidenav a:nth-child('+(+6+index+1)+')').css("background-color", '#FF5');
	}

	function kmNewName() {
		var old = jsondata.keymaps[$('.sideselected').attr("data-index")].name;
		if (old == $('#kmName').val())
			return;
		if ($('#kmName').val().trim().length == 0)
			$('#kmName').val(old).css("width", Math.ceil($('#kmName').textWidth())+18);
		else {
			$('#kmName').val(getName($('#kmName').val())).css("width", Math.ceil($('#kmName').textWidth())+18);
		
			// Now, we have to sort the keymap into the correct position
			old = parseInt($('.sideselected').attr("data-index"));
			let index = 0
			let capsname = $("#kmName").val().toUpperCase();
			while (index < jsondata.keymaps.length && jsondata.keymaps[index].name.toUpperCase() < capsname) {
				index++;
			}
			jsondata.keymaps[old].name = $("#kmName").val();
			if (index != old && index != old+1) {
				console.log("Keymap " + $("#kmName").val() + " move from "+old + " to "+index);
				jsondata.keymaps.splice(index, 0, jsondata.keymaps[old]);
				jsondata.keymaps.splice((old > index) ? old+1 : old, 1);
			}
			if (index > old)
				index--;
			loadKeymaps();
			$('.sidenav a:nth-child('+(+3+index+1)+')').addClass("sideselected");
		}
	}
	
	function kmNewAbbr() {
		var old = jsondata.keymaps[$('.sideselected').attr("data-index")].abbreviation
		if (old == $('#kmAbbr').val())
			return;
		if ($('#kmAbbr').val().trim().length == 0)
			$('#kmAbbr').val(old).css("width", $('#kmAbbr').textWidth()+10);
		else
			$('#kmAbbr').val(getAbbr($('#kmAbbr').val())).css("width", $('#kmAbbr').textWidth()+10);
	}


	/************************************/



	/************************************/
	/*	Copy layers						*/
	/************************************/

	function checkCopyForm() {
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

	function copyChangeForm() {
		$('#cpCopy').attr("disabled", !checkCopyForm());
	}

	function copyLayerForm() {
		if (checkCopyForm()) {
			if ($('#cpLT').val() == "all") {
				for (i=0; i< 4; i++) {
				copyLayer($('#cpKF').val(), i, $('#cpSF').val(), $('#cpKT').val(), i);
				}
			} else {
				copyLayer($('#cpKF').val(), $('#cpLF').val(), $('#cpSF').val(), $('#cpKT').val(), $('#cpLT').val());
			}
			$("#cpInfo").show().delay(2000).hide(0);
		}
	}

	function copyLayer(sourceKeymap, sourceLayer, side, destKeymap, destLayer) {
		if (side != 1)
			jsondata.keymaps[destKeymap].layers[destLayer].modules[0] = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[0];
		if (side != 0)
			jsondata.keymaps[destKeymap].layers[destLayer].modules[1] = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[1];
	}

	function keyCopy() {
		$('#'+$(this).parent().attr("data-side")+'Keymap').val($(".sideselected").attr("data-index"));
		$('#'+$(this).parent().attr("data-side")+'Layer').val($("input[name='layer']:checked").val());
		hideMenu();
	}
	
	function keyPaste() {
		if (($('#'+$(this).parent().attr("data-side")+'Keymap').val() == "") || ($('#'+$(this).parent().attr("data-side")+'Layer').val() == "")) {
			// showError("Copy first, then paste");
			return false;
		}
		var dkeymap = $(".sideselected").attr("data-index");
		var dlayer = $("input[name='layer']:checked").val();
		if (($('#'+$(this).parent().attr("data-side")+'Keymap').val() == dkeymap) && ($('#'+$(this).parent().attr("data-side")+'Layer').val() == dlayer)) {
			console.log("Nothing to copy");
		} else {
			var side = ($(this).parent().attr("data-side") == "left" ? 1 : $(this).parent().attr("data-side") == "right" ? 0 : "Both");
			copyLayer($('#'+$(this).parent().attr("data-side")+'Keymap').val(), $('#'+$(this).parent().attr("data-side")+'Layer').val(), side, dkeymap, dlayer);
			viewKeymap(dkeymap, dlayer);
		}
		hideMenu();
	}
	
	function keyClear() {
		// confirm question
		clearLayer($(".sideselected").attr("data-index"), $("input[name='layer']:checked").val(), ($(this).parent().attr("data-side") == "left" ? 1 : $(this).parent().attr("data-side") == "right" ? 0 : "Both"));
		viewKeymap($(".sideselected").attr("data-index"), $("input[name='layer']:checked").val());
		hideMenu();
	}
	/************************************/



	/************************************/
	/*	Clear layers					*/
	/************************************/

	function clearLayerForm() {
		clearLayer($('#clKeymap').val(), $('#clLayer').val(), $('#clSide').val());
		$("#clInfo").show().delay(2000).hide(0);
	}
	
	function clearLayer(keymap, layer, side) {
		for (i=0; i<36; i++) {
			if (side != 1)
				jsondata.keymaps[keymap].layers[layer].modules[0].keyActions[i] = null;
			if (side != 0)
				jsondata.keymaps[keymap].layers[layer].modules[1].keyActions[i] = null;
		}
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
		$('#newKeymap').show();
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
		$("#sideMenu a").off(); // Remove menu listeners
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
		$("#sideMenu a").click(menuselect); // Create menu listeners
	}

	function changeKeymap(keymap) {
		//$('#keymapTitle').text(jsondata.keymaps[keymap].name + " (" + jsondata.keymaps[keymap].abbreviation + ")");
		$('#kmName').val(jsondata.keymaps[keymap].name);
		$('#kmName').css("width", Math.ceil($('#kmName').textWidth())+18);
		$('#kmAbbr').val(jsondata.keymaps[keymap].abbreviation);
		$('#kmAbbr').css("width", $('#kmAbbr').textWidth()+10);
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

	function showMenu() {
		var screen = $('<div id="lockScreen"/>');
		screen.click(hideMenu);

		var copy = $('<div/>')
			.addClass("copy")
			.append($('<img>')
				.attr('src', 'copy.png')
				.css('width', '100%')
			);

		var paste = $('<div/>')
			.addClass("paste")
			.append($('<img>')
				.attr('src', 'paste.png')
				.css('width', '100%')
			);

		var clear = $('<div/>')
			.addClass("clear")
			.append($('<img>')
				.attr('src', 'remove.png')
				.css('width', '100%')
			);

		var menuL = $('<div id="keyMenu"/>').addClass("keymenu");
		menuL.css("left", '565px');
		menuL.attr("data-side", "left");
		menuL.append(clear.clone());
		menuL.append(copy.clone());
		menuL.append(paste.clone());
		menuL.click(function(e){e.stopPropagation();});
		menuL.hover(glow, noGlow);
		menuL.appendTo(screen);

		/*var menuB = $('<div id="keyMenu"/>').addClass("keymenu");
		menuB.css("left", '815px');
		menuB.attr("data-side", "both");
		menuB.append(clear.clone());
		menuB.append(copy.clone());
		menuB.append(paste.clone());
		menuB.click(function(e){e.stopPropagation();});
		menuB.hover(glow, noGlow);
		menuB.appendTo(screen);*/

		var menuR = $('<div id="keyMenu"/>').addClass("keymenu");
		menuR.css("left", '1065px');
		menuR.attr("data-side", "right");
		menuR.append(clear.clone());
		menuR.append(copy);
		menuR.append(paste);
		menuR.click(function(e){e.stopPropagation();});
		menuR.hover(glow, noGlow);
		menuR.appendTo(screen);

		$("body").append(screen);
		
		$('.clear').click(keyClear);
		$('.copy').click(keyCopy);
		$('.paste').click(keyPaste);
	}

	function hideMenu() {
		$('.copy').off();
		$('.paste').off();
		$('#lockScreen').remove();
		noGlow();
	}
	
	function glow() {
		$('#keyGlow').removeClass("hide");
		if ($(this).attr("data-side") == "left")
			$('#keyGlow').css("background", "linear-gradient(90deg, #FFF2 0%,#FFF2 46%,#000A 52%,#000A 100%)");
		else if ($(this).attr("data-side") == "right")
			$('#keyGlow').css("background", "linear-gradient(90deg, #000A 0%,#000A 44%,#FFF2 50%,#FFF2 100%)");
		else
			$('#keyGlow').css("background", "#FFF2");
	}
	
	function noGlow() {
		$('#keyGlow').addClass("hide");
	}


	/************************************/



	/************************************/
	/*	Macros							*/
	/************************************/
	
	
	function loadMacros() {
		$("#sideMenu a").off();
		while ($('#mm').next().attr('href') !== undefined)
			$('#mm').next().remove();
		items = "";
		for (i=0; i<jsondata.macros.length; i++) {
			items += "<a href=\"#\" data-menu=\"divMacro\" data-index=" + i + ">" + jsondata.macros[i].name + "</a>";
		}
		$('#mm').after(items);
		$("#sideMenu a").click(menuselect);
	}

	function viewMacro(macro) {
		$('#macroTitle').text(jsondata.macros[macro].name);
		while ($('#tmacro tr').length > 0)
			$('#tmacro tr')[0].remove();
		for (i=0; i<jsondata.macros[macro].macroActions.length; i++) {
			action = jsondata.macros[macro].macroActions[i].macroActionType;
			if (action == "text") {
				$('#tmacro').append("<tr><td>Write text</td><td class='macroCommand'>" + KarelSyntax(jsondata.macros[macro].macroActions[i].text) + "</td></tr>");
				//$('#tmacro').append("<tr><td>Write text</td><td class='macroCommand'>" + (jsondata.macros[macro].macroActions[i].text) + "</td></tr>");
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
				$('#tmacro').append("<tr><td>" + action + "</td><td class='macroCommand'>" + value + "</td></tr>")
			} else if (action == "delay") {
				$('#tmacro').append("<tr><td>Delay</td><td class='macroCommand'>" + jsondata.macros[macro].macroActions[i].delay + "</td></tr>")
			} else if (action == "moveMouse") {
				$('#tmacro').append("<tr><td>Move mouse</td><td class='macroCommand'>x:" + jsondata.macros[macro].macroActions[i].x + ", y:"+ jsondata.macros[macro].macroActions[i].y + "</td></tr>")
			} else if (action == "scrollMouse") {
				$('#tmacro').append("<tr><td>Scroll mouse</td><td class='macroCommand'>x:" + jsondata.macros[macro].macroActions[i].x + ", y:"+ jsondata.macros[macro].macroActions[i].y + "</td></tr>")
			} else if (action == "mouseButton") {
				value = "";
				mouse.forEach(function(item, index){if (index & jsondata.macros[macro].macroActions[i].mouseButtonsMask) value += item + " + ";});
				if (value.endsWith(" + "))
					value = value.slice(0, -3);
				$('#tmacro').append("<tr><td>" + capitalize(jsondata.macros[macro].macroActions[i].action) + " button</td><td class='macroCommand'>" + value + "</td></tr>");
			} else
				$('#tmacro').append("<tr><td colspan='2'>" + jsondata.macros[macro].macroActions[i].macroActionType + "</td></tr>");
		}
	}

	function KarelSyntax(text){
		if (text[0] != "$")
			return text;
		text = text.replace(/^(\$(?!if)\w+)/, '<span style="color:blue">$1</span>');
		text = text.replace(/^(\$if\w+)/, '<span style="color:darkviolet">$1</span>');
		text = text.replace(/([#%@][\d\-]+)/, '<span style="color:red;">$1</span>');
		var arr = text.split(" ");
		for (j=1; j<arr.length; j++) {
			if (arr[j][0].match(/[$#%@<]/) != null)
				continue;
			if (KarelMod.indexOf(arr[j]) >= 0)
				text = text.replace(arr[j], '<span style="color:limegreen;">' + arr[j]+ '</span>');
			else if (Karel.indexOf(arr[j]) >= 0)
				text = text.replace(arr[j], '<span style="color:blue;">' + arr[j]+ '</span>');
		}
		return text;
	}


	/************************************/



	/************************************/
	/*	General							*/
	/************************************/


	function capitalize(word) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	}
});
