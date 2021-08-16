
$.fn.textWidth = function(text, font) {
    if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
    $.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
    return $.fn.textWidth.fakeEl.width();
};

var jsondata;
var modules = true; // Enables/disables modules

$( document ).ready(function() {
	$("#cfgUp").change(uploadFile);
	$("#cfgDown").click(downloadFile);

	$("#sideMenu a").click(menuselect);
	$('#newKeymap').click(newKeymap);

	$('#keymapCopy').click(keymapCopy);
	$('#keymapRemove').click(keymapRemove);
	$('#macroCopy').click(macroCopy);
	$('#macroRemove').click(macroRemove);

	$("input[type='radio'").change(changeLayer);

	$('.clear').click(keyClear).hover(glowKeySide, noglowKeySide);
	$('.copy').click(keyCopy).hover(glowKeySide, noglowKeySide);
	$('.paste').click(keyPaste).hover(glowKeySide, noglowKeySide);

	$('#kmName').change(kmNewName);
	$('#kmName').on('input', function(){$(this).css("width", Math.ceil($(this).textWidth())+18)});
	$('#kmAbbr').change(kmNewAbbr);
	$('#kmAbbr').on('input', function() {
		var s=$(this)[0].selectionStart;
		var e=$(this)[0].selectionEnd;
		$(this).val($(this).val().toUpperCase());
		$(this)[0].setSelectionRange(s,e);
		$(this).css("width", $(this).textWidth()+10);
	});

	$('#macName').change(macNewName);
	$('#macName').on('input', function(){$(this).css("width", Math.ceil($(this).textWidth())+18)});

	function showError(text) { // Unused
		$("#txtError").html(text);
		$("#divError").show().delay(1500).hide(0);
	}

	function menuselect() {
		if ($(this).hasClass("sidetitle"))
			return;
		view = $(this).attr("data-menu");

		$(".element").addClass("hide");
		$('.sideselected').removeClass('sideselected');
		$(this).addClass('sideselected');
		$("#" + view).removeClass("hide");
		if (view == "divKeymap") {
			$('#layer0').prop('checked', true);
			changeKeymap($(this).attr("data-index"));
		} else if (view == "divMacro") {
			viewMacro($(this).attr("data-index"));
		}
	}

	/************************************/



	/************************************/
	/*	CREATE NEW KEYMAP				*/
	/************************************/

	function newKeymap() {
		let a = getName("New keymap");
		let b = getAbbr("NEW");
		createKeymap(a, b);
		let keymapID = 0;
		while (jsondata.keymaps[keymapID].name != a && jsondata.keymaps[keymapID].abbreviation != b)
			keymapID++;
		$('.sidenav a:nth-child('+(4+keymapID)+')').trigger('click');
	}

	function createKeymap(aname, abbr) {
		// Create a new blank keymap
		let layer;
		if (modules)
			layer = [{modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}, {id: 4, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}, {id: 4, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}, {id: 4, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}, {id: 4, keyActions: []}]}];
		else
			layer = [{modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}]}];
		for (i=0; i<layer.length; i++)
			for (j=0; j<2; j++)
				for (k=0; k<35; k++)
					layer[i].modules[j].keyActions.push(null);
		if (modules)
			for (i=0; i<layer.length; i++) {
				for (k=0; k<6; k++)
						layer[i].modules[2].keyActions.push(null);
				for (k=0; k<2; k++)
						layer[i].modules[3].keyActions.push(null);
			}
		let keymap = {isDefault: false, abbreviation: abbr, name: aname, description: "", layers: layer};
		let index = 0;
		
		while (index < jsondata.keymaps.length && jsondata.keymaps[index].name.toUpperCase() < aname) {
			index++;
		}
		jsondata.keymaps.splice(index, 0, keymap);
		loadKeymaps();
		$('.sidenav a:nth-child('+(3+index+1)+')').addClass("glow");
		updateTrashKeymap();
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
		// Get a valid (not used) abbreviation
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

	function kmNewName() {
		// Place keymap on the correct position (alphabetically).
		// Sets correct width for name field

		var old = jsondata.keymaps[$('.sideselected').attr("data-index")].name;
		var newName = $('#kmName').val();
		if (old == newName)
			return;

		for (i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].name == newName) {
				$('#kmName').val(old);
				return;
			}

		if (newName.trim().length == 0)
			$('#kmName').val(old).css("width", Math.ceil($('#kmName').textWidth())+18);
		else {
			$('#kmName').val(getName($('#kmName').val())).css("width", Math.ceil($('#kmName').textWidth())+18);

			// Now, we have to sort the keymap into the correct position
			old = parseInt($('.sideselected').attr("data-index"));
			let index = 0
			let capsname = $("#kmName").val();
			while (index < jsondata.keymaps.length && jsondata.keymaps[index].name.toUpperCase() < capsname) {
				index++;
			}
			jsondata.keymaps[old].name = $("#kmName").val();
			if (index != old && index != old+1) {
				jsondata.keymaps.splice(index, 0, jsondata.keymaps[old]);
				jsondata.keymaps.splice((old > index) ? old+1 : old, 1);
			}
			if (index > old)
				index--;
			loadKeymaps();
			$('.sidenav a:nth-child('+(3+index+1)+')').addClass("sideselected");
		}
	}

	function kmNewAbbr() {
		// Sets correct width for abbreviation field
		var old = jsondata.keymaps[$('.sideselected').attr("data-index")].abbreviation
		if (old == $('#kmAbbr').val())
			return;
		if ($('#kmAbbr').val().trim().length == 0)
			$('#kmAbbr').val(old).css("width", $('#kmAbbr').textWidth()+10);
		else
			$('#kmAbbr').val(getAbbr($('#kmAbbr').val())).css("width", $('#kmAbbr').textWidth()+10);
		jsondata.keymaps[$('.sideselected').attr("data-index")].abbreviation = $('#kmAbbr').val();
	}


	/************************************/



	/************************************/
	/*	Copy/Paste layers				*/
	/************************************/

	function keyCopy() {
		$('#copy'+$(this).parent().attr("data-side")+'Keymap').val($(".sideselected").attr("data-index"));
		$('#copy'+$(this).parent().attr("data-side")+'Layer').val($("input[name='layer']:checked").val());

		$("#clip"+$(this).parent().attr("data-side")+"K").text(jsondata.keymaps[$(".sideselected").attr("data-index")].abbreviation);
		$("#clip"+$(this).parent().attr("data-side")+"L").text(layers[$("input[name='layer']:checked").val()]);
		
		$('#clipleftK, #clipleftL, #cliprightK, #cliprightL').removeClass("blink");
	}

	function keyPaste() {
		if (($('#copy'+$(this).parent().attr("data-side")+'Keymap').val() == "") || ($('#copy'+$(this).parent().attr("data-side")+'Layer').val() == "")) {
			// showError("Copy first, then paste");
			return false;
		}
		var dkeymap = $(".sideselected").attr("data-index");
		var dlayer = $("input[name='layer']:checked").val();
		if (($('#copy'+$(this).parent().attr("data-side")+'Keymap').val() == dkeymap) && ($('#copy'+$(this).parent().attr("data-side")+'Layer').val() == dlayer)) {
			console.log("Nothing to copy");
		} else {
			var side = ($(this).parent().attr("data-side") == "left" ? 1 : $(this).parent().attr("data-side") == "right" ? 0 : "Both");
			copyLayer($('#copy'+$(this).parent().attr("data-side")+'Keymap').val(), $('#copy'+$(this).parent().attr("data-side")+'Layer').val(), side, dkeymap, dlayer);
			viewKeymap(dkeymap, dlayer);
		}
	}

	function copyLayer(sourceKeymap, sourceLayer, side, destKeymap, destLayer) {
		if (side != 1) {
			jsondata.keymaps[destKeymap].layers[destLayer].modules[0].id = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[0].id;
			jsondata.keymaps[destKeymap].layers[destLayer].modules[0].keyActions = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[0].keyActions.slice();
			if (modules) {
				//jsondata.keymaps[destKeymap].layers[destLayer].modules[3] = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[3];
				jsondata.keymaps[destKeymap].layers[destLayer].modules[3].id = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[3].id;
				jsondata.keymaps[destKeymap].layers[destLayer].modules[3].keyActions = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[3].keyActions.slice();
			}
		}
		if (side != 0) {
			jsondata.keymaps[destKeymap].layers[destLayer].modules[1].id = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[1].id;
			jsondata.keymaps[destKeymap].layers[destLayer].modules[1].keyActions = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[1].keyActions.slice();
			if (modules) {
				jsondata.keymaps[destKeymap].layers[destLayer].modules[2].id = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[2].id;
				jsondata.keymaps[destKeymap].layers[destLayer].modules[2].keyActions = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[2].keyActions.slice();

			}
		}
	}

	/************************************/



	/************************************/
	/*	Clear layers					*/
	/************************************/

	function keyClear() {
		clearLayer($(".sideselected").attr("data-index"), $("input[name='layer']:checked").val(), ($(this).parent().attr("data-side") == "left" ? 1 : $(this).parent().attr("data-side") == "right" ? 0 : "Both"));
		viewKeymap($(".sideselected").attr("data-index"), $("input[name='layer']:checked").val());
	}

	function clearLayer(keymap, layer, side) {
		console.log("Clear layer from: "+ jsondata.keymaps[keymap].name + ", layer: " + layer + ", side: "+side);
		for (i=0; i<36; i++) {
			if (side != 1)
				jsondata.keymaps[keymap].layers[layer].modules[0].keyActions[i] = null;
			if (side != 0)
				jsondata.keymaps[keymap].layers[layer].modules[1].keyActions[i] = null;
		}
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
			modules = (jsondata.keymaps[0].layers[0].modules.length == 4) ? true : false;
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
	/*	Keymaps. Basic functions		*/
	/************************************/

	function loadKeymaps() {
		// Load keymaps on side menu
		$("#sideMenu a").off(); // Remove menu listeners
		while ($('#mk').next().attr('id') != "mm") // Remove all keyboard from menu
			$('#mk').next().remove();

		items = "";
		for (i=0; i<jsondata.keymaps.length; i++) {
			items += "<a href=\"#\" data-menu=\"divKeymap\" data-index=\"" + i + "\">" + jsondata.keymaps[i].name + ((jsondata.keymaps[i].isDefault == true) ? " * " : "") + "</a>";
		}
		$('#mk').after(items);
		$("#sideMenu a").click(menuselect); // Create menu listeners

		// Clean old status
		$("#clipleftK").text("");
		$("#clipleftL").text("");
		$("#cliprightK").text("");
		$("#cliprightL").text("");
		$("#copyleftKeymap").val("");
		$("#copyleftLayer").val("");
		$("#copyrightKeymap").val("");
		$("#copyrightLayer").val("");
	}

	function changeKeymap(keymap) {
		// Display selected keymap from sidemenu
		$('#kmName').val(jsondata.keymaps[keymap].name);
		$('#kmName').css("width", Math.ceil($('#kmName').textWidth())+18);
		$('#kmAbbr').val(jsondata.keymaps[keymap].abbreviation);
		$('#kmAbbr').css("width", $('#kmAbbr').textWidth()+10);
		viewKeymap(keymap);
	}

	function changeLayer() {
		viewKeymap($(".sideselected").attr("data-index"), $(this).val());
	}

	function viewKeymap(keymap, layer=0) {
		// Fill keyboard with the correct keymap and layer

		for (i=0; i<35; i++) {
			key = jsondata.keymaps[keymap].layers[layer].modules[0].keyActions[i];
			if (key == null)
				$('#rKey'+i).text("");
			else
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
				else if (key.keyActionType == "none")
					$('#rKey'+i).text("");
				else
					$('#rKey'+i).text("?");

			key = jsondata.keymaps[keymap].layers[layer].modules[1].keyActions[i];
			if (key == null)
				$('#lKey'+i).text("");
			else
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
				else if (key.keyActionType == "mouse")
					$('#lKey'+i).text(key.mouseAction);
				else if (key.keyActionType == "playMacro")
					$('#lKey'+i).text(jsondata.macros[key.macroIndex].name);
				else if (key.keyActionType == "none")
					$('#lKey'+i).text("");
				else
					$('#lKey'+i).text("?");
		}
	}

	function glowKeySide() {
		$('#keyboardGlow').removeClass("hide");
		//if ($(this).attr("data-side") == "left")
		if ($(this).parent().attr("data-side") == "left") {
			$('#keyboardGlow').css("background", "linear-gradient(90deg, #FFF2 0%,#FFF2 39%,#000A 52%,#000A 100%)");
			if ($(this).hasClass("clear")) {
				$('#clipleftK, #clipleftL').css('opacity', '0');
			} else if ($(this).hasClass("copy")) {
				$('#clipleftK, #clipleftL').addClass("blink");
			}
		}
		//else if ($(this).attr("data-side") == "right")
		else if ($(this).parent().attr("data-side") == "right") {
			$('#keyboardGlow').css("background", "linear-gradient(90deg, #000A 0%,#000A 44%,#FFF2 55%,#FFF2 100%)");
			if ($(this).hasClass("clear")) {
				$('#cliprightK, #cliprightL').css('opacity', '0');
			} else if ($(this).hasClass("copy")) {
				$('#cliprightK, #cliprightL').addClass("blink");
			}
		}
		else
			$('#keyboardGlow').css("background", "#FFF2"); // Not used
	}

	function noglowKeySide() {
		$('#keyboardGlow').addClass("hide");
		$('#clipleftK, #clipleftL, #cliprightK, #cliprightL').css('opacity', '1');
		$('#clipleftK, #clipleftL, #cliprightK, #cliprightL').removeClass("blink");
	}

	/************************************/


	/************************************/
	/*	Keymaps. Copy and remove		*/
	/************************************/

	function keymapCopy() {
		let keymapsourceid=$(".sideselected").attr("data-index");
		keymapName = getName(jsondata.keymaps[keymapsourceid].name);
		keymapAbbr = getAbbr(jsondata.keymaps[keymapsourceid].abbreviation);
		createKeymap(keymapName, keymapAbbr);

		// Search new keymap
		let keymapdestid = 0;
		while (jsondata.keymaps[keymapdestid].name != keymapName && jsondata.keymaps[keymapdestid].abbreviation != keymapAbbr)
			keymapdestid++;

		// Copy layers
		for (i=0; i<layers.length; i++) {
			copyLayer(keymapsourceid, i, 2, keymapdestid, i);
		}

		$('.sidenav a:nth-child('+(4+keymapdestid)+')').trigger('click');
	}

	function keymapRemove() {
		if (jsondata.keymaps.length > 1) { // You can't remove last keymap
			let keymapID = $(".sideselected").attr("data-index");
			keymapRemoveConfirm(keymapID);
		} else
			removeLockscreen();
	}

	function keymapRemoveConfirm(id) {
		var screen = $('<div id="lockScreen"/>');
		screen.click(removeLockscreen);

		var question = "<div id='confirmText'><span>Do you want to remove keymap " + jsondata.keymaps[id].name + " (" + jsondata.keymaps[id].abbreviation + ") ?</span><br><br><span>It cannot be undone</span></div>";
		var input1 = $('<input type="button" value="YES">');
		input1.on("click", keymapRemoveYES);
		var input2 = $('<input type="button" value="NO">');
		input2.on("click", removeLockscreen);
		var buttons = $("<div id='confirmButtons' />");
		buttons.append(input1);
		buttons.append(input2);

		var box = $('<div id="box"/>');
		box.css("margin", 'auto');
		box.append(question);
		box.append(buttons);
		box.appendTo(screen);
		box.click(function() {event.stopPropagation()});

		$("body").append(screen);
	}

	function keymapRemoveYES() {
		let id = $(".sideselected").attr("data-index");
		if (jsondata.keymaps[id].isDefault==true)
			jsondata.keymaps[(id == 0) ? 1 : 0].isDefault = true;
		jsondata.keymaps.splice(id, 1);
		loadKeymaps();
		$('.sidenav a:nth-child('+4+')').trigger("click");
		updateTrashKeymap();
		removeLockscreen();
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
		//$('#macroTitle').text(jsondata.macros[macro].name);
		$('#macName').val(jsondata.macros[macro].name);
		while ($('#tmacro tr').length > 0)
			$('#tmacro tr')[0].remove();
		var mergedUntil = -1;
		for (i=0; i<jsondata.macros[macro].macroActions.length; i++) {
			action = jsondata.macros[macro].macroActions[i].macroActionType;
			if (action == "text") {
				//$('#tmacro').append("<tr><td>Write text</td><td class='macroCommand'>" + jsondata.macros[macro].macroActions[i].text + "</td></tr>");
				$('#tmacro').append("<tr><td>Write text</td><td class='macroCommand'>" + jsondata.macros[macro].macroActions[i].text + "</td><td><img class='editMacro' name='editMacro' src='edit.png'></td></tr>");

			} else if (action == "key") {
				action = capitalize(jsondata.macros[macro].macroActions[i].action) + " key";
				value = "";
				if (jsondata.macros[macro].macroActions[i].modifierMask) {
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
		$('.editMacro').click(editMacro);
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

	function editMacro(){
		var screen = $('<div id="lockScreen"/>');

		let v1 = $(this).parent().parent().index();
		let v2 = v1;

		// Search first and last line to edit (macro mode)
		if (jsondata.macros[$(".sideselected").attr("data-index")].macroActions[v1].text[0] == '$') {
			while (v1 >= 0) {
				if (jsondata.macros[$(".sideselected").attr("data-index")].macroActions[v1].macroActionType == 'text' && jsondata.macros[$(".sideselected").attr("data-index")].macroActions[v1].text[0] == '$')
					v1--;
				else
					break;
			}
			while (v2 < jsondata.macros[$(".sideselected").attr("data-index")].macroActions.length) {
				if (jsondata.macros[$(".sideselected").attr("data-index")].macroActions[v2].macroActionType == 'text' && jsondata.macros[$(".sideselected").attr("data-index")].macroActions[v2].text[0] == '$')
					v2++;
				else
					break;
			}
			console.log("END");
			v1++;
			v2--;
		}

		var question = "<div id='confirmText'><textarea id='txt'>"
		for (i=v1; i <= v2; i++) {
			question += jsondata.macros[$(".sideselected").attr("data-index")].macroActions[i].text + "\n";
		}
		question = question.slice(0,-1);
		question += "</textarea></div>";
		var input1 = $('<input type="button" value="SAVE">');
		input1.on("click", editMacroSave);
		var input2 = $('<input type="button" value="CANCEL">');
		input2.on("click", removeLockscreen);
		var buttons = $("<div id='confirmButtons' />");
		buttons.append("<label><input id='chkSplit' type='checkbox'" + ((v1 != v2) ? "checked" : "") + ">Macro mode (each line will be splitted in different entries)</label><br>");
		buttons.append(input1);
		buttons.append(input2);
		buttons.append("<input type='text' class='hide' id='line1' value='" + v1 + "'><input type='text' class='hide' id='line2' value='" + v2 + "'>");


		var box = $('<div id="box"/>');
		box.css("margin", 'auto');
		box.append(question);
		box.append(buttons);
		box.appendTo(screen);

		$("body").append(screen);

		$("#lockScreen").append($('.keyboard')[0].cloneNode(true));
		$("#lockScreen .keyboard").addClass("minikb").removeClass("keyboard");
		while ($(".minikb").children().length > 69) {
			$(".minikb").children()[69].remove();
		}
		$(".minikb .key").addClass("minikey");
		$(".minikb .key").removeClass("key");
		//$(".minikb .key").addClass("minikey").removeClass("key");
		$(".minikb .key").text("");
		for (i=0; i<keyboard_en.length; i++)
			$(".minikey:eq("+i+")").text(keyboard_en[i]);
	}
	
	function editMacroSave() {
		let v1 = parseInt($('#line1').val());
		let v2 = parseInt($('#line2').val());

		jsondata.macros[$(".sideselected").attr("data-index")].macroActions.splice(v1, v2-v1+1);
		if ($('#chkSplit').prop('checked')) {
			let arr = $("#txt").val().split("\n");
			for (i = 0; i < arr.length; i++) {
				jsondata.macros[$(".sideselected").attr("data-index")].macroActions.splice((i+v1), 0, {macroActionType: "text", text: arr[i]});
			}
		}
		else
			jsondata.macros[$(".sideselected").attr("data-index")].macroActions.splice(v1, 0, {macroActionType: "text", text: $("#txt").val()});
		removeLockscreen();
		viewMacro($(".sideselected").attr("data-index"));
	}

	/************************************/


	/************************************/
	/*	Macros. Copy and remove		*/
	/************************************/

	function newMacro() {
		let a = getMName("New macro");
		createMacro(a);
		let macroID = 0;
		while (jsondata.macros[macroID].name != a)
			macroID++;
		$('.sidenav a:nth-child('+(1+$('#mm').index()+macroID)+')').trigger('click');
	}

	function createMacro(aname) {
		// Create a new blank keymap
		let macro;
		macro = {isLooped: false, isPrivate: true, name: aname, macroActions: []};

		let index = 0
		while (index < jsondata.macros.length && firstSortedWord(jsondata.macros[index].name, aname)) {
			index++;
		}
		jsondata.macros.splice(index, 0, macro);
		loadMacros();
		$('.sidenav a:nth-child('+(3+index+1)+')').addClass("glow");
	}

	function getMName(name) {
		// Get a valid (not used) name
		var newname = name.toUpperCase();
		for (i=0; i<jsondata.macros.length; i++)
			if (jsondata.macros[i].name.toUpperCase() == newname) {
				var index = name.search(/\(\d+\)$/);
				if (index > 0) {
					var number = parseInt(name.slice(index+1, -1)) + 1;
					name = name.slice(0, index) + "(" + number + ")";
					return getMName(name);
				} else {
					return (getMName(name + " (2)"));
				}
			}
		return name;
	}

	function macNewName() {
		// Place macro on the correct position (alphabetically).
		// Sets correct width for name field

		var old = jsondata.macros[$('.sideselected').attr("data-index")].name;
		var newName = $('#macName').val();
		if (old == $('#macName').val())
			return;

		for (i=0; i<jsondata.macros.length; i++)
			if (jsondata.macros[i].name == newName) {
				$('#macName').val(old);
				return;
			}

		if ($('#macName').val().trim().length == 0)
			$('#macName').val(old).css("width", Math.ceil($('#kmName').textWidth())+18);
		else {
			$('#macName').val(getName($('#macName').val())).css("width", Math.ceil($('#macName').textWidth())+18);

			// Now, we have to sort the keymap into the correct position
			old = parseInt($('.sideselected').attr("data-index"));
			let index = 0
			while (index < jsondata.macros.length && firstSortedWord(jsondata.macros[index].name, $("#macName").val())) {
				index++;
			}
			jsondata.macros[old].name = $("#macName").val();
			if (index != old && index != old+1) {
				jsondata.macros.splice(index, 0, jsondata.macros[old]);
				jsondata.macros.splice((old > index) ? old+1 : old, 1);
			}
			if (index > old)
				index--;
			loadMacros();
			$('.sidenav a:nth-child('+($('#mm').index()+index+2)+')').addClass("sideselected");
		}
	}

	function macroCopy() {
		let macroSourceID=$(".sideselected").attr("data-index");
		macroName = getMName(jsondata.macros[macroSourceID].name);
		createMacro(macroName);

		// Search new keymap
		let macroDestID = 0;
		while (jsondata.macros[macroDestID].name != macroName)
			macroDestID++;

		// Copy layers
		jsondata.macros[macroDestID].macroActions = jsondata.macros[macroSourceID].macroActions.slice();

		$('.sidenav a:nth-child('+($('#mm').index()+2+macroDestID)+')').trigger('click');
	}

	function macroRemove() {
		let macroID = $(".sideselected").attr("data-index");
		macroRemoveConfirm(macroID);
	}

	function macroRemoveConfirm(id) {
		var screen = $('<div id="lockScreen"/>');
		screen.click(removeLockscreen);

		var question = "<div id='confirmText'><span>Do you want to remove macro " + jsondata.macros[id].name + "?</span><br><br><span>It cannot be undone</span></div>";
		var input1 = $('<input type="button" value="YES">');
		input1.on("click", macroRemoveYES);
		var input2 = $('<input type="button" value="NO">');
		input2.on("click", removeLockscreen);
		var buttons = $("<div id='confirmButtons' />");
		buttons.append(input1);
		buttons.append(input2);

		var box = $('<div id="box"/>');
		box.css("margin", 'auto');
		box.append(question);
		box.append(buttons);
		box.appendTo(screen);
		box.click(function() {event.stopPropagation()});

		$("body").append(screen);
	}

	function macroRemoveYES() {
		let id = $(".sideselected").attr("data-index");
		jsondata.macros.splice(id, 1);
		loadMacros();
		if (jsondata.macros.length > 0)
			$('#mm').next().trigger("click");
		else
			$(".element").addClass("hide");
		removeLockscreen();
	}

	/************************************/



	/************************************/
	/*	General							*/
	/************************************/


	function capitalize(word) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	}
	
	function updateTrashKeymap() {
		// Hides the trash icon when there is only 1 keymap left (you can't remove the last one)
		if (jsondata.keymaps.length > 1)
			$('#keymapRemove').show();
		else
			$('#keymapRemove').hide();
	}

	function removeLockscreen() {
		$('#lockScreen').remove();
	}

	function firstSortedWord(word1, word2) {
		/*	Custom sort method for macro names.
			Returns if word1 is sorted first (true) or not
			according to the next order: symbols, numbers, lowercase and uppercase.
		*/
		let len = Math.min(word1.length, word2.length);
		for (i=0; i< len; i++) {
			if (word1[i].toUpperCase() != word2[i].toUpperCase()) {
				let group1 = getGroup(word1[i]);
				let group2 = getGroup(word2[i]);

				if (group1 < group2)
					return true;

				if (group2 < group1)
					return false;

				if (word1[i].toUpperCase() < word2[i].toUpperCase())
					return true;
				if (word1[i].toUpperCase() > word2[i].toUpperCase())
					return false;
			}
		}

		if (word1.toUpperCase() == word2.toUpperCase())
			return (word1 > word2);
		return (word1.length < word2.length);
	}

	function getGroup(letter) {
		// Input: letter
		// Output:	1 if symbol
		//			2 if number
		//			3 letter
		if (letter.match(/[a-zA-Z]/)) return 3;
		if (letter.match(/[0-9]/)) return 2;
		return 1;
	}
});
