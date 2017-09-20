$(document).ready(function () {
	/* CONSTANTS */
	var user;
	
	function checkInactivity() {
		var interval;
		$(document).on('mousemove keyup keypress click', function () {
			clearTimeout(interval);
			settimeout();
		});

		function settimeout() {
			// Logout and clear data after 60 seconds of inactivity
			interval = setTimeout(clearData, 60000);
		}
	}

	function bindEnterKey() {
		$("#barcode").bind("keypress", function (e) {
			var code = e.keyCode || e.which;
			// Enter key activates lookup
			if (code === 13) {
				loan();
			} else if (code < 48 || code > 57) {  // only digits allowed
				e.preventDefault();
			}
		});

		$("#userid").bind("keypress", function (e) {
			var code = e.keyCode || e.which;
			// Enter key activates login
			if (code === 13) {
				login();
			} else if (code < 48 || code > 57) {  // only digits allowed
				e.preventDefault();
			}
		});
	}

	function login() {
		$("#login").prop("disabled", true);		
		var loginid = $("#userid").val();
		if ((loginid != null) && (loginid != "")) {

			$("#userid").prop("disabled", true);
			$("#loginerror").addClass("hide");

			$("#modalheader").text("loading data, please wait...");
			$("#myModal").show();
			$(".close").hide();

			$.ajax({
				type: "GET",
				url: baseURL + "almaws/v1/users/" + $("#userid").val() + "?apikey=" + apiKey + "&expand=loans,requests,fees&format=json",
				contentType: "text/plain",
				dataType: "json",
				crossDomain: true
			}).done(function (data) {
				user = data;
				// prepare scan box
				$("#scanboxtitle #firstname").text(data.first_name);
				$("#scanboxtitle #lastname").text(data.last_name);
				$("#userloans").text(data.loans.value);
				// $("#userrequests").text(data.requests.value);
				$("#userfees").text("$" + data.fees.value);
				if (data.fees.value > 0) {
					$("#userfees").parent().addClass("alert alert-danger");
				} else {
					$("#userfees").parent().removeClass("alert alert-danger");
				}
				$.ajax({
					type: "GET",
					url: data.loans.link + "?apikey=" + apiKey,
					contentType: "text/plain",
					dataType: "json"
				}).done(function(data) {
					data.item_loan.forEach(function(loan) {
						var dueDate = new Date(loan.due_date);
						var dueDateText = (parseInt(dueDate.getMonth()) + 1) + "/" + dueDate.getDate() + "/" + dueDate.getFullYear();		
						$("#prevloanstable").append("<tr><td>" + loan.title + "</td><td>" + dueDateText + "</td></tr>");
					});
				});
				$("#loginbox").hide();
				$("#scanbox").fadeIn(500);

				$("#barcode").focus();
				checkInactivity(true);
			}).fail(function (jqxhr, textStatus, error) {
				$("#loginerror").show();
				console.log(jqxhr.responseText);
				setTimeout(function () {
					$("#loginerror").fadeOut(1000);
				}, 3000);
				$("#userid").val("");
				$("#userid").focus();
			}).always(function () {
				$("#userid").prop("disabled", false);
				$("#login").prop("disabled", false);				
			});
		}
	}

	function loan() {
		$("#lookup").prop("disabled", true);
		var barcode = $("#barcode").val();
		if ((barcode != null) && (barcode != "")) {
			$("#barcode").prop("disabled", true);
			$.ajax({
				type: "POST",
				url: baseURL + "almaws/v1/users/" + user.primary_id + "/loans?user_id_type=all_unique&item_barcode=" + $("#barcode").val() + "&apikey=" + apiKey,
				contentType: "application/xml",
				data: "<?xml version='1.0' encoding='UTF-8'?><item_loan><circ_desk>" + circDesk + "</circ_desk><library>" + libraryName + "</library></item_loan>",
				dataType: "xml"
			}).done(function (data) {
				console.log(data);
				var dueDate = new Date($(data).find("due_date").text());
				var dueDateText = (parseInt(dueDate.getMonth()) + 1) + "/" + dueDate.getDate() + "/" + dueDate.getFullYear();
				$("#loanstable").append("<tr><td>" + $(data).find("title").text() + "</td><td>" + dueDateText + "</td></tr>");
			}).fail(function (jqxhr, textStatus, error) {
				$("#dataerror").show();
				console.log(jqxhr.responseText);
				setTimeout(function () {
					$("#dataerror").fadeOut(1000);
				}, 3000);
			}).always(function () {
				$("#barcode").prop("disabled", false);
				$("#barcode").val("");
				$("#barcode").focus();
				$("#lookup").prop("disabled", false);				
			});
		}
	}

	function logout() {
		clearData();
		$("#logoutconf").show();
		setTimeout(function () {
			$("#logoutconf").fadeOut(1000);
		}, 3000);
	}

	function clearData() {
		$("#loanstable").find("tr:gt(0)").remove();
		$("#prevloanstable").find("tr:gt(0)").remove();
		$("#prevloans").modal("hide");
		$("#userid").val("");
		$("#barcode").val("");
		$("#scanbox").hide();
		$("#loginbox").fadeIn(500);
		$("#userid").focus();
		user = undefined;
	}

	bindEnterKey();
	checkInactivity();
	$("#userid").focus();
	$("#userid").on("blur", function() {
		if ($(this).val()) { login();	}
	});
	$("#barcode").on("blur", function() {
		if ($(this).val()) { loan();	}
	});
	$("#userid").on("keyup", function () {
		// triggers login when the length of the ID hits 8 characters
		if ($(this).val().length >= 8) { login();	}
	});
	$("#barcode").on("keyup", function () {
		// triggers item lookup when the length of the barcode hits 14 numbers
		if ($(this).val().length >= 14) {	loan();	}
	});
	$("#login").on("click", login);
	$("#logout").on("click", logout);
	$("#lookup").on("click", loan);
});