
$.fn.textWidth = function(text, font) {
	if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
	$.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font')).css('font-size', this.css('font-size')).css('font-weight', this.css('font-weight'));
	return $.fn.textWidth.fakeEl.width();
};

var jsondata;
var jsonhash;
var mergedata;

$( document ).ready(function() {
	$("#sideMenu a").click(menuselect);
	$('#addKeymap').click(addKeymap);
	$('#addMacro').click(addMacro);

	$("#cfgUp").change(uploadFile);
	$("#cfgDown").click(downloadFile);

	$("#mergeFile").change(uploadMergeFile);
	$("#mergeKeymap").on('change', function(){$("#divMergeKeymaps input").prop("checked", $("#mergeKeymap").prop("checked"))});
	$("#mergeMacro").on('change', function(){$("#divMergeMacros input").prop("checked", $("#mergeMacro").prop("checked"))});
	$('#mergeRun').click(merge);

	$('#keymapCopy').click(keymapCopy);
	$('#macroCopy').click(macroCopy);
	$('#macroRemove').click(macroRemove);
	$('.add-line_btn').click(macro_add_line);

	$("input[type='radio'").change(changeLayer);

	$('.clear').click(keyClear).hover(glowKeySide, noglowKeySide);
	$('.copy').click(keyCopy).hover(glowKeySide, noglowKeySide);
	$('.paste').click(keyPaste).hover(glowKeySide, noglowKeySide);

	$('#kmName').change(kmNewName);
	$('#kmName').on('input', function(){$(this).css("width", Math.ceil($(this).textWidth())+18)});
	$('#kmAbbr').change(kmNewAbbr);
	$('#kmAbbr').on('input', function() {
		let s=$(this)[0].selectionStart;
		let e=$(this)[0].selectionEnd;
		$(this).val($(this).val().toUpperCase());
		$(this)[0].setSelectionRange(s,e);
		$(this).css("width", $(this).textWidth()+10);
	});

	$('#macName').change(macroRename);
	$('#macName').on('input', function(){$(this).css("width", Math.ceil($(this).textWidth())+18)});

	$('#macroSave').click(editMacroSave);
	$('#macroCancel').click(editMacroCancel);
	var $dragging = null;
	$('#divEditor').on("mousedown", "div", function (e) {
		$dragging = $(e.target);
	});

	$('#divEditor').on("mouseup", function (e) {
		$dragging = null;
	});
	$('#divEditor').on("mousemove", function(e) {
		if ($dragging) {
			$dragging.offset({
				top: e.pageY,
				left: e.pageX
			});
		}
	});
	$('#box').children().on("mousedown", function() {event.stopPropagation()});
	$('.minikb').children().on("mousedown", function() {event.stopPropagation()});
	$('.minikey').hover(keyHover).mouseleave(keyRelease).click(keyClick);

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
	/*	KEYMAPS. Basic functions		*/
	/************************************/

	function loadKeymaps() {
		// Load keymaps on side menu
		$("#sideMenu a").off(); // Remove menu listeners
		while ($('#mk').next().attr('id') != "mm") // Remove all keyboard from menu
			$('#mk').next().remove();

		items = "";
		for (let i=0; i<jsondata.keymaps.length; i++) {
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
		updateTrashKeymap();
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

		for (let i=0; i<35; i++) {
			key = jsondata.keymaps[keymap].layers[layer].modules[0].keyActions[i];
			if (key == null)
				$('#rKey'+i).text("");
			else
				if (key.scancode) {
					$('#rKey'+i).text(scancode[key.scancode]);
					if (key.modifierMask) {
	 					value = ""
	 					for (let j=0; j<4; j++)
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
	 					for (let j=0; j<4; j++)
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
	/*	KEYMAPS. Basic functions		*/
	/************************************/

	function addKeymap() {
		let a = createName("New keymap");
		let b = createAbbr("NEW");
		createKeymap(a, b);
		let keymapID = 0;
		while (jsondata.keymaps[keymapID].name != a && jsondata.keymaps[keymapID].abbreviation != b)
			keymapID++;
		$('.sidenav a:nth-child('+(1+$('#mk').index()+keymapID+1)+')').trigger('click');
	}

	function createKeymap(aname, abbr, glow=true) {
		// Create a new blank keymap
		let layer = [{modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}, {id: 4, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}, {id: 4, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}, {id: 4, keyActions: []}]}, {modules: [{id: 0, keyActions: []}, {id: 1, keyActions: []}, {id: 2, keyActions: []}, {id: 4, keyActions: []}]}];
		for (let i=0; i<layer.length; i++)
			for (let j=0; j<2; j++)
				for (let k=0; k<35; k++)
					layer[i].modules[j].keyActions.push(null);
		for (let i=0; i<layer.length; i++) {
			for (let k=0; k<6; k++)
					layer[i].modules[2].keyActions.push(null);
			for (let k=0; k<2; k++)
					layer[i].modules[3].keyActions.push(null);
		}
		let keymap = {isDefault: false, abbreviation: abbr, name: aname, description: "Blank keymap created with UHK Tools", layers: layer};
		let index = 0;

		// Search position for the new keymap
		while (index < jsondata.keymaps.length && jsondata.keymaps[index].name.toUpperCase() < aname.toUpperCase()) {
			index++;
		}
		jsondata.keymaps.splice(index, 0, keymap);
		loadKeymaps();
		if (glow)
			$('.sidenav a:nth-child('+(1+$('#mk').index()+index+1)+')').addClass("glow");
	}

	function createName(name) {
		// Get a valid (not used) name
		let newname = name.toUpperCase();
		for (let i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].name.toUpperCase() == newname) {
				let index = name.search(/\(\d+\)$/);
				if (index > 0) {
					let number = parseInt(name.slice(index+1, -1)) + 1;
					name = name.slice(0, index) + "(" + number + ")";
					return createName(name);
				} else {
					return (createName(name + " (2)"));
				}
			}
		return name;
	}

	function createAbbr(name, digits=0) {
		// Get a valid (not used) abbreviation
		let newname = name.toUpperCase();
		for (let i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].abbreviation.toUpperCase() == newname) {
				if (digits > 0) {
					let number = parseInt(name.slice(3-digits)) +1;
					name = name.slice(0, 3-(number > 9 ? 2 : 1)) + number;
					return createAbbr(name, (number > 9 ? 2:1));
				} else
					return (createAbbr(name.slice(0,2) + "2", 1));
			}
		return name;
	}

	function kmNewName() {
		// Rename keymap if possible
		// Place keymap on the correct position (alphabetically).
		// Sets correct width for name field

		let old = jsondata.keymaps[$('.sideselected').attr("data-index")].name;
		let newName = $('#kmName').val();
		if (old == newName)
			return;

		for (let i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].name == newName) {
				$('#kmName').val(old);
				return;
			}

		if (newName.trim().length == 0)
			$('#kmName').val(old).css("width", Math.ceil($('#kmName').textWidth())+18);
		else {
			$('#kmName').val(createName($('#kmName').val())).css("width", Math.ceil($('#kmName').textWidth())+18);

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
			$('.sidenav a:nth-child('+(1+$('#mk').index()+index+1)+')').addClass("sideselected");
		}
	}

	function kmNewAbbr() {
		// Change abreviation for keymap if possible
		// Sets correct width for abbreviation field
		let old = jsondata.keymaps[$('.sideselected').attr("data-index")].abbreviation;
		if (old == $('#kmAbbr').val())
			return;
		if ($('#kmAbbr').val().trim().length == 0)
			$('#kmAbbr').val(old).css("width", $('#kmAbbr').textWidth()+10);
		else {
			let name = createAbbr($('#kmAbbr').val());
			$('#kmAbbr').val(name).css("width", $('#kmAbbr').textWidth()+10);
			jsondata.keymaps[$('.sideselected').attr("data-index")].abbreviation = $('#kmAbbr').val();

			// Update in every layer for keymap changes (fix the call)
			for (let i=0; i<jsondata.keymaps.length; i++)
				for (let j=0; j< jsondata.keymaps[i].layers.length; j++)
					for (let k=0; k<jsondata.keymaps[i].layers[j].modules.length; k++)
						for (let l=0; l<jsondata.keymaps[i].layers[j].modules[k].keyActions.length; l++)
							if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l]) //can be null
								if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keyActionType == "switchKeymap")
									if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keymapAbbreviation == old)
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keymapAbbreviation = name;

			// Replace macro appeareances
			let re1 = new RegExp("^(\\$.*switchKeymap )" + escapeName(old) + "(.*)$");
			let re2 = new RegExp("^(\\$.*(toggleKeymapLayer|holdKeymapLayer|holdKeymapLayerMax|switchKeymapLayer) )" + escapeName(old) + "( (fn|base|mouse|mod).*)$");
			for (let i=0; i<jsondata.macros.length; i++)
				for(j=0; j<jsondata.macros[i].macroActions.length; j++)
					if (jsondata.macros[i].macroActions[j].macroActionType == "text")
						if (jsondata.macros[i].macroActions[j].text[0] == "$")
							jsondata.macros[i].macroActions[j].text = jsondata.macros[i].macroActions[j].text.replace(re1, "$1"+name+"$2").replace(re2, "$1 "+ name + " $3");

			// Edit clipboard
			if ($("#copyrightKeymap").val() != "")
				if (jsondata.keymaps[$("#copyrightKeymap").val()].abbreviation == name)
						$("#cliprightK").text(name);
			if ($("#copyleftKeymap").val() != "")
				if (jsondata.keymaps[$("#copyleftKeymap").val()].abbreviation == name)
						$("#clipleftK").text(name);

		}
	}

	function keymapCopy() {
		let keymapsourceid=$(".sideselected").attr("data-index");
		keymapName = createName(jsondata.keymaps[keymapsourceid].name);
		keymapAbbr = createAbbr(jsondata.keymaps[keymapsourceid].abbreviation);
		createKeymap(keymapName, keymapAbbr);

		// Search new keymap
		let keymapdestid = 0;
		while (jsondata.keymaps[keymapdestid].name != keymapName && jsondata.keymaps[keymapdestid].abbreviation != keymapAbbr)
			keymapdestid++;

		// Copy layers
		for (let i=0; i<layers.length; i++) {
			layerCopy(keymapsourceid, i, 2, keymapdestid, i);
		}

		$('.sidenav a:nth-child('+(1+$('#mk').index()+keymapdestid+1)+')').trigger('click');
	}

	function keymapRemove() {
		if (jsondata.keymaps.length > 1) { // You can't remove last keymap
			let keymapID = $(".sideselected").attr("data-index");
			let keymapAbbr = jsondata.keymaps[keymapID].abbreviation;
			//keymapRemoveConfirm(keymapID);
			if (jsondata.keymaps[keymapID].isDefault==true)
				jsondata.keymaps[(keymapID == 0) ? 1 : 0].isDefault = true;
			jsondata.keymaps.splice(keymapID, 1);

			for (let i=0; i<jsondata.keymaps.length; i++)
				for (let j=0; j< jsondata.keymaps[i].layers.length; j++)
					for (let k=0; k<jsondata.keymaps[i].layers[j].modules.length; k++)
						for (let l=0; l<jsondata.keymaps[i].layers[j].modules[k].keyActions.length; l++)
							if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l]) //can be null
								if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keyActionType == "switchKeymap")
									if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keymapAbbreviation == keymapAbbr)
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l]= null;

			let re1 = new RegExp("^(.*switchKeymap " + escapeName(keymapAbbr) + ".*)$");
			let re2 = new RegExp("^(.*(toggleKeymapLayer|holdKeymapLayer|holdKeymapLayerMax|switchKeymapLayer) " + escapeName(keymapAbbr) + " (fn|base|mouse|mod).*)$");
			for (let i=0; i<jsondata.macros.length; i++)
				for (let j=0; j<jsondata.macros[i].macroActions.length; j++)
					if (jsondata.macros[i].macroActions[j].macroActionType == "text")
						if (jsondata.macros[i].macroActions[j].text.search(escapeName(keymapAbbr)) > 0)
							if (jsondata.macros[i].macroActions[j].text[0] == "$")
								jsondata.macros[i].macroActions[j].text = jsondata.macros[i].macroActions[j].text.replace(re1, "# $1").replace(re2, "# $1");

			loadKeymaps();
			$('.sidenav a:nth-child('+(1+$('#mk').index()+1+getDefaultKeymap())+')').trigger("click");
		}
	}

	function getDefaultKeymap() {
		for (let i=0; i<jsondata.keymaps.length; i++)
			if (jsondata.keymaps[i].isDefault)
				return i;
	}

	/************************************/



	/************************************/
	/*	LAYERS: Copy/Paste/Clear		*/
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
		let dkeymap = $(".sideselected").attr("data-index");
		let dlayer = $("input[name='layer']:checked").val();
		if (($('#copy'+$(this).parent().attr("data-side")+'Keymap').val() == dkeymap) && ($('#copy'+$(this).parent().attr("data-side")+'Layer').val() == dlayer)) {
			console.log("Nothing to copy");
		} else {
			let side = ($(this).parent().attr("data-side") == "left" ? 1 : $(this).parent().attr("data-side") == "right" ? 0 : "Both");
			layerCopy($('#copy'+$(this).parent().attr("data-side")+'Keymap').val(), $('#copy'+$(this).parent().attr("data-side")+'Layer').val(), side, dkeymap, dlayer);
			viewKeymap(dkeymap, dlayer);
		}
	}

	function keyClear() {
		layerClear($(".sideselected").attr("data-index"), $("input[name='layer']:checked").val(), ($(this).parent().attr("data-side") == "left" ? 1 : $(this).parent().attr("data-side") == "right" ? 0 : "Both"));
		viewKeymap($(".sideselected").attr("data-index"), $("input[name='layer']:checked").val());

		// If the clipboard contains this layer, empty clipboard
		if ($('#copy'+$(this).parent().attr("data-side")+'Keymap').val() == $(".sideselected").attr("data-index") && $('#copy'+$(this).parent().attr("data-side")+'Layer').val() == $("input[name='layer']:checked").val()) {
			$('#copy'+$(this).parent().attr("data-side")+'Keymap').val("");
			$("#clip"+$(this).parent().attr("data-side")+"K").text("");
			$('#copy'+$(this).parent().attr("data-side")+'Layer').val("");
			$("#clip"+$(this).parent().attr("data-side")+"L").text("");
		}
	}

	function layerCopy(sourceKeymap, sourceLayer, side, destKeymap, destLayer) {
		if (side != 1) {
			jsondata.keymaps[destKeymap].layers[destLayer].modules[0].id = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[0].id;
			jsondata.keymaps[destKeymap].layers[destLayer].modules[0].keyActions = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[0].keyActions.slice();
			if (jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[3]) {
				if (jsondata.keymaps[destKeymap].layers[destLayer].modules[3]) {
					jsondata.keymaps[destKeymap].layers[destLayer].modules[3].id = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[3].id;
					jsondata.keymaps[destKeymap].layers[destLayer].modules[3].keyActions = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[3].keyActions.slice();
				} else {
					jsondata.keymaps[destKeymap].layers[destLayer].modules.push(jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[3]);
				}
			}
		}
		if (side != 0) {
			jsondata.keymaps[destKeymap].layers[destLayer].modules[1].id = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[1].id;
			jsondata.keymaps[destKeymap].layers[destLayer].modules[1].keyActions = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[1].keyActions.slice();
			jsondata.keymaps[destKeymap].layers[destLayer].modules[2].id = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[2].id;
			jsondata.keymaps[destKeymap].layers[destLayer].modules[2].keyActions = jsondata.keymaps[sourceKeymap].layers[sourceLayer].modules[2].keyActions.slice();
		}
	}

	function layerClear(keymap, layer, side) {
		for (let i=0; i<36; i++) {
			if (side != 1)
				jsondata.keymaps[keymap].layers[layer].modules[0].keyActions[i] = null;
			if (side != 0)
				jsondata.keymaps[keymap].layers[layer].modules[1].keyActions[i] = null;
		}
	}


	/************************************/



	/************************************/
	/*	Macros							*/
	/************************************/


	function loadMacros() { // Load macro list on the side menu
		$("#sideMenu a").off();
		while ($('#mm').next().attr('href') !== undefined)
			$('#mm').next().remove();
		items = "";
		for (let i=0; i<jsondata.macros.length; i++) {
			items += "<a href=\"#\" data-menu=\"divMacro\" data-index=" + i + ">" + jsondata.macros[i].name + "</a>";
		}
		$('#mm').after(items);
		$("#sideMenu a").click(menuselect);
	}

	function viewMacro(macro) {
		// Show a particular macro
		$('#macName').val(jsondata.macros[macro].name);
		$('#macName').css("width", Math.ceil($('#macName').textWidth())+18);
		while ($('#tmacro tr').length > 0)
			$('#tmacro tr')[0].remove();
		let mergedUntil = -1;
		for (let i=0; i<jsondata.macros[macro].macroActions.length; i++) {
			action = jsondata.macros[macro].macroActions[i].macroActionType;
			if (action == "text") {
				$('#tmacro').append("<tr><td class='drag-handler'>&#9776;</td><td>Write text</td><td class='macroCommand'>" + KarelSyntax(jsondata.macros[macro].macroActions[i].text) + "</td><td><img class='editLine' src='edit.png'><img class='removeLine' src='removeBlack.png'></td></tr>");

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
				$('#tmacro').append("<tr><td class='drag-handler'>&#9776;</td><td>" + action + "</td><td class='macroCommand'>" + value + "</td><td><img class='removeLine' src='removeBlack.png'></td></tr>")
			} else if (action == "delay") {
				$('#tmacro').append("<tr><td class='drag-handler'>&#9776;</td><td>Delay</td><td class='macroCommand'>" + jsondata.macros[macro].macroActions[i].delay + "</td><td><img class='removeLine' src='removeBlack.png'></td></tr>")
			} else if (action == "moveMouse") {
				$('#tmacro').append("<tr><td class='drag-handler'>&#9776;</td><td>Move mouse</td><td class='macroCommand'>x:" + jsondata.macros[macro].macroActions[i].x + ", y:"+ jsondata.macros[macro].macroActions[i].y + "</td><td><img class='removeLine' src='removeBlack.png'></td></tr>")
			} else if (action == "scrollMouse") {
				$('#tmacro').append("<tr><td class='drag-handler'>&#9776;</td><td>Scroll mouse</td><td class='macroCommand'>x:" + jsondata.macros[macro].macroActions[i].x + ", y:"+ jsondata.macros[macro].macroActions[i].y + "</td><td><img class='removeLine' src='removeBlack.png'></td></tr>")
			} else if (action == "mouseButton") {
				value = "";
				mouse.forEach(function(item, index){if (index & jsondata.macros[macro].macroActions[i].mouseButtonsMask) value += item + " + ";});
				if (value.endsWith(" + "))
					value = value.slice(0, -3);
				$('#tmacro').append("<tr><td class='drag-handler'>&#9776;</td><td>" + capitalize(jsondata.macros[macro].macroActions[i].action) + " button</td><td class='macroCommand'>" + value + "</td><td><img class='removeLine' src='removeBlack.png'></td></tr>");
			} else if (action == "command") {
				$('#tmacro').append("<tr><td class='drag-handler'>&#9776;</td><td>Command</td><td class='macroCommand'>" + KarelSyntax(jsondata.macros[macro].macroActions[i].command) + "</td><td><img class='removeLine' src='removeBlack.png'></td></tr>");
			} else
				$('#tmacro').append("<tr><td class='drag-handler'>&#9776;</td><td colspan='2' class='unknownCommand'>Unknown type: " + jsondata.macros[macro].macroActions[i].macroActionType + "</td><td><img class='removeLine' src='removeBlack.png'></td></tr>");
		}

		addEditRemoveActions();

		Sortable.create(
			$('#tmacroBody')[0], {
				animation: 150,
				scroll: true,
				handle: '.drag-handler',
				onEnd: function (evt) {
					jsondata.macros[$('.sideselected').attr("data-index")].macroActions.splice(evt.newIndex+(evt.newIndex > evt.oldIndex ? 1 : 0), 0, jsondata.macros[$('.sideselected').attr("data-index")].macroActions[evt.oldIndex]);
					jsondata.macros[$('.sideselected').attr("data-index")].macroActions.splice(evt.oldIndex+(evt.newIndex < evt.oldIndex ? 1 : 0), 1);
				}
			}
		);
	}

	function macro_add_line () { // Add new empty line
		$('#tmacroBody').append("<tr><td class='drag-handler'>&#9776;</td><td>Write text</td><td class='macroCommand'></td><td><img class='editLine' src='edit.png'><img class='removeLine' src='removeBlack.png'></td></tr>");
		jsondata.macros[$('.sideselected').attr("data-index")].macroActions.splice(jsondata.macros[$('.sideselected').attr("data-index")].macroActions.length, 0, {macroActionType: "text", text: ""});
		addEditRemoveActions();
	}

	function addEditRemoveActions () {
		// Adds edit and remove handlers for macro lines
		$('.editLine').off("click");
		$('.removeLine').off("click");

		$('.editLine').click(editMacro);
		$('.removeLine').click(function(e) {
			let $el = $(e.currentTarget);
			let $row = $el.closest('tr');
			jsondata.macros[$('.sideselected').attr("data-index")].macroActions.splice($row.index(), 1);
			$row.remove();
		});
	}

	function editMacro(){	
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
			v1++;
			v2--;
		}

		let lines= "";;
		for (let i=v1; i <= v2; i++) {
			lines += jsondata.macros[$(".sideselected").attr("data-index")].macroActions[i].text + "\n";
		}
		lines = lines.slice(0,-1);
		$('#txtEditor').val(lines);

		$("#chkSplit").attr("checked", (jsondata.macros[$(".sideselected").attr("data-index")].macroActions[v1].text.length == 0 || jsondata.macros[$(".sideselected").attr("data-index")].macroActions[v1].text[0] == '$'));
		
		$('#line1').val(v1);
		$('#line2').val(v2);

		$('#divEditor').show();
	}

	function editMacroSave() {
		let v1 = parseInt($('#line1').val());
		let v2 = parseInt($('#line2').val());

		jsondata.macros[$(".sideselected").attr("data-index")].macroActions.splice(v1, v2-v1+1);
		if ($('#chkSplit').prop('checked')) {
			let arr = $("#txtEditor").val().split("\n");
			for (let i = 0; i < arr.length; i++) {
				jsondata.macros[$(".sideselected").attr("data-index")].macroActions.splice((i+v1), 0, {macroActionType: "text", text: arr[i]});
			}
		}
		else
			jsondata.macros[$(".sideselected").attr("data-index")].macroActions.splice(v1, 0, {macroActionType: "text", text: $("#txtEditor").val()});
		$('#divEditor').hide();
		viewMacro($(".sideselected").attr("data-index"));
	}

	function editMacroCancel() {
		$('#divEditor').hide();
	}

	function KarelSyntax(text){ // Highlight syntax
		// Colors
		let command="#00F";
		let conditional = "#90F";
		let slot = "red";
		let modifiers = "#922";
		let comment = "#093";
		let macro = "#f90";
		let keymap = "#f90";
		let deprecated = "#f00";


		if (text[0] == "#" || (text[0] == "/" &&text[1] == "/")) {
			return text.replace(/(.*)/, '<span style="color:' + comment + ';">$1</span>')
		}
		if (text[0] != "$")
			return text;

		let macros = new Array();
		let keymaps = new Array();
		for (let i=jsondata.macros.length-1; i >=0; i--)
			macros.push(escapeName(jsondata.macros[i].name));
		for (let i=jsondata.keymaps.length-1; i>=0; i--)
			keymaps.push(escapeName(jsondata.keymaps[i].abbreviation));
		return text.replace(/([#%@][\d\-]+)/, '<span style="color:' + slot + ';">$1</span>')
			.replace(new RegExp('((^\\$)?\\b(' + KarelCond.join('|') + ')\\b)', 'g'), '<span style="color:' + conditional +';">$1</span>')
			.replace(new RegExp('((^\\$)?\\b(' + Karel.join('|') + ')\\b)', 'g'), '<span style="color:' + command +';">$1</span>')
			.replace(new RegExp('((^\\$)?\\b(' + KarelMod.join('|') + ')\\b)', 'g'), '<span style="color:' + modifiers + ';">$1</span>')
			.replace(new RegExp('((^\\$)?\\b(' + KarelDeprecated.join('|') + ')\\b)', 'g'), '<span style="color:#FFF;background:' + deprecated + '">$1</span>')
			.replace(new RegExp('((exec|call)</span> )(' + macros.join('|') + ')', 'g'), '$1<span style="color:' + macro + ';">$3</span>')
			.replace(new RegExp('((switchKeymap|toggleKeymapLayer|holdKeymapLayer|holdKeymapLayerMax|switchKeymapLayer)</span> )(' + keymaps.join('|') + ')', 'g'), '$1<span style="color:' + keymap + ';">$3</span>')
			.replace(/^(\$set) (module\.(trackball|touchpad|trackpoint|keycluster)\.(navigationMode|baseSpeed|speed|acceleration|caretSpeedDivisor|scrollSpeedDivisor|axisLockStrength|axisLockStrengthFirstTick|scrollAxisLock|cursorAxisLock|invertAxis)|mouseKeys\.(move|scroll)\.(initialSpeed|baseSpeed|initialAcceleration|deceleratedSpeed|acceleratedSpeed|axisSkew)|compensateDiagonalSpeed|chording|stickyMods|debounceDelay|keystrokeDelay|setEmergencyKey)/, '<span style="color:' + command +';">$1</span> <span style="color:' + modifiers +';">$2</span>');
	}

	function keyHover() { // event minikb hover. Show normal and shift keys
		if ($(this).attr("data-B"))
			$(this).text($(this).attr("data-B"));
			if ($(this).attr("data-ALT"))
				$('#ALTtext').text($(this).attr("data-ALT"));
	}

	function keyRelease() { // event minikb release. Show normal keys
		if ($(this).attr("data-A"))
			$(this).text($(this).attr("data-A"));
		$('#ALTtext').text("");
	}

	function keyClick() { //  // event minikb click. Copy name to clipboard
		if (!$(this).attr("data-ALT"))
			return;
		$(this).addClass("flash");
		let $temp = $("<input>");
		$("body").append($temp);
		$temp.val($(this).attr("data-ALT")).select();
		document.execCommand("copy");
		$temp.remove();
		$('#ALTtext').text($(this).attr("data-ALT") + " (copied)");
		setTimeout(() => {$('.flash').removeClass("flash")}, 1000);
	}


	/************************************/


	/************************************/
	/*	Macros. Copy and remove		*/
	/************************************/

	function addMacro() {
		let a = getMacroName("New macro");
		createMacro(a);
		let macroID = 0;
		while (jsondata.macros[macroID].name != a)
			macroID++;
		$('.sidenav a:nth-child('+(1+$('#mm').index()+macroID+1)+')').trigger('click');

		// Replace keymap appeareances
		for (let i=0; i<jsondata.keymaps.length; i++)
			for (let j=0; j< jsondata.keymaps[i].layers.length; j++)
				for (let k=0; k<jsondata.keymaps[i].layers[j].modules.length; k++)
					for (let l=0; l<jsondata.keymaps[i].layers[j].modules[k].keyActions.length; l++)
						if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l]) //can be null
							if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keyActionType == "playMacro") {
								let value = jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex;
								if (value >= macroID)
									jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex = value+1;
							}
	}

	function createMacro(aname, glow=true) {
		// Create a new empty macro
		let macro;
		macro = {isLooped: false, isPrivate: true, name: aname, macroActions: []};

		let index = 0
		while (index < jsondata.macros.length && firstSortedWord(jsondata.macros[index].name, aname)) {
			index++;
		}
		jsondata.macros.splice(index, 0, macro);
		loadMacros();
		if (glow)
			$('.sidenav a:nth-child('+(1+$('#mm').index()+index+1)+')').addClass("glow");
	}

	function getMacroName(name) {
		// Get a valid (not used) name
		let newname = name.toUpperCase();
		for (let i=0; i<jsondata.macros.length; i++)
			if (jsondata.macros[i].name.toUpperCase() == newname) {
				let index = name.search(/\(\d+\)$/);
				if (index > 0) {
					let number = parseInt(name.slice(index+1, -1)) + 1;
					name = name.slice(0, index) + "(" + number + ")";
					return getMacroName(name);
				} else {
					return (getMacroName(name + "(2)"));
				}
			}
		return name;
	}

	function macroRename() {
		// Place macro on the correct position (alphabetically).
		// Sets correct width for name field

		let oldName = jsondata.macros[$('.sideselected').attr("data-index")].name;
		let newName = $('#macName').val();
		if (oldName == $('#macName').val())
			return;

		for (let i=0; i<jsondata.macros.length; i++)
			if (jsondata.macros[i].name == newName) {
				$('#macName').val(oldName);
				return;
			}

		if ($('#macName').val().trim().length == 0)
			$('#macName').val(oldName).css("width", Math.ceil($('#kmName').textWidth())+18);
		else {
			$('#macName').val(createName($('#macName').val())).css("width", Math.ceil($('#macName').textWidth())+18);

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

			// Replace keymap appeareances
			for (let i=0; i<jsondata.keymaps.length; i++)
				for (let j=0; j< jsondata.keymaps[i].layers.length; j++)
					for (let k=0; k<jsondata.keymaps[i].layers[j].modules.length; k++)
						for (let l=0; l<jsondata.keymaps[i].layers[j].modules[k].keyActions.length; l++)
							if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l]) //can be null
								if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keyActionType == "playMacro") {
									let value = jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex;
									if (old < index && value >= old && value <= index)
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex = (value == old ? index : value-1);
									else if (old > index && index <= value && value <= old)
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex = (value == old ? index : value+1);
								}

			// Replace macro appeareances
			let re = new RegExp("^(\\$.*(exec|call) )" + escapeName(oldName) + "(.*)$");
			let re2 = new RegExp("^\\#(\\$.*(exec|call) )" + escapeName(oldName) + "(.*)$");
			for (let i=0; i<jsondata.macros.length; i++)
				for(j=0; j<jsondata.macros[i].macroActions.length; j++)
					if (jsondata.macros[i].macroActions[j].macroActionType == "text")
						if (oldName.search(" ")<0)
							if (newName.search(" ")<0)
								jsondata.macros[i].macroActions[j].text = jsondata.macros[i].macroActions[j].text.replace(re, "$1"+newName+"$3");
							else
								jsondata.macros[i].macroActions[j].text = jsondata.macros[i].macroActions[j].text.replace(re, "#$1"+newName+"$3");
						else
							if (newName.search(" ")<0)
								jsondata.macros[i].macroActions[j].text = jsondata.macros[i].macroActions[j].text.replace(re2, "$1"+newName+"$3");
							else
								jsondata.macros[i].macroActions[j].text = jsondata.macros[i].macroActions[j].text.replace(re2, "#$1"+newName+"$3");

			loadMacros();
			$('.sidenav a:nth-child('+(1+$('#mm').index()+index+1)+')').addClass("sideselected");
		}
	}

	function macroCopy() {
		let macroSourceID=$(".sideselected").attr("data-index");
		macroName = getMacroName(jsondata.macros[macroSourceID].name);
		createMacro(macroName);

		// Search new keymap
		let macroDestID = 0;
		while (jsondata.macros[macroDestID].name != macroName)
			macroDestID++;

		// Copy macros
		jsondata.macros[macroDestID].macroActions = jsondata.macros[macroSourceID].macroActions.slice();

		for (let i=0; i<jsondata.keymaps.length; i++)
			for (let j=0; j< jsondata.keymaps[i].layers.length; j++)
				for (let k=0; k<jsondata.keymaps[i].layers[j].modules.length; k++)
					for (let l=0; l<jsondata.keymaps[i].layers[j].modules[k].keyActions.length; l++)
						if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l]) //can be null
							if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keyActionType == "playMacro") {
								let value = jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex;
								if (value >= macroDestID)
									jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex = value+1;
							}

		$('.sidenav a:nth-child('+(1+$('#mm').index()+macroDestID+1)+')').trigger('click');
	}

	function macroRemove() {
		let macroID = $(".sideselected").attr("data-index");
		let macroName = jsondata.macros[macroID].name;
		let id = $(".sideselected").attr("data-index");
		jsondata.macros.splice(id, 1);
		loadMacros();
		if (jsondata.macros.length > 0)
			$('#mm').next().trigger("click");
		else
			$(".element").addClass("hide");

			// Remove keymap appeareances
			for (let i=0; i<jsondata.keymaps.length; i++)
				for (let j=0; j< jsondata.keymaps[i].layers.length; j++)
					for (let k=0; k<jsondata.keymaps[i].layers[j].modules.length; k++)
						for (let l=0; l<jsondata.keymaps[i].layers[j].modules[k].keyActions.length; l++)
							if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l]) //can be null
								if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keyActionType == "playMacro") {
									let value = jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex;
									if (value > macroID)
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex = value-1;
									else if (value == macroID)
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l] = null;
								}

			// Replace macro appeareances
			let re = new RegExp("^(\\$.*(exec|call) " + escapeName(macroName) + ".*)$");
			for (let i=0; i<jsondata.macros.length; i++)
				for (let j=0; j<jsondata.macros[i].macroActions.length; j++)
					if (jsondata.macros[i].macroActions[j].macroActionType == "text")
						if (jsondata.macros[i].macroActions[j].text.search(escapeName(macroName)) > 0)
							jsondata.macros[i].macroActions[j].text = jsondata.macros[i].macroActions[j].text.replace(re, "# $1");
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
			//hiddenElement.download = 'userConfiguration-mod.json';
			hiddenElement.download = $('#cfgDown').attr("data-file");
			hiddenElement.click();
		}
	}

	function uploadFile(event) {
		jsondata = undefined;
		$("#cfgDown").prop('disabled', true);
		const input = event.target;
		if ('files' in input && input.files.length > 0) {
			getFileConfig(input.files[0], jsondata);
			$('#loaded').text("File loaded: " + input.files[0].name);
			$('#cfgDown').attr("data-file", input.files[0].name);
		}
		if ($('a.sidetitle').first().next().next().text() == "Keymaps") {
			$("#sideMenu a").off();
			$('a.sidetitle').first().next().after("<a href=\"#\" data-menu=\"divMerge\">Merge configuration</a>");
			$("#sideMenu a").click(menuselect);
			$("#tConfig td:nth-child(2)").css("opacity", "1");
		}
		$('#addKeymap').show();
		$('#addMacro').show();
		$(this).val("");
	}

	function getFileConfig(file) {
		readFileContent(file).then(content => {
			$("#cfgDown").prop('disabled', false);
			jsondata = JSON.parse(content);
			jsonhash =  crc32(content);
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
	/*	Merge JSON				*/
	/************************************/

		function uploadMergeFile(event) {
		mergedata = undefined;
		const input = event.target;
		if ('files' in input && input.files.length > 0) {
			importFileConfig(input.files[0]);
			$(this).val("");
		}
	}

	function importFileConfig(file) {
		readFileContent(file).then(content => {
			if (jsonhash == crc32(content)) {
				// ERROR. Don't load
				$('#mergedFile').text("Error: You can't import the same configuration file.");
				$("#divMerge div:not(:first)").hide();
			} else {
				mergedata = JSON.parse(content);
				// Loading file
				$('#mergedFile').text("File loaded: " + file.name);
				$("#divMergeKeymaps br").remove();
				$("#divMergeKeymaps input").slice(1).remove();
				$("#divMergeKeymaps label").slice(1).remove();
				$("#divMergeMacros br").remove();
				$("#divMergeMacros input").slice(1).remove();
				$("#divMergeMacros label").slice(1).remove();
				$("#divMerge div").show();
				$("#divMerge .checkbox").prop("checked", true);
				$("#mergePrefix").val("");

				for (let i=0; i<mergedata.keymaps.length; i++) {
					$("#divMergeKeymaps").append("<br><input id='mergeKeymap" + i + "' data-id='" + i + "' class='checkbox1' type='checkbox' checked=true><label for='mergeKeymap" + i + "'>" + mergedata.keymaps[i].name + "</label>");
				}
				for (let i=0; i<mergedata.macros.length; i++) {
					$("#divMergeMacros").append("<br><input id='mergeMacro" + i + "' data-id='" + i + "' class='checkbox1' type='checkbox' checked=true><label for='mergeMacro" + i + "'>" + mergedata.macros[i].name + "</label>");
				}
			}
		}).catch(error => console.log(error));
	}

	function array_find(variable, id, value, ret_id=-1) {
		/* Search for specified values in the array.
			Variable is an array of arrays.
			We want to check if "variable" contains the "value" in the column "id" of each array.
			Also, it's possible to get the value of the ret_id.
		*/
		for (let i=0; i<variable.length; i++)
			if (variable[i][id] == value)
				return (ret_id == -1 ? true : variable[i][ret_id]);
		return false;
	}

	function merge() {
		let prefix = $("#mergePrefix").val();
		let keymapArr = new Array(); // Contain arrays: [new Id, old abbreviation, new abbreviation]
		let macroArr = new Array(); // Contain arrays: [old Id, new Id, old name, new name]

		$("#divMergeKeymaps .checkbox1:checked").each(function(){
			let id = $(this).attr("data-id");
			let name = createName(prefix + mergedata.keymaps[id].name);
			let abbr = createAbbr(mergedata.keymaps[id].abbreviation);
			createKeymap(name, abbr, false);

			// Search new keymap
			let finalId = 0;
			while (jsondata.keymaps[finalId].name != name && jsondata.keymaps[finalId].abbreviation != abbr)
				finalId++;
			keymapArr.push([finalId, mergedata.keymaps[id].abbreviation, abbr]);
			jsondata.keymaps[finalId].layers = mergedata.keymaps[id].layers.slice();
		});

		$("#divMergeMacros .checkbox1:checked").each(function(){
			let id = $(this).attr("data-id");
			let name = getMacroName(prefix + mergedata.macros[id].name);
			createMacro(name, false);

			// Search new macro
			let finalId = 0;
			while (jsondata.macros[finalId].name != name)
				finalId++;
			macroArr.push([id, finalId, mergedata.macros[id].name, name]);

			// Copy macros
			jsondata.macros[finalId].macroActions = mergedata.macros[id].macroActions.slice();

			// Fix keymap calls
			for (let i=0; i<jsondata.keymaps.length; i++) {
				if (!array_find(keymapArr, 2, jsondata.keymaps[i].abbreviation)) // If keymap is not imported
					for (let j=0; j< jsondata.keymaps[i].layers.length; j++)
						for (let k=0; k<jsondata.keymaps[i].layers[j].modules.length; k++)
							for (let l=0; l<jsondata.keymaps[i].layers[j].modules[k].keyActions.length; l++)
								if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l]) //can be null
									if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keyActionType == "playMacro") {
										let value = jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex;
										if (value >= finalId)
											jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex = value+1;
									}
			}
		});

		// Replace macro appearances in keymaps and macros (only imported ones)
		let re1K = new RegExp("^(\\$.*switchKeymap )(" + keymapArr.map(e => escapeName(e[1])).join("|") + ")(.*)$");
		let re2K = new RegExp("^(\\$.*(toggleKeymapLayer|holdKeymapLayer|holdKeymapLayerMax|switchKeymapLayer) )(" + keymapArr.map(e => escapeName(e[1])).join("|") + ")(.*)$");
		let reM = new RegExp("^(\\#?\\$.*(exec|call) )(" + macroArr.map(e => escapeName(e[2])).join("|") + ")(.*)$");

		for (let i=0; i<jsondata.keymaps.length; i++)
			if (array_find(keymapArr, 2, jsondata.keymaps[i].abbreviation)) // Check if keymap is imported
				for (let j=0; j< jsondata.keymaps[i].layers.length; j++)
					for (let k=0; k<jsondata.keymaps[i].layers[j].modules.length; k++)
						for (let l=0; l<jsondata.keymaps[i].layers[j].modules[k].keyActions.length; l++)
							if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l]) { //can be null
								if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keyActionType == "playMacro") {
									let value = jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex;
									if (array_find(macroArr, 0, value))
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l].macroIndex = array_find(macroArr, 0, value, 1);
									else
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l] = null;
								} else if (jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keyActionType == "switchKeymap") {
									let value = jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keymapAbbreviation;
									if (array_find(keymapArr, 1, value))
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l].keymapAbbreviation = array_find(keymapArr, 1, value, 2);
									else
										jsondata.keymaps[i].layers[j].modules[k].keyActions[l] = null;
								}
							}

		for (let i=0; i<jsondata.macros.length; i++)
			if (array_find(macroArr, 3, jsondata.macros[i].name)) // Check if macro is imported
				for(j=0; j<jsondata.macros[i].macroActions.length; j++)
					if (jsondata.macros[i].macroActions[j].macroActionType == "text") {
						jsondata.macros[i].macroActions[j].text = jsondata.macros[i].macroActions[j].text.replace(reM, function (match, p1, p2, p3, p4) {return p1 + array_find(macroArr, 2, p3, 3) + p4;}).replace(re1K, function (match, p1, p2, p3) {return p1 + array_find(keymapArr, 1, p2, 2) + p3;}).replace(re2K, function (match, p1, p2, p3, p4) {return p1 + array_find(keymapArr, 1, p3, 2) + p4;});
					}

		$("#divMerge div:not(:first)").hide();
		mergedata = undefined;
		$('.sidenav a:nth-child('+(1+$('#mk').index()+1+getDefaultKeymap())+')').trigger("click");
	}

	/************************************/



	/************************************/
	/*	General							*/
	/************************************/


	function capitalize(word) { // Capitalize first letter of word
		return word.charAt(0).toUpperCase() + word.slice(1);
	}

	function updateTrashKeymap() { // Hides the trash icon when there is only 1 keymap left (you can't remove the last one)
		if (jsondata.keymaps.length > 1)
			$('#keymapRemove').removeClass("disabled").off('click').click(keymapRemove);
		else
			$('#keymapRemove').addClass("disabled").off('click');
	}

	function firstSortedWord(word1, word2) { // Lazlo's sort method for macro names
		/*	Custom sort method for macro names.
			Returns if word1 is sorted first (true) or not
			according to the next order: symbols, numbers, lowercase and uppercase.
		*/
		let len = Math.min(word1.length, word2.length);
		for (let i=0; i<len; i++) {
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
		// Input:	letter
		// Output:	1 if symbol
		//			2 if number
		//			3 if letter
		if (letter.match(/[a-zA-Z]/)) return 3;
		if (letter.match(/[0-9]/)) return 2;
		return 1;
	}

	function escapeName(name) {
		return  name.replace(/\\/g, "\\\\")
					.replace(/\[/g, "\\\[")
					.replace(/\]/g, "\\\]")
					.replace(/\{/g, "\\\{")
					.replace(/\}/g, "\\\}")
					.replace(/\(/g, "\\\(")
					.replace(/\)/g, "\\\)")
					.replace(/\+/g, "\\\+")
					.replace(/\-/g, "\\\-")
					.replace(/\!/g, "\\\!")
					.replace(/\?/g, "\\\?")
					.replace(/\*/g, "\\\*")
					.replace(/\'/g, "\\\'")
					.replace(/\"/g, '\\\"')
					.replace(/\//g, "\\\/")
					.replace(/\^/g, "\\\^");
	}

});

var makeCRCTable = function(){
    var c;
    var crcTable = [];
    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

var crc32 = function(str) {
    var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    var crc = 0 ^ (-1);

    for (var i = 0; i < str.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
};