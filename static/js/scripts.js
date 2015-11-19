// custom ui elements start-----


// custom ui element end -------

var API_ROOT = $SCRIPT_ROOT + "/api/";
var updateInterval = 60 * 1000; // 1 minute


$(".temperature-spinner").spinner({
	spin: function (event, ui) {
		if (ui.value > 35) {
			$(this).spinner("value", 15);
			return false;
		} else if (ui.value < 15) {
			$(this).spinner("value", 35);
			return false;
		}
	}
});

$("input[type=submit]")
	.click(function (event) {
		// event.preventDefault();
	});


function setTemperature() {
	$.ajax({
		url: API_ROOT + "temperature",
		success: function (value) {
			$("#temperature").html(value + "&deg;C").effect("highlight");
			setTimeout(function () {
				setTemperature();
			}, updateInterval);
		}
	});
}

function setTarget() {
	$.ajax({
		url: API_ROOT + "engine/currenttarget",
		success: function (value) {
			$("#target-temperature").html(value !== "-1" ? value + "&deg;C" : "").effect("highlight");
		}
	});
}

setTemperature();
setTarget();


var tempLock = $("#temperature-lock");
var tempSpinner = $("#temperature-spinner");
var setLockUI = function (lock) {
	tempSpinner.spinner(lock ? "disable" : "enable")
	tempLock.prop('value', lock ? "Unlock" : "Lock");
	tempLock.data("locked", lock);
	if (tempSpinner.val() === "-1")
		tempSpinner.val(25);
};
tempLock.click(function () {
	var lock = !tempLock.data("locked");
	$.ajax({
		url: API_ROOT + "override",
		type: 'PUT',
		data: "data=" + JSON.stringify(parseInt(lock ? tempSpinner.val() : -1)),
		success: function (result) {
			console.log(result);
			setLockUI(lock);
			setTarget();
		}
	});
});
setLockUI(tempSpinner.val() !== "-1");


$("#socket-config, #heater-socket-config").buttonset().click(function () {
	var data = $(this).find("input").map(function () {
		return $(this).is(":checked")
	}).get();
	console.log(JSON.stringify(data));
	$.ajax({
		url: API_ROOT + ($(this).attr("id").indexOf("heater") > -1 ? "heater_socket" : "socket"),
		type: 'PUT',
		data: "data=" + JSON.stringify(data),
		success: function (result) {
			console.log(result);
		}
	});
});

$("#heater-socket-config").buttonset();


var heaterConfigBlock = $("#heater-config-block");
heaterConfigBlock.css("display", "none");
$("#show-heater-config").click(function (event) {
	heaterConfigBlock.css("display", "block");
	$(this).css("display", "none");
});


var saveTimetable = function (events) {
	console.log(JSON.stringify(events));
}

var calendar = $('#timetable');
calendar.fullCalendar({
	defaultView: "agendaWeek",
	selectable: true,
	selectHelper: true,
	events: tempBlocks,
	eventOverlap: false,
	height: 860,
	header: {
		left: "title",
		center: "",
		right: ""
	},
	editable: true,

	select: function (start, end) {
		addEventDialog(start, end).dialog("open");
	},
	eventClick: function (calEvent, jsEvent, view) {
		editEventDialog(calEvent).dialog("open");
	},
	eventRender: function (event, element) {
		element.find(".fc-title").append("°C");
		//apparently, event values cannot be modified here...
		element.css("background-color", visualizeTemp(event.title));
	},
	eventAfterAllRender: function () {
		var events = calendar.fullCalendar('clientEvents').map(function (item) {
			return {
				title: item.title,
				start: moment(item.start).valueOf(),
				end: moment(item.end).valueOf()
			}
		});
		$.ajax({
			url: API_ROOT + "timetable",
			type: 'PUT',
			data: "data=" + JSON.stringify(events),
			success: function (result) {
				console.log(result);
				setTarget();
			}
		});
	}


});


var eventDialog = $("#dialog-add");
eventDialog.dialog({
	autoOpen: false,
	modal: true
});

var addEventDialog = function (start, end) {
	return eventDialog.dialog({
		title: "Add temperature",
		height: 180,
		buttons: [
			{
				text: "Save",
				click: function () {
					var val = $("#block-adjust-temperature").val();
					calendar.fullCalendar('renderEvent', {
						start: start,
						end: end,
						title: val
					}, true);
					$(this).dialog("close");
				}
			},
			{
				text: "Cancel",
				click: function () {
					$(this).dialog("close");
				}
			}
		],
		close: function () {
			calendar.fullCalendar('unselect');
		}
	});
};


var editEventDialog = function (event) {
	$("#block-adjust-temperature").val(event.title);
	return eventDialog.dialog({
		title: "Edit temperature",
		height: 180,
		width: 330,
		buttons: [
			{
				text: "Save",
				click: function () {
					event.title = $("#block-adjust-temperature").val();
					calendar.fullCalendar('updateEvent', event);
					$(this).dialog("close");
				}
			},
			{
				text: "Delete",
				click: function () {
					calendar.fullCalendar('removeEvents', event.id);
					$(this).dialog("close");
				}
			},
			{
				text: "Cancel",
				click: function () {
					$(this).dialog("close");
				}
			}
		],
		close: function () {
			calendar.fullCalendar('unselect');
		}
	});
};

function visualizeTemp(temp) {
	// hue 90(green) -> 0(red)
	// 15 -> 35
	//           ( value - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
	var mapped = ( parseInt(temp) - 15 ) * ( 0 - 90 ) / ( 35 - 15 ) + 90;
	return "hsla(" + mapped + ", 100%, 30%, 0.7)";
}

// Adds the current time placeholder and scrolls to it.
function addCurrentTimeIndicator() {
	var container = $('.fc-event-container').parent();
	container.append('<div class="currenttime-indicator"></div>');

	positionCurrentTimeIndicator();

	// Scroll so the time indicator is near the top. Do this on a setTimeout because the calendar
	// hasn't fully rendered yet.
	setTimeout(function () {
		var scrollableContainer = $('.fc-event-container').parent().parent();
		var pxFromTop = 100; // Number of pixels to shift time bar  down from the top.
		var scrollTop = $('.currenttime-indicator').position().top - pxFromTop;
		scrollableContainer.animate({
			scrollTop: scrollTop
		}, 400);
	}, 1);
}


// Repositions the current time indicator.
function positionCurrentTimeIndicator() {
	var container = $('.fc-time-grid');
	var todayColumn = $('.fc-today:visible');

	var now = new Date();
	var curSeconds = (now.getHours() * 60 * 60) + (now.getMinutes() * 60) + now.getSeconds();
	var percentOfDay = curSeconds / 86400 /* Seconds in a day */;

	$('.currenttime-indicator').css({
		width: todayColumn.width(),
		left: todayColumn.position().left,
		top: container.height() * percentOfDay
	});
}


addCurrentTimeIndicator();


// Keep the calendar height in sync with the window size.
$(window).on('resize', function () {
	calendar.fullCalendar('option', 'height', $(window).height());
	positionCurrentTimeIndicator();
});


// Reposition every 5 mins.
setInterval(positionCurrentTimeIndicator, 5 * 60 * 1000 /* 5 mins */);

Chart.defaults.global.responsive = true;


function setHistory() {
	$.ajax({
		url: API_ROOT + "history/30",
		success: function (value) {
			loadChart(value);
			setTimeout(function () {
				setHistory();
			}, updateInterval);
		}
	});
}
setHistory();;

function loadChart(value) {
	var label = value.map(function (item) {
		var date = new Date(item.time);
		return date.format('M/d h:i');
	})


	var historyDataset = [];
	["current", "target"].forEach(function (element, index) {
		var data = value.map(function (item) {
			return item[element];
		});
		//console.log(element + "->" + data)
		historyDataset.push({
			label: element,
			fillColor: "rgba(220," + (index == 1 ? "180" : "220" ) + ",220,0.2)",
			strokeColor: "rgba(220,220,220,1)",
			pointColor: "rgba(220,220,220,1)",
			pointStrokeColor: "#fff",
			pointHighlightFill: "#fff",
			pointHighlightStroke: "rgba(220,220,220,1)",
			data: data
		});
	});


	new Chart($("#history-chart").get(0).getContext("2d")).Line({
		labels: label,
		datasets: historyDataset
	}, {
		scaleShowGridLines: true,
		scaleGridLineColor: "rgba(0,0,0,.05)",
		scaleGridLineWidth: 1,
		bezierCurve: true,
		bezierCurveTension: 0.4,
		pointDot: true,
		pointDotRadius: 4,
		pointDotStrokeWidth: 1,
		pointHitDetectionRadius: 20,
		datasetStroke: true,
		datasetStrokeWidth: 2,
		datasetFill: true,
		legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"

	});

	new Chart($("#performance-chart").get(0).getContext("2d")).Line({
		labels: label, datasets: [{
			label: "1",
			fillColor: "rgba(220,220,220,0.4)",
			strokeColor: "rgba(220,220,220,1)",
			pointColor: "rgba(220,220,220,1)",
			pointStrokeColor: "#fff",
			pointHighlightFill: "#fff",
			pointHighlightStroke: "rgba(220,220,220,1)",
			data: value.map(function (item) {
				console.log(item["heaterstate"])
				return item["heaterstate"] ? 1 : 0;
			})
		}]
	}, {
		scaleShowGridLines: true,
		scaleGridLineColor: "rgba(0,0,0,.05)",
		scaleGridLineWidth: 1,
		bezierCurve: false,
		pointDot: true,
		pointDotRadius: 4,
		pointDotStrokeWidth: 1,
		pointHitDetectionRadius: 20,
		datasetStroke: true,
		datasetStrokeWidth: 2,
		datasetFill: true,
		legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].lineColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"

	});
}

