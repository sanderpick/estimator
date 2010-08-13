/*--------------------------------------------------------------------------.
|  Software: Einstein Estimator		                                  		|
|   Version: 1.1                                                            |
|   Contact: spick@cleanenergysolutionsinc.com 								|                
| ------------------------------------------------------------------------- |
|     Admin: Sander Pick (project admininistrator)                          |
|   Authors: Sander Pick                         							|
| Copyright (c) 20010-Today Lighthouse Solar. All Rights Reserved.       	|                     
| ------------------------------------------------------------------------- |
|   License: By downloading or copying any part of this file,	 			|
|			 you agree to the following: 									|
|			* The product may not be used for commercial projects. 			|
|			* You are not free to remove the copyright information.			|
| 			* You are not free to use or copy any of this file.             |
'--------------------------------------------------------------------------*/
/*###########################################################################
###################################################################### GLOBAL
###########################################################################*/
// determine user info
var System = {
	init:function() {
		this.browser = this.searchString(this.dataBrowser()) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS()) || "an unknown OS";
	},
	searchString:function(data) {
		for(var i=0;i<data.length;i++) {
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if(dataString) if(dataString.indexOf(data[i].subString) != -1) return data[i].identity;
			else if(dataProp) return data[i].identity;
		}
	},
	searchVersion:function(dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if(index==-1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser:function() {
		return [
			{ string:navigator.userAgent, subString:"Chrome", identity:"Chrome" },
			{ string:navigator.userAgent, subString:"OmniWeb", versionSearch:"OmniWeb/", identity:"OmniWeb" },
			{ string:navigator.vendor, subString:"Apple", identity:"Safari", versionSearch:"Version" },
			{ string:navigator.userAgent, subString:"Opera", identity:"Opera" },
			{ string:navigator.vendor, subString:"iCab", identity:"iCab" },
			{ string:navigator.vendor, subString:"KDE", identity:"Konqueror" },
			{ string:navigator.userAgent, subString:"Firefox", identity:"Firefox" },
			{ string:navigator.vendor, subString:"Camino", identity:"Camino" },
			{ string:navigator.userAgent, subString:"Netscape", identity:"Netscape" },
			{ string:navigator.userAgent, subString:"MSIE", identity:"Explorer", versionSearch:"MSIE" },
			{ string:navigator.userAgent, subString:"Gecko", identity:"Mozilla", versionSearch:"rv" },
			{ string:navigator.userAgent, subString:"Mozilla", identity:"Netscape", versionSearch:"Mozilla" }
		];
	},
	dataOS:function() {
		return [
			{ string:navigator.platform, subString:"Win", identity:"Windows" },
			{ string:navigator.platform, subString:"Mac", identity:"Mac" },
			{ string:navigator.userAgent, subString:"iPhone", identity:"iPhone/iPod" },
			{ string:navigator.platform, subString:"Linux", identity:"Linux" }
		];
	}
};
System.init();
// determine host
var host = window.location.hostname;
var tld = /\.([a-z,A-Z]{2,6})$/;
// constants
var Einstein = {};
switch(host.match(tld)[1]) {
	case "ld" : Einstein.PORTAL_URI = "http://lighthousesolar.ld/portal/"; break;
	default : Einstein.PORTAL_URI = "http://mylighthousesolar.com/"; break;
}
Einstein.MARGIN_UPPER = 20;
Einstein.MARGIN_LOWER = 20;
Einstein.PPW_GROSS_UPPER = 4.5;
Einstein.PPW_GROSS_LOWER = 4.5;
Einstein.PPW_NET_UPPER = 100;
Einstein.PPW_NET_LOWER = -100;
Einstein.VALID_EMAIL = /^(([A-Za-z0-9]+_+)|([A-Za-z0-9]+\-+)|([A-Za-z0-9]+\.+)|([A-Za-z0-9]+\++))*[A-Za-z0-9]+@((\w+\-+)|(\w+\.))*\w{1,63}\.[a-zA-Z]{2,6}$/;
/*###########################################################################
############################################################# CLASS FRAMEWORK
###########################################################################*/
// Inspired by base2 and Prototype - John Resig
(function() {
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
	this.Class = function(){};
	Class.extend = function(prop) {
    	var _super = this.prototype;
    	initializing = true;
    	var prototype = new this();
    	initializing = false;
    	for(var name in prop) {
      		prototype[name] = typeof prop[name] == "function" &&
        	typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        	(function(name, fn){
          		return function() {
            		var tmp = this._super;
            		this._super = _super[name];
            		var ret = fn.apply(this, arguments);       
            		this._super = tmp;
            		return ret;
          		};
        	})(name, prop[name]) :
        	prop[name];
    	}
		function Class() {
      		if(!initializing && this.init) this.init.apply(this, arguments);
    	}
    	Class.prototype = prototype;
    	Class.constructor = Class;
    	Class.extend = arguments.callee;
    	return Class;
	};
})();
/*###########################################################################
########################################################################## IO
###########################################################################*/
var IO = Class.extend({
	init:function() { },
	server:"includes/es-submit.php",
	error:function(e) { console.log(e['responseText']); },
	loader:"#loading",
	loading:function(vis) { (vis) ? $(this.loader).fadeIn("fast") : $(this.loader).fadeOut("slow"); },
	request:function(caller,d) {
		var s = this;
		s.loading(true);
		s.caller = caller;
		$.ajax({
  			type:"POST",
  			url:s.server,
  			data:d,
			dataType:"json",
			complete:function(request) { },
  			success:function(json) {
				s.loading(false);
				if(json.error==undefined) {
					s.caller.receive(json);
				} else s.error(json.error);
			},
			error:function(e) { s.error(e); s.loading(false); }
 		});
	}
});
/*###########################################################################
##################################################################### MODULES
###########################################################################*/
// base class for all modules
var Module = Class.extend({
	init:function(el,io) { this.el = el; this.io = io; },
	done:function() { },
  	show:function(holder,width,nofade) {
		if(width==null) width = "100";
		$(holder).append("<div style='display:none; width:"+width+"%;' id='"+this.el.substring(1)+"'></div>"); 
		$(this.el).html(this.iHTML());
		(!nofade) ? $(this.el).fadeIn("fast") : $(this.el).show();
	},
	hide:function() { var t = this; $(t.el).fadeOut("fast",function() { t.clear(); }); },
	begin:function() { },
	clear:function() { $(this.el).remove(); },
	iHTML:function() { },
	dbTable:"",
	dbOrder:"",
	dbFulltext:"",
	itemForm:function() { },
	receive:function() { },
	rowContent:function() { },
	editRowContent:function() { }
});
/////////////////////////////////////////////////////////////////////////////////// login : all
var Login = Module.extend({
  	init:function(el,io) {
		this._super(el,io); var t = this;
		// setup login form
		$("input[title='LogIn']").live("click",function() {
			var ds = $("form.loginform").postify("rememberme");
			if(ds=="") return false;
			// store attempted username / pass for cookies
			if($("#rememberme").attr("checked")) {
				t.try_username = $("#rep_username").val();
				t.try_password = $("#rep_password").val();
				t.setCookie = true;
			} else t.setCookie = false;
			// try to log in
			t.io.request(t,ds+"es_do=login");
		});
		$("a[title='LogOut']").live("click",function() {
			t.io.request(t,"exit=yes&es_do=logout");
		});
	},
	done:function() { this._super(); },
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function() {
		this._super();
		// attempt to resume last session
		this.io.request(this,"es_do=resume");
	},
	clear:function() {
		this._super();
		// set the title
		document.title = this.docTitle;
		// create the dashboard columns
		$("#main").append("<div id='extra-nav'>"+this.docNav+"</div> \
							<h1 class='main-header'>&rsaquo;&rsaquo;&nbsp;"+this.dashboardText+"</h1> \
							<div class='dashboard-wrap'> \
								"+this.docWrapper+" \
								<div class='clear'></div> \
							</div>");
		$("#footer, #topper-menu").show();
		$("#logo .left").html("<h3><img src='gfx/einstein.png' height='30' alt='' style='vertical-align: middle; padding:0 5px 10px 0' />Einstein</h3><h3 class='location'> | "+this.officeLocation+"</h3>");
		// do the next action in start sequence
		for(var m in this.next) this.next[m].begin();
	},
	iHTML:function() {
		this._super();
		// build notify vars
		var message = (this.message!="") ? "<h2 class='message'>"+this.message+"</h2><br />" : "";
		var error = (this.error!="") ? "<h2 class='error'>"+this.error+"</h2><br />" : "";
		this.message = ""; this.error = "";
		return "<div style='margin:50px auto 20px auto; width:290px;'> \
					<h1 class='login-header'><img src='gfx/einstein.png' height='60' alt='' style='vertical-align: middle; padding:0 5px 10px 0' />Einstein</h1> \
					<h1 class='login-header-sub'>Solar System Estimator</h1> \
					<!--<h2 class='alert'>PV Watts may be down intermittently the weekends of July 16th - 18th and July 23rd - 25th.</h2><br />--> \
					"+message+error+" \
					<form class='loginform' action='javascript:void(0);'> \
						<label for='rep_username'>Username:</label> \
						<input class='required login-text' type='text' id='rep_username' value='"+$.get_cookie('esrep_username')+"' /> \
						<label for='rep_password'>Password</label> \
						<input class='required login-text' type='password' id='rep_password' value='"+$.get_cookie('esrep_password')+"' /> \
						<label for='rememberme' style='color:#808080; float:left; padding:7px 0 0 0;'> \
							<input type='checkbox' id='rememberme' tabindex='90' value='forever' name='rememberme' style='display:inline;' /> Remember Me \
						</label> \
						<input type='submit' class='right' title='LogIn' value='Log In' /> \
						<div class='clear'></div> \
					</form> \
					<br /> \
					<small class='contact'>Having problems? <a href='mailto:helpdesk@lighthousesolar.com' target='_self'>Contact</a> your Administrator. To ensure the best user experience, please use a modern web browser like <a href='http://www.google.com/chrome/' target='_blank'>Chrome</a>, <a href='http://www.apple.com/safari/download/' target='_blank'>Safari</a>, or <a href='http://www.mozilla.com/' target='_blank'>Firefox</a>.</small> \
				</div>";
	},
	receive:function(json) {
		this._super();
		// parse data received for login requests
		switch(json.did) {
			case "resume" : case "login" :
				// store rep info on login
				$("#data").data("rep",json.data);
				// set cookie if checked
				if(this.setCookie) {
					$.set_cookie("esrep_username",this.try_username,365);
					$.set_cookie("esrep_password",this.try_password,365);
				}
				// determine location
				this.officeLocation = json.data2.location;
				$("#data").data("city",json.data2.city);
				$("#data").data("state",json.data2.state);
				$("#data").data("zip",json.data2.zip);
				// set user role
				$("#data").data("role",json.data.rep_role);
				// determine user role
				switch(json.data.rep_role) {
					case "0" : 
						this.next = this.isSuper; 
						this.dashboardText = "Systemwide Dashboard"; 
						this.docTitle = "Administer / Einstein Estimator - Lighthouse Solar / "+this.officeLocation;
						this.docWrapper = "<div class='dashboard-left'></div><div class='dashboard-right'></div>";
						this.docNav = "";
						break;
					case "1" : 
						this.next = this.isOffice; 
						this.dashboardText = "Office Dashboard"; 
						this.docTitle = "Office / Einstein Estimator - Lighthouse Solar / "+this.officeLocation;
						this.docWrapper = "<div class='dashboard-left'></div><div class='dashboard-right'></div>";
						this.docNav = "";
						break;
					case "2" : 
						this.next = this.isAdmin; 
						this.dashboardText = "Admin Dashboard"; 
						this.docTitle = "Welcome / Einstein Estimator - Lighthouse Solar / "+this.officeLocation;
						this.docWrapper = "<div class='dashboard-bar-left'></div><div class='dashboard-main'></div>";
						this.docNav = "";
						break;
					case "3" : 
						this.next = this.isRep; 
						this.dashboardText = "Rep Dashboard"; 
						this.docTitle = "Welcome / Einstein Estimator - Lighthouse Solar / "+this.officeLocation;
						this.docWrapper = "<div class='dashboard-bar-left'></div><div class='dashboard-main'></div>";
						this.docNav = "";
						break;
					case "4" : 
						this.next = this.isSupport;
						this.dashboardText = "Support Dashboard: <span style='font-variant:small-caps; font-size:16px; color:#808080;'>"+json.data3[0].off_city+", "+json.data3[0].off_state+"</span>"; 
						this.docTitle = "Support / Einstein Estimator - Lighthouse Solar / "+this.officeLocation;
						this.docWrapper = "<div class='dashboard-bar-left'></div><div class='dashboard-main'></div>";
						this.docNav = "<ul>";
						for(var n in json.data3) {
							this.docNav += n==0 ? "<li><a id='sup"+json.data3[n].ID+"' class='extra-nav-hover' href='javascript:void(0);' title='"+json.data3[n].off_city+", "+json.data3[n].off_state+"'>"+json.data3[n].off_city+"</a></li>" : "<li><a id='sup"+json.data3[n].ID+"' href='javascript:void(0);' title='"+json.data3[n].off_city+", "+json.data3[n].off_state+"'>"+json.data3[n].off_city+"</a></li>";
						}
						this.docNav += "</ul>";
						// set initial office
						$("#data").data("rep").rep_officeID = json.data3[0].ID;
						// add clicks to nav
						var t = this;
						$("a",$("#extra-nav")).live("click",function() {
							$("a",$("#extra-nav")).each(function(i) {
								$(this).removeClass("extra-nav-hover");
							});
							$(this).addClass("extra-nav-hover");
							$(".main-header").html("&rsaquo;&rsaquo;&nbsp;Support Dashboard: <span style='font-variant:small-caps; font-size:16px; color:#808080;'>"+this.title+"</span>");
							$("#data").data("rep").rep_officeID = this.id.substring(3);
							for(var m in t.next) t.next[m].begin(true);
						});
						break;
				}
				// add logout link
				$("#topper-menu").append("<span style='color:#404040; font-weight:normal; font-size:14px;'>Howdy, </span><span style='color:#5880c0; font-weight:normal; font-size:14px;'>"+json.data.rep_login+"</span><span style='color:#404040; font-weight:normal; font-size:14px;'> | </span><a href='javascript:void(0);' class='action-link' title='LogOut'>Log Out</a>");
				// hide this module if visible
				(json.did=="login") ? this.hide() : this.clear();
				break;
			case "logout" :
				// clear rep info
				$("#data").data("rep",null);
				$("#topper-menu, #main").html("");
				$("#footer, #topper-menu").hide();
				$("#logo .left").html("<div style='padding:5px 0 0 0;'><a href='http://lighthousesolar.com' target='_blank'><img src='gfx/logo-black.png' width='' height='24' alt='lighthouse solar logo' /></a></div>");
				this.message = "You are now logged out.";
				// set the title
				this.docTitle = "Log In / Einstein Estimator - Lighthouse Solar";
				document.title = this.docTitle;
				// show login form
				this.show("#main");
				$("#rep_username").focus();
				break;
			case "cant resume" :
				// set the title
				this.docTitle = "Log In / Einstein Estimator - Lighthouse Solar";
				document.title = this.docTitle;
				// show the login form
				this.show("#main");
				$("#rep_username").focus();
				break;
			default :
				// show error message
				this.error = "The username or password you entered is incorrect.";
				this.show("#main");
				$("#rep_username").focus();
				break;
		}
	},
	message:"",
	error:""
});
/////////////////////////////////////////////////////////////////////////////// offices : super
var Offices = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// new item
		$("a[title='New']",$(t.el)).live("click",function() {
			$(".dashboard-item-content",$(t.el)).html(t.itemForm());
			$("#manager-warning").hide();
		});
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&es_do=browseAll");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"table="+t.dbTable+"&es_do=addOffice");
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=updateItem");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			if(!confirm("Are you sure you want to delete this item and all of its dependents? This cannot be undone.")) return false;
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=deleteOffice");
		});
		// for manager list
		$("#off_city",$(t.el)).live("keyup",function() {
			var city = this.value.trim().replace(" ","_").toLowerCase();
			if($(this).closest("form").hasClass("addform")) {	
				if(city!="") $("#manager-warning",$(this).closest("form")).show();
				else $("#manager-warning",$(this).closest("form")).hide();
				$(".off_manager_list-display",$(this).closest("form")).text(city+"_gm@lighthousesolar.com");
			}
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function() {
		this._super(); 
		this.show(".dashboard-left"); 
		// get all the modules
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<a href='javascript:void(0);' class='dashboard-link' title='New'>+</a> \
						<h1 class='dashboard-header'>Offices</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_offices",
	dbOrder:"off_city",
	itemForm:function() {
		this._super();
		// returns the form
		return "<form class='addform' action='javascript:void(0);'> \
					<h1 class='addform-header'>New Office Info:</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='off_address'>Address</label> \
						<input class='required' type='text' id='off_address' value='' /> \
						<label for='off_city'>City</label> \
						<input class='required' type='text' id='off_city' value='' /> \
						<label for='off_state'>State</label> \
						<input class='required' type='text' id='off_state' value='' /> \
						<label for='off_zip'>Zip</label> \
						<input class='required' type='text' id='off_zip' value='' /> \
					</div> \
					<div class='form-column'> \
						<label for='off_phone'>Phone</label> \
						<input class='required' type='text' id='off_phone' value='' /> \
						<label for='off_email'>Email</label> \
						<input class='required' type='text' id='off_email' value='' /> \
						<label for='off_labor_cost'>Labor Cost (hr)</label> \
						<input class='required' type='text' id='off_labor_cost' value='' /> \
						<label for='off_labor_price'>Labor Price (hr)</label> \
						<input class='required' type='text' id='off_labor_price' value='' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='off_pvwatts'>PV Watts Query</label> \
						<input class='required' type='text' id='off_pvwatts' value='' /> \
						<label for='off_lat'>Latitude (º)</label> \
						<input class='required' type='text' id='off_lat' value='' /> \
						<label for='off_long'>Longitude (º)</label> \
						<input class='required' type='text' id='off_long' value='' /> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Add' value='Add New' /> \
					<input type='submit' title='Cancel' value='Cancel' /> \
					<div id='manager-warning' style='display:inline;'> \
						<span style='padding:0 0 0 20px; color:#808080; font-variant:small-caps;'>New Office <em>Manager\'s List</em> <span style='color:black;'>must</span> be:</span> \
						<div class='off_manager_list-display' style='font-weight:bold; color:#5880C0; display:inline;'>_gm@lighthousesolar.com</div> \
					</div> \
				</form>";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
				// notify rep
				this.io.request(this,"id="+json.data.rep_id+"&type=new_office&pass="+json.data.rep_pass+"&es_do=notifyRep");
				break;
			case this.dbTable+" updated" :
				$("#off"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-off"+this.currentRowID).html(this.editRowContent(json.data)).hide();
				break;
			case this.dbTable+" deleted" :
				$("#off"+this.currentRowID).remove();
				$("#edit-off"+this.currentRowID).remove();
				break;
			case "rep notified" : break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>City</th>";
				html += "<th colspan='1'>State</th>";
				html += "<th colspan='1'>Zip</th>";
				html += "<th colspan='1'>Phone</th>";
				html += "<th colspan='1' align='right'>Labor Cost (hr)</th>";
				html += "<th colspan='1' align='right'>Labor Price (hr)</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// loop over each result
				var color = ["light","dark"];
				for(var i=0;i<json.data.length;i++) {
					html += "<tr id='off"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-off"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i]);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There are no Offices in your system at the moment.</p>");
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// create the row
		var row = "<td colspan='1'>";
		row += "<span style='font-weight:bold;'>"+data.off_city+"</span><br />";
		row += "<span class='edit-panel'>";
		row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a> | ";
		row += "<a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>";
		row += "</span>";
		row += "</td>";
		row += "<td colspan='1'>"+data.off_state+"</td>";
		row += "<td colspan='1'>"+data.off_zip+"</td>";
		row += "<td colspan='1'>"+data.off_phone+"</td>";
		row += "<td colspan='1' align='right'>"+data.off_labor_cost+"</td>";
		row += "<td colspan='1' align='right'>"+data.off_labor_price+"</td>";
		return row;
	},
	editRowContent:function(data) {
		this._super();
		// create the edit row
		var edit = "<td colspan='6'>";
		edit += "<form class='updateform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='off_address'>Address</label> \
						<input class='required' type='text' id='off_address' value='"+data.off_address+"' /> \
						<label for='off_city'>City</label> \
						<input class='required' type='text' id='off_city' value='"+data.off_city+"' /> \
						<label for='off_state'>State</label> \
						<input class='required' type='text' id='off_state' value='"+data.off_state+"' /> \
						<label for='off_zip'>Zip</label> \
						<input class='required' type='text' id='off_zip' value='"+data.off_zip+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='off_phone'>Phone</label> \
						<input class='required' type='text' id='off_phone' value='"+data.off_phone+"' /> \
						<label for='off_email'>Email</label> \
						<input class='required' type='text' id='off_email' value='"+data.off_email+"' /> \
						<label for='off_manager_list'>Manager\'s List</label> \
						<input class='required' type='text' id='off_manager_list' value='"+data.off_manager_list+"' /> \
						<label for='off_labor_cost'>Labor Cost (hr)</label> \
						<input class='required' type='text' id='off_labor_cost' value='"+data.off_labor_cost+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='off_labor_price'>Labor Price (hr)</label> \
						<input class='required' type='text' id='off_labor_price' value='"+data.off_labor_price+"' /> \
						<label for='off_pvwatts'>PV Watts Query</label> \
						<input class='required' type='text' id='off_pvwatts' value='"+data.off_pvwatts+"' /> \
						<label for='off_lat'>Latitude (º)</label> \
						<input class='required' type='text' id='off_lat' value='"+data.off_lat+"' /> \
						<label for='off_long'>Longitude (º)</label> \
						<input class='required' type='text' id='off_long' value='"+data.off_long+"' /> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	}
});
//////////////////////////////////////////////////////////////////////////// pv modules : super
var Modules = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// new item
		$("a[title='New']",$(t.el)).live("click",function() {
			$(".dashboard-item-content",$(t.el)).html(t.itemForm());
		});
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&es_do=browseAll");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"table="+t.dbTable+"&es_do=addItem");
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=updateItem");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			if(!confirm("Are you sure you want to delete this item? This cannot be undone.")) return false;
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=deleteItem");
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function() { 
		this._super(); 
		this.show(".dashboard-left"); 
		// get all the modules
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<a href='javascript:void(0);' class='dashboard-link' title='New'>+</a> \
						<h1 class='dashboard-header'>PV Modules</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_modules",
	dbOrder:"mod_model_num",
	itemForm:function() {
		this._super();
		// returns the form
		return "<form class='addform' action='javascript:void(0);'> \
					<h1 class='addform-header'>New Module Info:</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='mod_model_num'>Model #</label> \
						<input class='required' type='text' id='mod_model_num' value='' /> \
						<label for='mod_desc'>Description</label> \
						<input class='required' type='text' id='mod_desc' value='' /> \
						<label for='mod_width'>Width (in)</label> \
						<input class='required' type='text' id='mod_width' value='' /> \
						<label for='mod_length'>Length (in)</label> \
						<input class='required' type='text' id='mod_length' value='' /> \
						<label for='mod_stc'>STC Rating (W)</label> \
						<input class='required' type='text' id='mod_stc' value='' /> \
					</div> \
					<div class='form-column'> \
						<label for='mod_ptc'>PTC Rating (W)</label> \
						<input class='required' type='text' id='mod_ptc' value='' /> \
						<label for='mod_labor'>Base Install Labor (hrs)</label> \
						<input class='required' type='text' id='mod_labor' value='' /> \
						<label for='mod_unit'>Price Unit</label> \
						<input class='required' type='text' id='mod_unit' value='' /> \
						<label for='mod_cost'>Cost ($)</label> \
						<input class='required' type='text' id='mod_cost' value='' /> \
					</div> \
					<div class='form-column'> \
						<label for='mod_price'>Price ($)</label> \
						<input class='required' type='text' id='mod_price' value='' /> \
						<label for='mod_cutsheet_uri'>Cutsheet URI</label> \
						<input type='text' id='mod_cutsheet_uri' value='' /> \
						<label for='mod_cutsheet_t_uri'>Cutsheet Thumb URI</label> \
						<input type='text' id='mod_cutsheet_t_uri' value='' /> \
						<label for='mod_print_cutsheet_uri'>Cutsheet Print URI(s)</label> \
						<input type='text' id='mod_print_cutsheet_uri' value='' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='' selected='selected'>--select--</option> \
							<option value='1'>yes</option> \
							<option value='0'>no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Add' value='Add New' /> \
					<input type='submit' title='Cancel' value='Cancel' /> \
				</form>";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
				break;
			case this.dbTable+" updated" :
				// set active
				json.data.active = (json.data.active==1) ? "yes" : "no";
				$("#mod"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-mod"+this.currentRowID).html(this.editRowContent(json.data)).hide();
				break;
			case this.dbTable+" deleted" :
				$("#mod"+this.currentRowID).remove();
				$("#edit-mod"+this.currentRowID).remove();
				break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>Model #</th>";
				html += "<th colspan='1' align='right'>Width (in)</th>";
				html += "<th colspan='1' align='right'>Length (in)</th>";
				html += "<th colspan='1' align='right'>STC Rating (W)</th>";
				html += "<th colspan='1' align='right'>PTC Rating (W)</th>";
				html += "<th colspan='1' align='right'>Labor (hr)</th>";
				html += "<th colspan='1' align='right'>Cost ($)</th>";
				html += "<th colspan='1' align='right'>Price ($)</th>";
				html += "<th colspan='1' align='right'>Active</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// loop over each result
				var color = ["light","dark"];
				for(var i=0;i<json.data.length;i++) {
					// set active
					json.data[i].active = (json.data[i].active==1) ? "yes" : "no";
					html += "<tr id='mod"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-mod"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i]);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There are no PV Modules in your system at the moment.</p>");
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// create the row
		var row = "<td colspan='1'>";
		row += "<span style='font-weight:bold;'>"+data.mod_model_num+"</span><br />";
		row += "<span class='edit-panel'>";
		row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a> | ";
		row += "<a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>";
		row += "</span>";
		row += "</td>";
		row += "<td colspan='1' align='right'>"+data.mod_width+"</td>";
		row += "<td colspan='1' align='right'>"+data.mod_length+"</td>";
		row += "<td colspan='1' align='right'>"+data.mod_stc+"</td>";
		row += "<td colspan='1' align='right'>"+data.mod_ptc+"</td>";
		row += "<td colspan='1' align='right'>"+data.mod_labor+"</td>";
		row += "<td colspan='1' align='right'>"+data.mod_cost+"</td>";
		row += "<td colspan='1' align='right'>"+data.mod_price+"</td>";
		row += "<td colspan='1' align='right'>"+data.active+"</td>";
		return row;
	},
	editRowContent:function(data) {
		this._super();
		// create the edit row
		var sel_yes = (data.active=="yes") ? "selected='selected'" : "";
		var sel_no = (data.active=="no") ? "selected='selected'" : "";
		var edit = "<td colspan='10'>";
		edit += "<form class='updateform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='mod_model_num'>Model #</label> \
						<input class='required' type='text' id='mod_model_num' value='"+data.mod_model_num+"' /> \
						<label for='mod_desc'>Description</label> \
						<input class='required' type='text' id='mod_desc' value='"+data.mod_desc+"' /> \
						<label for='mod_width'>Width (in)</label> \
						<input class='required' type='text' id='mod_width' value='"+data.mod_width+"' /> \
						<label for='mod_length'>Length (in)</label> \
						<input class='required' type='text' id='mod_length' value='"+data.mod_length+"' /> \
						<label for='mod_stc'>STC Rating (W)</label> \
						<input class='required' type='text' id='mod_stc' value='"+data.mod_stc+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='mod_ptc'>PTC Rating (W)</label> \
						<input class='required' type='text' id='mod_ptc' value='"+data.mod_ptc+"' /> \
						<label for='mod_labor'>Base Install Labor (hrs)</label> \
						<input class='required' type='text' id='mod_labor' value='"+data.mod_labor+"' /> \
						<label for='mod_unit'>Price Unit</label> \
						<input class='required' type='text' id='mod_unit' value='"+data.mod_unit+"' /> \
						<label for='mod_cost'>Cost ($)</label> \
						<input class='required' type='text' id='mod_cost' value='"+data.mod_cost+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='mod_price'>Price ($)</label> \
						<input class='required' type='text' id='mod_price' value='"+data.mod_price+"' /> \
						<label for='mod_cutsheet_uri'>Cutsheet URI</label> \
						<input type='text' id='mod_cutsheet_uri' value='"+data.mod_cutsheet_uri+"' /> \
						<label for='mod_cutsheet_t_uri'>Cutsheet Thumb URI</label> \
						<input type='text' id='mod_cutsheet_t_uri' value='"+data.mod_cutsheet_t_uri+"' /> \
						<label for='mod_print_cutsheet_uri'>Cutsheet Print URI(s)</label> \
						<input type='text' id='mod_print_cutsheet_uri' value='"+data.mod_print_cutsheet_uri+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='1' "+sel_yes+">yes</option> \
							<option value='0' "+sel_no+">no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	}
});
///////////////////////////////////////////////////////////////////////////// inverters : super
var Inverters = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// new item
		$("a[title='New']",$(t.el)).live("click",function() {
			$(".dashboard-item-content",$(t.el)).html(t.itemForm());
		});
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&es_do=browseAll");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"table="+t.dbTable+"&es_do=addItem");
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=updateItem");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			if(!confirm("Are you sure you want to delete this item? This cannot be undone.")) return false;
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=deleteItem");
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function() { 
		this._super(); 
		this.show(".dashboard-right"); 
		// get all the modules
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<a href='javascript:void(0);' class='dashboard-link' title='New'>+</a> \
						<h1 class='dashboard-header'>Inverters</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_inverters",
	dbOrder:"inv_model_num",
	itemForm:function() {
		this._super();
		// returns the form
		return "<form class='addform' action='javascript:void(0);'> \
					<h1 class='addform-header'>New Inverter Info:</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='inv_model_num'>Model #</label> \
						<input class='required' type='text' id='inv_model_num' value='' /> \
						<label for='inv_desc'>Description</label> \
						<input class='required' type='text' id='inv_desc' value='' /> \
						<label for='inv_width'>Type</label> \
						<select class='required' id='inv_type'> \
							<option value='' selected='selected'>--select--</option> \
							<option value='micro'>micro</option> \
							<option value='central'>central</option> \
						</select> \
						<label for='inv_unit'>Price Unit</label> \
						<input class='required' type='text' id='inv_unit' value='' /> \
					</div> \
					<div class='form-column'> \
						<label for='inv_cost'>Cost ($)</label> \
						<input class='required' type='text' id='inv_cost' value='' /> \
						<label for='inv_price'>Price ($)</label> \
						<input class='required' type='text' id='inv_price' value='' /> \
						<label for='inv_cutsheet_uri'>Cutsheet URI</label> \
						<input type='text' id='inv_cutsheet_uri' value='' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='inv_cutsheet_t_uri'>Cutsheet Thumb URI</label> \
						<input type='text' id='inv_cutsheet_t_uri' value='' /> \
						<label for='inv_print_cutsheet_uri'>Cutsheet Print URI(s)</label> \
						<input type='text' id='inv_print_cutsheet_uri' value='' /> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='' selected='selected'>--select--</option> \
							<option value='1'>yes</option> \
							<option value='0'>no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Add' value='Add New' /> \
					<input type='submit' title='Cancel' value='Cancel' /> \
				</form>";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
				break;
			case this.dbTable+" updated" :
				// set active
				json.data.active = (json.data.active==1) ? "yes" : "no";
				$("#inv"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-inv"+this.currentRowID).html(this.editRowContent(json.data)).hide();
				break;
			case this.dbTable+" deleted" :
				$("#inv"+this.currentRowID).remove();
				$("#edit-inv"+this.currentRowID).remove();
				break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>Model #</th>";
				html += "<th colspan='1'>Description</th>";
				html += "<th colspan='1' align='right'>Type</th>";
				html += "<th colspan='1' align='right'>Cost ($)</th>";
				html += "<th colspan='1' align='right'>Price ($)</th>";
				html += "<th colspan='1' align='right'>Active</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// loop over each result
				var color = ["light","dark"];
				for(var i=0;i<json.data.length;i++) {
					// set active
					json.data[i].active = (json.data[i].active==1) ? "yes" : "no";
					html += "<tr id='inv"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-inv"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i]);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There are no Inverters in your system at the moment.</p>");
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// create the row
		var row = "<td colspan='1'>";
		row += "<span style='font-weight:bold;'>"+data.inv_model_num+"</span><br />";
		row += "<span class='edit-panel'>";
		row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a> | ";
		row += "<a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>";
		row += "</span>";
		row += "</td>";
		row += "<td colspan='1'>"+data.inv_desc+"</td>";
		row += "<td colspan='1' align='right'>"+data.inv_type+"</td>";
		row += "<td colspan='1' align='right'>"+data.inv_cost+"</td>";
		row += "<td colspan='1' align='right'>"+data.inv_price+"</td>";
		row += "<td colspan='1' align='right'>"+data.active+"</td>";
		return row;
	},
	editRowContent:function(data) {
		this._super();
		// create the edit row
		var sel_micro = (data.inv_type=="micro") ? "selected='selected'" : "";
		var sel_central = (data.inv_type=="central") ? "selected='selected'" : "";
		var sel_yes = (data.active=="yes") ? "selected='selected'" : "";
		var sel_no = (data.active=="no") ? "selected='selected'" : "";
		var edit = "<td colspan='6'>";
		edit += "<form class='updateform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='inv_model_num'>Model #</label> \
						<input class='required' type='text' id='inv_model_num' value='"+data.inv_model_num+"' /> \
						<label for='inv_desc'>Description</label> \
						<input class='required' type='text' id='inv_desc' value='"+data.inv_desc+"' /> \
						<label for='inv_type'>Type</label> \
						<select class='required' id='inv_type'> \
							<option value='micro' "+sel_micro+">micro</option> \
							<option value='central' "+sel_central+">central</option> \
						</select> \
						<label for='inv_unit'>Price Unit</label> \
						<input class='required' type='text' id='inv_unit' value='"+data.inv_unit+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='inv_cost'>Cost ($)</label> \
						<input class='required' type='text' id='inv_cost' value='"+data.inv_cost+"' /> \
						<label for='inv_price'>Price ($)</label> \
						<input class='required' type='text' id='inv_price' value='"+data.inv_price+"' /> \
						<label for='inv_cutsheet_uri'>Cutsheet URI</label> \
						<input type='text' id='inv_cutsheet_uri' value='"+data.inv_cutsheet_uri+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='inv_cutsheet_t_uri'>Cutsheet Thumb URI</label> \
						<input type='text' id='inv_cutsheet_t_uri' value='"+data.inv_cutsheet_t_uri+"' /> \
						<label for='inv_print_cutsheet_uri'>Cutsheet Print URI(s)</label> \
						<input type='text' id='inv_print_cutsheet_uri' value='"+data.inv_print_cutsheet_uri+"' /> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='1' "+sel_yes+">yes</option> \
							<option value='0' "+sel_no+">no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	}
});
/////////////////////////////////////////////////////////////////////////////// racking : super
var Racking = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// new item
		$("a[title='New']",$(t.el)).live("click",function() {
			$(".dashboard-item-content",$(t.el)).html(t.itemForm());
		});
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&es_do=browseAll");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"table="+t.dbTable+"&es_do=addItem");
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=updateItem");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			if(!confirm("Are you sure you want to delete this item? This cannot be undone.")) return false;
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=deleteItem");
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function() {
		this._super(); 
		this.show(".dashboard-left"); 
		// get all the modules
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<a href='javascript:void(0);' class='dashboard-link' title='New'>+</a> \
						<h1 class='dashboard-header'>Racking</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_racking",
	dbOrder:"rac_model_num",
	itemForm:function() {
		this._super();
		// returns the form
		return "<form class='addform' action='javascript:void(0);'> \
					<h1 class='addform-header'>New Racking Info:</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='rac_model_num'>Model #</label> \
						<input class='required' type='text' id='rac_model_num' value='' /> \
						<label for='rac_desc'>Description</label> \
						<input class='required' type='text' id='rac_desc' value='' /> \
					</div> \
					<div class='form-column'> \
						<label for='rac_unit'>Price Unit</label> \
						<input class='required' type='text' id='rac_unit' value='' /> \
						<label for='rac_cost'>Cost ($)</label> \
						<input class='required' type='text' id='rac_cost' value='' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='rac_price'>Price ($)</label> \
						<input class='required' type='text' id='rac_price' value='' /> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='' selected='selected'>--select--</option> \
							<option value='1'>yes</option> \
							<option value='0'>no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Add' value='Add New' /> \
					<input type='submit' title='Cancel' value='Cancel' /> \
				</form>";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
				break;
			case this.dbTable+" updated" :
				// set active
				json.data.active = (json.data.active==1) ? "yes" : "no";
				$("#rac"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-rac"+this.currentRowID).html(this.editRowContent(json.data)).hide();
				break;
			case this.dbTable+" deleted" :
				$("#rac"+this.currentRowID).remove();
				$("#edit-rac"+this.currentRowID).remove();
				break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>Model #</th>";
				html += "<th colspan='1'>Description</th>";
				html += "<th colspan='1' align='right'>Cost ($)</th>";
				html += "<th colspan='1' align='right'>Price ($)</th>";
				html += "<th colspan='1' align='right'>Active</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// loop over each result
				var color = ["light","dark"];
				for(var i=0;i<json.data.length;i++) {
					// set active
					json.data[i].active = (json.data[i].active==1) ? "yes" : "no";
					html += "<tr id='rac"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-rac"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i]);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There is no Racking in your system at the moment.</p>");
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// create the row
		var row = "<td colspan='1'>";
		row += "<span style='font-weight:bold;'>"+data.rac_model_num+"</span><br />";
		row += "<span class='edit-panel'>";
		row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a> | ";
		row += "<a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>";
		row += "</span>";
		row += "</td>";
		row += "<td colspan='1'>"+data.rac_desc+"</td>";
		row += "<td colspan='1' align='right'>"+data.rac_cost+"</td>";
		row += "<td colspan='1' align='right'>"+data.rac_price+"</td>";
		row += "<td colspan='1' align='right'>"+data.active+"</td>";
		return row;
	},
	editRowContent:function(data) {
		this._super();
		// create the edit row
		var sel_yes = (data.active=="yes") ? "selected='selected'" : "";
		var sel_no = (data.active=="no") ? "selected='selected'" : "";
		var edit = "<td colspan='5'>";
		edit += "<form class='updateform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='rac_model_num'>Model #</label> \
						<input class='required' type='text' id='rac_model_num' value='"+data.rac_model_num+"' /> \
						<label for='rac_desc'>Description</label> \
						<input class='required' type='text' id='rac_desc' value='"+data.rac_desc+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='rac_unit'>Price Unit</label> \
						<input class='required' type='text' id='rac_unit' value='"+data.rac_unit+"' /> \
						<label for='rac_cost'>Cost ($)</label> \
						<input class='required' type='text' id='rac_cost' value='"+data.rac_cost+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='rac_price'>Price ($)</label> \
						<input class='required' type='text' id='rac_price' value='"+data.rac_price+"' /> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='1' "+sel_yes+">yes</option> \
							<option value='0' "+sel_no+">no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	}
});
///////////////////////////////////////////////////////////////// connection components : super
var Connects = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// new item
		$("a[title='New']",$(t.el)).live("click",function() {
			$(".dashboard-item-content",$(t.el)).html(t.itemForm());
		});
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&es_do=browseAll");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"table="+t.dbTable+"&es_do=addItem");
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=updateItem");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			if(!confirm("Are you sure you want to delete this item? This cannot be undone.")) return false;
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=deleteItem");
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function() { 
		this._super(); 
		this.show(".dashboard-left"); 
		// get all the modules
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<a href='javascript:void(0);' class='dashboard-link' title='New'>+</a> \
						<h1 class='dashboard-header'>Connection Components</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_conn_comps",
	dbOrder:"con_model_num",
	itemForm:function() {
		this._super();
		// returns the form
		return "<form class='addform' action='javascript:void(0);'> \
					<h1 class='addform-header'>New Component Info:</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='con_model_num'>Model #</label> \
						<input class='required' type='text' id='con_model_num' value='' /> \
						<label for='con_desc'>Description</label> \
						<input class='required' type='text' id='con_desc' value='' /> \
					</div> \
					<div class='form-column'> \
						<label for='con_unit'>Price Unit</label> \
						<input class='required' type='text' id='con_unit' value='' /> \
						<label for='con_cost'>Cost ($)</label> \
						<input class='required' type='text' id='con_cost' value='' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='con_price'>Price ($)</label> \
						<input class='required' type='text' id='con_price' value='' /> \
						<label for='con_labor'>Labor (hrs/20')</label> \
						<input class='required' type='text' id='con_labor' value='' /> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='' selected='selected'>--select--</option> \
							<option value='1'>yes</option> \
							<option value='0'>no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Add' value='Add New' /> \
					<input type='submit' title='Cancel' value='Cancel' /> \
				</form>";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
				break;
			case this.dbTable+" updated" :
				// set active
				json.data.active = (json.data.active==1) ? "yes" : "no";
				$("#con"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-con"+this.currentRowID).html(this.editRowContent(json.data)).hide();
				break;
			case this.dbTable+" deleted" :
				$("#con"+this.currentRowID).remove();
				$("#edit-con"+this.currentRowID).remove();
				break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>Model #</th>";
				html += "<th colspan='1'>Description</th>";
				html += "<th colspan='1' align='right'>Cost ($)</th>";
				html += "<th colspan='1' align='right'>Price ($)</th>";
				html += "<th colspan='1' align='right'>Labor (hrs/20')</th>";
				html += "<th colspan='1' align='right'>Active</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// loop over each result
				var color = ["light","dark"];
				for(var i=0;i<json.data.length;i++) {
					// set active
					json.data[i].active = (json.data[i].active==1) ? "yes" : "no";
					html += "<tr id='con"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-con"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i]);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There are no Connection Components in your system at the moment.</p>");
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// create the row
		var row = "<td colspan='1'>";
		row += "<span style='font-weight:bold;'>"+data.con_model_num+"</span><br />";
		row += "<span class='edit-panel'>";
		row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a> | ";
		row += "<a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>";
		row += "</span>";
		row += "</td>";
		row += "<td colspan='1'>"+data.con_desc+"</td>";
		row += "<td colspan='1' align='right'>"+data.con_cost+"</td>";
		row += "<td colspan='1' align='right'>"+data.con_price+"</td>";
		row += "<td colspan='1' align='right'>"+data.con_labor+"</td>";
		row += "<td colspan='1' align='right'>"+data.active+"</td>";
		return row;
	},
	editRowContent:function(data) {
		this._super();
		// create the edit row
		var sel_yes = (data.active=="yes") ? "selected='selected'" : "";
		var sel_no = (data.active=="no") ? "selected='selected'" : "";
		var edit = "<td colspan='6'>";
		edit += "<form class='updateform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='con_model_num'>Model #</label> \
						<input class='required' type='text' id='con_model_num' value='"+data.con_model_num+"' /> \
						<label for='con_desc'>Description</label> \
						<input class='required' type='text' id='con_desc' value='"+data.con_desc+"' /> \
						<label for='con_unit'>Price Unit</label> \
						<input class='required' type='text' id='con_unit' value='"+data.con_unit+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='con_cost'>Cost ($)</label> \
						<input class='required' type='text' id='con_cost' value='"+data.con_cost+"' /> \
						<label for='con_price'>Price ($)</label> \
						<input class='required' type='text' id='con_price' value='"+data.con_price+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='con_labor'>Labor (hrs/20')</label> \
						<input class='required' type='text' id='con_labor' value='"+data.con_labor+"' /> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='1' "+sel_yes+">yes</option> \
							<option value='0' "+sel_no+">no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	}
});
//////////////////////////////////////////////////////////// interconnection components : super
var Inters = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// new item
		$("a[title='New']",$(t.el)).live("click",function() {
			$(".dashboard-item-content",$(t.el)).html(t.itemForm());
		});
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&es_do=browseAll");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"table="+t.dbTable+"&es_do=addItem");
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=updateItem");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			if(!confirm("Are you sure you want to delete this item? This cannot be undone.")) return false;
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=deleteItem");
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function() { 
		this._super(); 
		this.show(".dashboard-left"); 
		// get all the modules
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<a href='javascript:void(0);' class='dashboard-link' title='New'>+</a> \
						<h1 class='dashboard-header'>Interconnection Components</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_inter_comps",
	dbOrder:"int_model_num",
	itemForm:function() {
		this._super();
		// returns the form
		return "<form class='addform' action='javascript:void(0);'> \
					<h1 class='addform-header'>New Component Info:</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='int_model_num'>Model #</label> \
						<input class='required' type='text' id='int_model_num' value='' /> \
						<label for='int_desc'>Description</label> \
						<input class='required' type='text' id='int_desc' value='' /> \
					</div> \
					<div class='form-column'> \
						<label for='int_unit'>Price Unit</label> \
						<input class='required' type='text' id='int_unit' value='' /> \
						<label for='int_cost'>Cost ($)</label> \
						<input class='required' type='text' id='int_cost' value='' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='int_price'>Price ($)</label> \
						<input class='required' type='text' id='int_price' value='' /> \
						<label for='int_labor'>Labor (hrs/module)</label> \
						<input class='required' type='text' id='int_labor' value='' /> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='' selected='selected'>--select--</option> \
							<option value='1'>yes</option> \
							<option value='0'>no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Add' value='Add New' /> \
					<input type='submit' title='Cancel' value='Cancel' /> \
				</form>";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&es_do=browseAll");
				break;
			case this.dbTable+" updated" :
				// set active
				json.data.active = (json.data.active==1) ? "yes" : "no";
				$("#int"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-int"+this.currentRowID).html(this.editRowContent(json.data)).hide();
				break;
			case this.dbTable+" deleted" :
				$("#int"+this.currentRowID).remove();
				$("#edit-int"+this.currentRowID).remove();
				break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>Model #</th>";
				html += "<th colspan='1'>Description</th>";
				html += "<th colspan='1' align='right'>Cost ($)</th>";
				html += "<th colspan='1' align='right'>Price ($)</th>";
				html += "<th colspan='1' align='right'>Labor (hrs/module)</th>";
				html += "<th colspan='1' align='right'>Active</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// loop over each result
				var color = ["light","dark"];
				for(var i=0;i<json.data.length;i++) {
					// set active
					json.data[i].active = (json.data[i].active==1) ? "yes" : "no";
					html += "<tr id='int"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-int"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i]);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There are no Interconnection Components in your system at the moment.</p>");
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// create the row
		var row = "<td colspan='1'>";
		row += "<span style='font-weight:bold;'>"+data.int_model_num+"</span><br />";
		row += "<span class='edit-panel'>";
		row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a> | ";
		row += "<a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>";
		row += "</span>";
		row += "</td>";
		row += "<td colspan='1'>"+data.int_desc+"</td>";
		row += "<td colspan='1' align='right'>"+data.int_cost+"</td>";
		row += "<td colspan='1' align='right'>"+data.int_price+"</td>";
		row += "<td colspan='1' align='right'>"+data.int_labor+"</td>";
		row += "<td colspan='1' align='right'>"+data.active+"</td>";
		return row;
	},
	editRowContent:function(data) {
		this._super();
		// create the edit row
		var sel_yes = (data.active=="yes") ? "selected='selected'" : "";
		var sel_no = (data.active=="no") ? "selected='selected'" : "";
		var edit = "<td colspan='6'>";
		edit += "<form class='updateform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='int_model_num'>Model #</label> \
						<input class='required' type='text' id='int_model_num' value='"+data.int_model_num+"' /> \
						<label for='int_desc'>Description</label> \
						<input class='required' type='text' id='int_desc' value='"+data.int_desc+"' /> \
						<label for='int_unit'>Price Unit</label> \
						<input class='required' type='text' id='int_unit' value='"+data.int_unit+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='int_cost'>Cost ($)</label> \
						<input class='required' type='text' id='int_cost' value='"+data.int_cost+"' /> \
						<label for='int_price'>Price ($)</label> \
						<input class='required' type='text' id='int_price' value='"+data.int_price+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='int_labor'>Labor (hrs/module)</label> \
						<input class='required' type='text' id='int_labor' value='"+data.int_labor+"' /> \
						<label for='active'>Active</label> \
						<select class='required' id='active'> \
							<option value='1' "+sel_yes+">yes</option> \
							<option value='0' "+sel_no+">no</option> \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	}
});
///////////////////////////////////////////////////////////////////////////// settings : office
var Settings = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$(this.parentNode.parentNode.parentNode).hide();
			$(this.parentNode.parentNode.parentNode.nextElementSibling).show();
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$(this.parentNode.parentNode.parentNode).hide();
			$(this.parentNode.parentNode.parentNode.previousElementSibling).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"&table="+t.dbTable+"&row="+$('#data').data('rep').rep_officeID+"&es_do=updateCells");
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function() {
		this._super();
		this.show(".dashboard-left");
		// get all the modules
		this.io.request(this,"table="+this.dbTable+"&id="+$('#data').data('rep').rep_officeID+"&es_do=getItem");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<h1 class='dashboard-header'>"+$("#data").data("city")+" Settings</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_offices",
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" updated" :
				for(setting in json.data) {
					var row = ""; var edit = "";
					switch(setting) {
						case "off_phone" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Office Phone Number</span><br /><span style='font-size:10px; color:#808080;'>(Your office-wide phone number.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_phone+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_phone'>Office Phone Number</label>";
							edit +=	"<input class='required' type='text' id='off_phone' value='"+json.data.off_phone+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_email" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Office E-mail Address</span><br /><span style='font-size:10px; color:#808080;'>(Used for general inquiries.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_email+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_email'>Office E-mail Address</label>";
							edit +=	"<input class='required' type='text' id='off_email' value='"+json.data.off_email+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_manager_list" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>General Manager's List Address</span><br /><span style='font-size:10px; color:#808080;'>(This list receives monitoring requests and notifications.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_manager_list+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_manager_list'>General Manager's List Address</label>";
							edit +=	"<input class='required' type='text' id='off_manager_list' value='"+json.data.off_manager_list+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_labor_cost" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Labor Cost ($/hr)</span><br /><span style='font-size:10px; color:#808080;'>(Use this as an average.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_labor_cost+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_labor_cost'>Labor Cost ($/hr)</label>";
							edit +=	"<input class='required' type='text' id='off_labor_cost' value='"+json.data.off_labor_cost+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_labor_price" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Labor Price ($/hr)</span><br /><span style='font-size:10px; color:#808080;'>(Use this as an average.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_labor_price+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_labor_price'>Labor Price ($/hr)</label>";
							edit +=	"<input class='required' type='text' id='off_labor_price' value='"+json.data.off_labor_price+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_inventory_up" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Inventory Up-Charge (%)</span><br /><span style='font-size:10px; color:#808080;'>(This does NOT effect margins.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_inventory_up+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_inventory_up'>Inventory Up-Charge (%)</label>";
							edit +=	"<input class='required' type='text' id='off_inventory_up' value='"+json.data.off_inventory_up+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_non_inventory_up" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Non-Inventory Up-Charge (%)</span><br /><span style='font-size:10px; color:#808080;'>(This does NOT effect margins.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_non_inventory_up+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_non_inventory_up'>Non-Inventory Up-Charge (%)</label>";
							edit +=	"<input class='required' type='text' id='off_non_inventory_up' value='"+json.data.off_non_inventory_up+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_permit_up" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Permit Margin (%)</span><br /><span style='font-size:10px; color:#808080;'>(Determines the fixed margin.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_permit_up+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_permit_up'>Permit Margin (%)</label>";
							edit +=	"<input class='required' type='text' id='off_permit_up' value='"+json.data.off_permit_up+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_sub_up" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>SubContractor Margin (%)</span><br /><span style='font-size:10px; color:#808080;'>(Determines the fixed margin.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_sub_up+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_sub_up'>SubContractor Margin (%)</label>";
							edit +=	"<input class='required' type='text' id='off_sub_up' value='"+json.data.off_sub_up+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;	
						case "off_equip_up" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Equipment Rental Margin (%)</span><br /><span style='font-size:10px; color:#808080;'>(Determines the fixed margin.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_equip_up+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_equip_up'>Equipment Rental Margin (%)</label>";
							edit +=	"<input class='required' type='text' id='off_equip_up' value='"+json.data.off_equip_up+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;	
						case "off_winter_up" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Off-Season Up-Charge (%)</span><br /><span style='font-size:10px; color:#808080;'>(This effects total labor charge.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_winter_up+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_winter_up'>Off-Season Up-Charge (%)</label>";
							edit +=	"<input class='required' type='text' id='off_winter_up' value='"+json.data.off_winter_up+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_others_up" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Others-Involved Up-Charge (%)</span><br /><span style='font-size:10px; color:#808080;'>(This effects total labor charge.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>"+json.data.off_others_up+"</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<div class='form-column'>";
							edit +=	"<label for='off_others_up'>Others-Involved Up-Charge (%)</label>";
							edit +=	"<input class='required' type='text' id='off_others_up' value='"+json.data.off_others_up+"' />";
							edit +=	"</div>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;
						case "off_cover_letter" :
							row += "<td colspan='1'>";
							row += "<span style='font-weight:bold;'>Default Cover Letter</span><br /><span style='font-size:10px; color:#808080;'>(This is the generic text seen when creating proposals.)</span><br />";
							row += "<span class='edit-panel'>";
							row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
							row += "</span>";
							row += "</td>";
							row += "<td colspan='1' align='right'>&ldquo;"+json.data.off_cover_letter.substring(0,25)+"...&rdquo;</td>";
							edit += "<td colspan='2'>";
							edit += "<form class='updateform' action='javascript:void(0);'>";
							edit +=	"<h1 class='addform-header'>Quick Edit</h1>";
							edit +=	"<br />";
							edit +=	"<label for='off_cover_letter'>Default Cover Letter</label>";
							edit +=	"<textarea class='required' type='text' id='off_cover_letter' style='width:100%; height:200px;'>"+json.data.off_cover_letter+"</textarea>";
							edit +=	"<div class='clear'></div>";
							edit +=	"<br />";
							edit +=	"<input type='submit' title='Update' value='Update' />";
							edit +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
							edit +=	"</form>";
							edit += "</td>";
							break;	
					}
					$("#show-"+setting).html($(row)).show();
					$("#edit-"+setting).html($(edit)).hide();
				}
				break;
			case "got "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>Name / Description</th>";
				html += "<th colspan='1' align='right'>Value</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// manually write the table
				var color = ["light","dark"];
				///////////////////////////////////////////
				// phone
				html += "<tr id='show-off_phone' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Office Phone Number</span><br /><span style='font-size:10px; color:#808080;'>(Your office-wide phone number.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_phone+"</td>";
				html += "</tr>";
				// edit phone
				html += "<tr id='edit-off_phone' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_phone'>Office Phone Number</label>";
				html +=	"<input class='required' type='text' id='off_phone' value='"+json.data.off_phone+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// email
				html += "<tr id='show-off_email' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Office E-mail Address</span><br /><span style='font-size:10px; color:#808080;'>(Used for general inquiries.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_email+"</td>";
				html += "</tr>";
				// edit email
				html += "<tr id='edit-off_email' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_email'>Office E-mail Address</label>";
				html +=	"<input class='required' type='text' id='off_email' value='"+json.data.off_email+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// manager's list
				html += "<tr id='show-off_manager_list' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>General Manager's List Address</span><br /><span style='font-size:10px; color:#808080;'>(This list receives monitoring requests and notifications.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_manager_list+"</td>";
				html += "</tr>";
				// edit email
				html += "<tr id='edit-off_manager_list' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_manager_list'>General Manager's List Address</label>";
				html +=	"<input class='required' type='text' id='off_manager_list' value='"+json.data.off_manager_list+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// labor cost
				html += "<tr id='show-off_labor_cost' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Labor Cost ($/hr)</span><br /><span style='font-size:10px; color:#808080;'>(Use this as an average.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_labor_cost+"</td>";
				html += "</tr>";
				// edit labor cost
				html += "<tr id='edit-off_labor_cost' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_labor_cost'>Labor Cost ($/hr)</label>";
				html +=	"<input class='required' type='text' id='off_labor_cost' value='"+json.data.off_labor_cost+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// labor price
				html += "<tr id='show-off_labor_price' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Labor Price ($/hr)</span><br /><span style='font-size:10px; color:#808080;'>(Use this as an average.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_labor_price+"</td>";
				html += "</tr>";
				// edit labor price
				html += "<tr id='edit-off_labor_price' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_labor_price'>Labor Price ($/hr)</label>";
				html +=	"<input class='required' type='text' id='off_labor_price' value='"+json.data.off_labor_price+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// inventory
				html += "<tr id='show-off_inventory_up' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Inventory Up-Charge (%)</span><br /><span style='font-size:10px; color:#808080;'>(This does NOT effect margins.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_inventory_up+"</td>";
				html += "</tr>";
				// edit inventory
				html += "<tr id='edit-off_inventory_up' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_inventory_up'>Inventory Up-Charge (%)</label>";
				html +=	"<input class='required' type='text' id='off_inventory_up' value='"+json.data.off_inventory_up+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// non inventory
				html += "<tr id='show-off_non_inventory_up' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Non-Inventory Up-Charge (%)</span><br /><span style='font-size:10px; color:#808080;'>(This does NOT effect margins.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_non_inventory_up+"</td>";
				html += "</tr>";
				// edit non inventory
				html += "<tr id='edit-off_non_inventory_up' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_non_inventory_up'>Non-Inventory Up-Charge (%)</label>";
				html +=	"<input class='required' type='text' id='off_non_inventory_up' value='"+json.data.off_non_inventory_up+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// permit
				html += "<tr id='show-off_permit_up' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Permit Margin (%)</span><br /><span style='font-size:10px; color:#808080;'>(Determines the fixed margin.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_permit_up+"</td>";
				html += "</tr>";
				// edit permit
				html += "<tr id='edit-off_permit_up' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_permit_up'>Permit Margin (%)</label>";
				html +=	"<input class='required' type='text' id='off_permit_up' value='"+json.data.off_permit_up+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// subcontractor
				html += "<tr id='show-off_sub_up' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Subcontractor Margin (%)</span><br /><span style='font-size:10px; color:#808080;'>(Determines the fixed margin.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_sub_up+"</td>";
				html += "</tr>";
				// edit subcontractor
				html += "<tr id='edit-off_sub_up' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_sub_up'>Subcontractor Margin (%)</label>";
				html +=	"<input class='required' type='text' id='off_sub_up' value='"+json.data.off_sub_up+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// equipment
				html += "<tr id='show-off_equip_up' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Equipment Rental Margin (%)</span><br /><span style='font-size:10px; color:#808080;'>(Determines the fixed margin.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_equip_up+"</td>";
				html += "</tr>";
				// edit equip
				html += "<tr id='edit-off_equip_up' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_equip_up'>Equipment Rental Margin (%)</label>";
				html +=	"<input class='required' type='text' id='off_equip_up' value='"+json.data.off_equip_up+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// off-season
				html += "<tr id='show-off_winter_up' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Off-Season Up-Charge (%)</span><br /><span style='font-size:10px; color:#808080;'>(This effects total labor charge.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_winter_up+"</td>";
				html += "</tr>";
				// edit off-season
				html += "<tr id='edit-off_winter_up' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_winter_up'>Off-Season Up-Charge (%)</label>";
				html +=	"<input class='required' type='text' id='off_winter_up' value='"+json.data.off_winter_up+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// others involved
				html += "<tr id='show-off_others_up' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Others-Involved Up-Charge (%)</span><br /><span style='font-size:10px; color:#808080;'>(This effects total labor charge.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>"+json.data.off_others_up+"</td>";
				html += "</tr>";
				// edit others involved
				html += "<tr id='edit-off_others_up' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<div class='form-column'>";
				html +=	"<label for='off_others_up'>Others-Involved Up-Charge (%)</label>";
				html +=	"<input class='required' type='text' id='off_others_up' value='"+json.data.off_others_up+"' />";
				html +=	"</div>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				// cover letter
				html += "<tr id='show-off_cover_letter' class='"+color[0]+"'>";
				html += "<td colspan='1'>";
				html += "<span style='font-weight:bold;'>Default Cover Letter</span><br /><span style='font-size:10px; color:#808080;'>(This is the generic text seen when creating proposals.)</span><br />";
				html += "<span class='edit-panel'>";
				html += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				html += "</span>";
				html += "</td>";
				html += "<td colspan='1' align='right'>&ldquo;"+json.data.off_cover_letter.substring(0,25)+"...&rdquo;</td>";
				html += "</tr>";
				// edit cover letter
				html += "<tr id='edit-off_cover_letter' style='display:none;' class='quick-edit "+color[0]+"'>";
				html += "<td colspan='2'>";
				html += "<form class='updateform' action='javascript:void(0);'>";
				html +=	"<h1 class='addform-header'>Quick Edit</h1>";
				html +=	"<br />";
				html +=	"<label for='off_cover_letter'>Default Cover Letter</label>";
				html +=	"<textarea class='required' type='text' id='off_cover_letter' style='width:100%; height:200px;'>"+json.data.off_cover_letter+"</textarea>";
				html +=	"<div class='clear'></div>";
				html +=	"<br />";
				html +=	"<input type='submit' title='Update' value='Update' />";
				html +=	"<input type='submit' title='CancelQ' value='Cancel' style='margin-left:3px;' />";
				html +=	"</form>";
				html += "</td>";
				html += "</tr>";
				///////////////////////////////////////////
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	}
});
/////////////////////////////////////////////////////////////////////////// sales reps : office
var Reps = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// new item
		$("a[title='New']",$(t.el)).live("click",function() {
			$(".dashboard-item-content",$(t.el)).html(t.itemForm());
		});
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&wc=rep_officeID='"+$('#data').data('rep').rep_officeID+"'!!(rep_role='2'::rep_role='3')&es_do=browseAll");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			if($("#rep_pass_confirm").val()!=$("#rep_pass").val()) $("#rep_pass_confirm").val(""); 
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			ds += $("#rep_is_admin").attr("checked") ? "rep_role=2&" : "rep_role=3&";
			$("#data").data("rep_pass_txt",$("#rep_pass").val());
			$(".dashboard-item-content",$(t.el)).html("<p style='padding:10px; color:#808080;'>Loading...</p>");
			t.io.request(t,ds+"table="+t.dbTable+"&rep_officeID="+$('#data').data('rep').rep_officeID+"&es_do=addRep");
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			ds += $("#rep_is_admin-"+t.currentRowID).attr("checked") ? "rep_role=2&" : "rep_role=3&";
			if($("#rep_pass-"+t.currentRowID).val()!="") {
				if($("#rep_pass_confirm-"+t.currentRowID).val()!=$("#rep_pass-"+t.currentRowID).val()) { 
					$("#rep_pass_confirm-"+t.currentRowID).val("");
					$("label[for='rep_pass_confirm-"+t.currentRowID+"']").css("color","red");
					return false;
				} else {
					ds += "rep_login="+$("#rep"+t.currentRowID).data("rep_login")+"&";
					ds += "rep_pass="+$("#rep_pass-"+t.currentRowID).val()+"&";
					$("#data").data("rep_pass_txt",$("#rep_pass-"+t.currentRowID).val());
					$(this.parentNode.parentNode.parentNode).html("<td colspan='2'><p style='padding:10px; color:#808080;'>Loading...</p></td>");
				}
			} else if($("#rep_pass_confirm-"+t.currentRowID).val()!="") {
				$("#rep_pass_confirm-"+t.currentRowID).val("");
				$("label[for='rep_pass-"+t.currentRowID+"']").css("color","red");
				return false;
			}
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=updateRep");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			if(!confirm("Are you sure you want to delete this item and all of its dependents? This cannot be undone.")) return false;
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=deleteItem");
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function() {
		this._super(); 
		this.show(".dashboard-right");
		// get all the modules
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc=rep_officeID='"+$('#data').data('rep').rep_officeID+"'!!(rep_role='2'::rep_role='3')&es_do=browseAll");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<a href='javascript:void(0);' class='dashboard-link' title='New'>+</a> \
						<h1 class='dashboard-header'>"+$("#data").data("city")+" Sales Reps</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_reps",
	dbOrder:"rep_name_last",
	itemForm:function() {
		this._super();
		// returns the form
		return "<form class='addform' action='javascript:void(0);'> \
					<h1 class='addform-header'>New Sales Rep Info:</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='rep_name_first'>First Name</label> \
						<input class='required' type='text' id='rep_name_first' value='' /> \
						<label for='rep_name_last'>Last Name</label> \
						<input class='required' type='text' id='rep_name_last' value='' /> \
						<label for='rep_title'>Title</label> \
						<input class='required' type='text' id='rep_title' value='Technical Sales Engineer' /> \
					</div> \
					<div class='form-column'> \
						<label for='rep_phone'>Cell Phone</label> \
						<input type='text' id='rep_phone' value='' /> \
						<label for='rep_email'>Email</label> \
						<input class='required' type='text' id='rep_email' value='' /> \
						<label for='rep_login'>Username</label> \
						<input class='required' type='text' id='rep_login' value='' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='rep_pass'>Password</label> \
						<input class='required' type='password' id='rep_pass' value='' /> \
						<label for='rep_pass_confirm'>Confirm Password</label> \
						<input class='required' type='password' id='rep_pass_confirm' value='' /> \
						<input style='display:inline; margin-top:18px;' type='checkbox' class='no-postify' id='rep_is_admin' value='' /> Grant Admin privileges? \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Add' value='Add New' /> \
					<input type='submit' title='Cancel' value='Cancel' /> \
				</form>";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc=rep_officeID='"+$('#data').data('rep').rep_officeID+"'!!(rep_role='2'::rep_role='3')&es_do=browseAll");
				// notify rep
				this.io.request(this,"id="+json.data+"&type=new&pass="+$('#data').data('rep_pass_txt')+"&es_do=notifyRep");
				// clear pass
				$("#data").data("rep_pass_txt",null);
				break;
			case this.dbTable+" updated" :
				$("#rep"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-rep"+this.currentRowID).html(this.editRowContent(json.data)).hide();
				// notify rep if pass change
				if($("#data").data("rep_pass_txt")) this.io.request(this,"id="+json.data.ID+"&type=update&pass="+$('#data').data('rep_pass_txt')+"&es_do=notifyRep");
				// clear pass
				$("#data").data("rep_pass_txt",null);
				break;
			case this.dbTable+" deleted" :
				$("#rep"+this.currentRowID).remove();
				$("#edit-rep"+this.currentRowID).remove();
				break;
			case "rep notified" : break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>Username</th>";
				html += "<th colspan='1'>Email</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// loop over each result
				var color = ["light","dark"];
				for(var i=0;i<json.data.length;i++) {
					html += "<tr id='rep"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-rep"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i]);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				// save logins
				for(var i=0;i<json.data.length;i++) $("#rep"+json.data[i].ID).data("rep_login",json.data[i].rep_login);
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There are no Sales Representatives in your system at the moment.</p>");
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// create the row
		var row = "<td colspan='1'>";
		row += "<span style='font-weight:bold;'>"+data.rep_login+"</span><br />";
		row += "<span class='edit-panel'>";
		row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a> | ";
		row += "<a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>";
		row += "</span>";
		row += "</td>";
		row += "<td colspan='1'>"+data.rep_email+"</td>";
		//row += "<td colspan='1' align='right'>"+data.rep_num_props+"</td>";
		return row;
	},
	editRowContent:function(data) {
		this._super();
		// checkboxes
		var rep_is_admin_checked = (data.rep_role==2) ? "checked='checked'" : "";
		// create the edit row
		var edit = "<td colspan='2'>";
		edit += "<form class='updateform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='rep_name_first'>First Name</label> \
						<input class='required' type='text' id='rep_name_first' value='"+data.rep_name_first+"' /> \
						<label for='rep_name_last'>Last Name</label> \
						<input class='required' type='text' id='rep_name_last' value='"+data.rep_name_last+"' /> \
						<label for='rep_title'>Title</label> \
						<input class='required' type='text' id='rep_title' value='"+data.rep_title+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='rep_phone'>Cell Phone</label> \
						<input type='text' id='rep_phone' value='"+data.rep_phone+"' /> \
						<label for='rep_email'>Email</label> \
						<input class='required' type='text' id='rep_email' value='"+data.rep_email+"' /> \
						<input style='display:inline; margin-top:18px;' type='checkbox' class='no-postify' id='rep_is_admin-"+data.ID+"' value='' "+rep_is_admin_checked+" /> Grant Admin privileges? \
					</div> \
					<div class='form-column-right'> \
						<label for='rep_pass-"+data.ID+"'>New Password</label> \
						<input type='password' class='no-postify' id='rep_pass-"+data.ID+"' value='' /> \
						<label for='rep_pass_confirm-"+data.ID+"'>Confirm New Password</label> \
						<input type='password' class='no-postify' id='rep_pass_confirm-"+data.ID+"' value='' /> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	}
});
////////////////////////////////////////////////////////////////////////////// customers : reps
var Customers = Module.extend({
	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// search items
		$(".dashboard-search",$(t.el)).live("keyup",function() {
			if(this.value=="") t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&wc=cus_officeID='"+$('#data').data('rep').rep_officeID+"'&es_do=browseAll");
			else t.io.request(t,"table="+t.dbTable+"&phrase="+this.value+"&fulltext="+t.dbFulltext+"&wc=cus_officeID='"+$('#data').data('rep').rep_officeID+"'&es_do=search");
		});
		$(".dashboard-search",$(t.el)).live("focus",function() {
			if(this.value=="search...") $(".dashboard-search",$(t.el)).val("").css("color","#404040");
		});
		$(".dashboard-search",$(t.el)).live("blur",function() {
			if(this.value=="") $(".dashboard-search",$(t.el)).val("search...").css("color","#808080");
		});
		// new item
		$("a[title='New']",$(t.el)).live("click",function() {
			$(".dashboard-item-content",$(t.el)).html(t.itemForm());
		});
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&wc=cus_officeID='"+$('#data').data('rep').rep_officeID+"'&es_do=browseAll");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			ds += "cus_officeID="+$("#data").data("rep").rep_officeID+"&";
			ds += "cus_repID="+$("#data").data("rep").ID+"&";
			t.io.request(t,ds+"&table="+t.dbTable+"&es_do=addCustomer");
		});
		// add new job
		$("input[title='NewJob']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.id).addClass("selected-row");
			$("#data").data("customer",this.parentNode.parentNode);
			$(".dashboard-item-content",$(t.jobs.el)).html(t.jobs.itemForm($("#"+this.parentNode.parentNode.id).data("info")));
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
			//$.scrollTo("#edit-"+this.parentNode.parentNode.parentNode.id,500);
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=updateItem");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			// get dependents
			t.io.request(t,"caller="+t.dbTable+"&id="+t.currentRowID+"&tables=es_jobs,es_zones,es_proposals&columns=job_customerID,zon_customerID,pro_customerID&es_do=getDependents");
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function(refresh) { 
		if(!refresh) {
			this._super(); 
			this.show(".dashboard-bar-left");
		}
		// get all
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc=cus_officeID='"+$('#data').data('rep').rep_officeID+"'&es_do=browseAll");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// disable creation if support role
		var adder = $("#data").data("role")!=4 ? "<a href='javascript:void(0);' class='dashboard-link' title='New'>+</a>" : "";
		var search_margin = $("#data").data("role")!=4 ? "" : "style='margin-right:4px;'";
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						"+adder+" \
						<input type='input' class='dashboard-search' value='search...' "+search_margin+" /> \
						<h1 class='dashboard-header'>"+$("#data").data("city")+" Contacts</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_customers",
	dbOrder:"cus_name_last",
	dbFulltext:"cus_name_first, cus_name_last, cus_company, cus_phone1, cus_phone2, cus_phone_mobile, cus_fax, cus_email1, cus_email2, cus_address1, cus_address2, cus_city, cus_state, cus_zip, cus_country",
	itemForm:function() {
		this._super();
		// returns the form
		return "<form class='addform' action='javascript:void(0);'> \
					<h1 class='addform-header'>New Contact Info:</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='cus_name_first'>First Name</label> \
						<input class='required input-short' type='text' id='cus_name_first' value='' /> \
						<label for='cus_name_last'>Last Name</label> \
						<input class='required input-short' type='text' id='cus_name_last' value='' /> \
						<label for='cus_company'>Company</label> \
						<input class='input-short' type='text' id='cus_company' value='' /> \
						<label for='cus_phone1'>Phone 1</label> \
						<input class='input-short' type='text' id='cus_phone1' value='' /> \
						<label for='cus_phone2'>Phone 2</label> \
						<input class='input-short' type='text' id='cus_phone2' value='' /> \
						<label for='cus_phone_mobile'>Phone Mobile</label> \
						<input class='input-short' type='text' id='cus_phone_mobile' value='' /> \
						<label for='cus_fax'>Fax</label> \
						<input class='input-short' type='text' id='cus_fax' value='' /> \
						<label for='cus_email1'>Email 1</label> \
						<input class='input-short' type='text' id='cus_email1' value='' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='cus_email2'>Email 2</label> \
						<input class='input-short' type='text' id='cus_email2' value='' /> \
						<label for='cus_address1'>Address 1</label> \
						<input class='input-short' type='text' id='cus_address1' value='' /> \
						<label for='cus_address2'>Address 2</label> \
						<input class='input-short' type='text' id='cus_address2' value='' /> \
						<label for='cus_city'>City</label> \
						<input class='input-short' type='text' id='cus_city' value='"+$("#data").data("city")+"' /> \
						<label for='cus_state'>State</label> \
						<input class='input-short' type='text' id='cus_state' value='"+$("#data").data("state")+"' /> \
						<label for='cus_zip'>Zip</label> \
						<input class='input-short' type='text' id='cus_zip' value='"+$("#data").data("zip")+"' /> \
						<label for='cus_country'>Country</label> \
						<input class='input-short' type='text' id='cus_country' value='United States' /> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Add' value='Add New' /> \
					<input type='submit' title='Cancel' value='Cancel' /> \
				</form>";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc=cus_officeID='"+$('#data').data('rep').rep_officeID+"'&es_do=browseAll");
				break;
			case this.dbTable+" updated" :
				$("#cus"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-cus"+this.currentRowID).html(this.editRowContent(json.data)).hide();
				break;
			case this.dbTable+" deleted" :
				$("#cus"+this.currentRowID).remove();
				$("#edit-cus"+this.currentRowID).remove();
				// hide dependents
				for(m in $("#data").data("deleting")) {
					for(i in $("#data").data("deleting")[m]) {
						var id = $("#data").data("deleting")[m][i];
						switch(m) {
							case "es_jobs" : $("#job"+id+",#edit-job"+id+",#view-job"+id).remove(); break;
							case "es_zones" : $("#zon"+id+",#edit-zon"+id).remove(); break;
							case "es_proposals" : $("#pro"+id+",#edit-pro"+id).remove(); break;
						}
					}
				}
				break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>Info</th>";
				html += "<th colspan='1' align='right'>&nbsp;</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// loop over each result
				var color = ["light","dark"];
				for(var i=0;i<json.data.length;i++) {
					html += "<tr id='cus"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-cus"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i]);
					html += "</tr>";
				}
				// close the table
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				// assign IDs
				for(var i=0;i<json.data.length;i++) { 
					$("#cus"+json.data[i].ID).data("officeID",json.data[i].cus_officeID);
					$("#cus"+json.data[i].ID).data("repID",json.data[i].cus_repID);
					$("#cus"+json.data[i].ID).data("ID",json.data[i].ID);
					// for new job form
					var cus_phone = json.data[i].cus_phone1!="" ? json.data[i].cus_phone1 : json.data[i].cus_phone2!="" ? json.data[i].cus_phone2 : json.data[i].cus_phone_mobile;
					var cus_email = json.data[i].cus_email1!="" ? json.data[i].cus_email1 : json.data[i].cus_email2;
					$("#cus"+json.data[i].ID).data("info",{
						company:json.data[i].cus_company,
						contact:json.data[i].cus_name_first+" "+json.data[i].cus_name_last,
						phone:cus_phone,
						fax:json.data[i].cus_fax,
						email:cus_email,
						address1:json.data[i].cus_address1,
						address2:json.data[i].cus_address2,
						city:json.data[i].cus_city,
						state:json.data[i].cus_state,
						zip:json.data[i].cus_zip,
						country:json.data[i].cus_country
					});
				}
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There are no contacts in your system at the moment.</p>");
				break;
			case "empty "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>Your search <strong>- "+json.data.phrase+" -</strong> did not match any contact info.</p>");
				break;
			case "found "+this.dbTable+" dependents" :
				// highlight this item
				$("#cus"+this.currentRowID).addClass("deleting");
				// highlight dependents on page
				var dependents = {};
				var nope = false;
				for(m in json.data) {
					// setup data
					dependents[m] = [];
					for(i in json.data[m]) {
						var id = json.data[m][i].ID;
						switch(m) {
							case "es_jobs" : $("#job"+id+",#edit-job"+id+",#view-job"+id).addClass("deleting"); break;
							case "es_zones" : $("#zon"+id+",#edit-zon"+id).addClass("deleting"); break;
							case "es_proposals" : $("#pro"+id+",#edit-pro"+id).addClass("deleting"); nope = true; break;
						}
						// collect data
						dependents[m].push(id);
					}
				}
				// store data
				$("#data").data("deleting",dependents);
				// confirm
				if(nope) {
					alert("Oops, you don't have sufficient privileges to delete this contact.");
					// un-highlight this item
					$("#cus"+this.currentRowID).removeClass("deleting");
					// un-highlight this item and its dependents
					for(m in json.data) {
						for(i in json.data[m]) {
							var id = json.data[m][i].ID;
							switch(m) {
								case "es_jobs" : $("#job"+id+",#edit-job"+id+",#view-job"+id).removeClass("deleting"); break;
								case "es_zones" : $("#zon"+id+",#edit-zon"+id).removeClass("deleting"); break;
								case "es_proposals" : $("#pro"+id+",#edit-pro"+id).removeClass("deleting"); break;
							}
						}
					}
				}
				else if(!confirm("Are you sure you want to delete this contact and all of its dependents? This cannot be undone.")) {
					// un-highlight this item
					$("#cus"+this.currentRowID).removeClass("deleting");
					// un-highlight this item and its dependents
					for(m in json.data) {
						for(i in json.data[m]) {
							var id = json.data[m][i].ID;
							switch(m) {
								case "es_jobs" : $("#job"+id+",#edit-job"+id+",#view-job"+id).removeClass("deleting"); break;
								case "es_zones" : $("#zon"+id+",#edit-zon"+id).removeClass("deleting"); break;
								case "es_proposals" : $("#pro"+id+",#edit-pro"+id).removeClass("deleting"); break;
							}
						}
					}
				}
				else this.io.request(this,"id="+this.currentRowID+"&table="+this.dbTable+"&cus_officeID="+$('#cus'+this.currentRowID).data('officeID')+"&cus_repID="+$('#cus'+this.currentRowID).data('repID')+"&es_do=deleteCustomer");
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// build info string
		var info = "<span style='font-weight:bold;'>"+data.cus_name_last+", "+data.cus_name_first+" ("+data.cus_num_jobs+")</span><br />";
		info += (data.cus_company!="") ? data.cus_company+"<br />" : "";
		info += (data.cus_phone1!="") ? data.cus_phone1+" (1)<br />" : "";
		info += (data.cus_phone2!="") ? data.cus_phone2+" (2)<br />" : "";
		info += (data.cus_phone_mobile!="") ? data.cus_phone_mobile+" (m)<br />" : "";
		info += (data.cus_fax!="") ? data.cus_fax+" (f)<br />" : "";
		info += (data.cus_email1!="") ? data.cus_email1+" (1)<br />" : "";
		info += (data.cus_email2!="") ? data.cus_email2+" (2)" : "";
		// create the row
		var row = "<td colspan='1'>";
		row += info;
		row += "<span class='edit-panel'>";
		row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a> | ";
		row += "<a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>";
		row += "</span>";
		row += "</td>";
		row += "<td colspan='1' align='right'><input type='submit' title='NewJob' value='+ Project' /></td>";
		return row;
	},
	editRowContent:function(data) {
		this._super();
		// create the quick edit form
		var edit = "<td colspan='2'>";
		edit += "<form class='updateform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='cus_name_first'>First Name</label> \
						<input class='required input-short' type='text' id='cus_name_first' value='"+data.cus_name_first+"' /> \
						<label for='cus_name_last'>Last Name</label> \
						<input class='required input-short' type='text' id='cus_name_last' value='"+data.cus_name_last+"' /> \
						<label for='cus_company'>Company</label> \
						<input class='input-short' type='text' id='cus_company' value='"+data.cus_company+"' /> \
						<label for='cus_phone1'>Phone 1</label> \
						<input class='input-short' type='text' id='cus_phone1' value='"+data.cus_phone1+"' /> \
						<label for='cus_phone2'>Phone 2</label> \
						<input class='input-short' type='text' id='cus_phone2' value='"+data.cus_phone2+"' /> \
						<label for='cus_phone_mobile'>Phone Mobile</label> \
						<input class='input-short' type='text' id='cus_phone_mobile' value='"+data.cus_phone_mobile+"' /> \
						<label for='cus_fax'>Fax</label> \
						<input class='input-short' type='text' id='cus_fax' value='"+data.cus_fax+"' /> \
						<label for='cus_email1'>Email 1</label> \
						<input class='input-short' type='text' id='cus_email1' value='"+data.cus_email1+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='cus_email2'>Email 2</label> \
						<input class='input-short' type='text' id='cus_email2' value='"+data.cus_email2+"' /> \
						<label for='cus_address1'>Address 1</label> \
						<input class='input-short' type='text' id='cus_address1' value='"+data.cus_address1+"' /> \
						<label for='cus_address2'>Address 2</label> \
						<input class='input-short' type='text' id='cus_address2' value='"+data.cus_address2+"' /> \
						<label for='cus_city'>City</label> \
						<input class='input-short' type='text' id='cus_city' value='"+data.cus_city+"' /> \
						<label for='cus_state'>State</label> \
						<input class='input-short' type='text' id='cus_state' value='"+data.cus_state+"' /> \
						<label for='cus_zip'>Zip</label> \
						<input class='input-short' type='text' id='cus_zip' value='"+data.cus_zip+"' /> \
						<label for='cus_country'>Country</label> \
						<input class='input-short' type='text' id='cus_country' value='"+data.cus_country+"' /> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	}
});
/////////////////////////////////////////////////////////////////////////////////// jobs : reps
var Jobs = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// search items
		$(".dashboard-search",$(t.el)).live("keyup",function() {
			if(this.value=="") t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&wc=job_officeID='"+$('#data').data('rep').rep_officeID+"'&es_do=browseAllJobs");
			else t.io.request(t,"table="+t.dbTable+"&phrase="+this.value+"&wc=job_officeID='"+$('#data').data('rep').rep_officeID+"'&fulltext="+t.dbFulltext+"&es_do=searchJobs");
		});
		$(".dashboard-search",$(t.el)).live("focus",function() {
			if(this.value=="search...") $(".dashboard-search",$(t.el)).val("").css("color","#404040");
		});
		$(".dashboard-search",$(t.el)).live("blur",function() {
			if(this.value=="") $(".dashboard-search",$(t.el)).val("search...").css("color","#808080");
		});
		// new item -- controlled by customers
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			$(".selected-row").removeClass("selected-row");
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&wc=job_officeID='"+$('#data').data('rep').rep_officeID+"'&es_do=browseAllJobs");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			// email check
			if(!$("#job_email",$(this).closest("form")).validate()) {
				alert("Please use a valid email address.");
				return false;
			}
			ds += "job_officeID="+$($("#data").data("customer")).data("officeID")+"&";
			ds += "job_repID="+$($("#data").data("customer")).data("repID")+"&";
			ds += "job_customerID="+$($("#data").data("customer")).data("ID")+"&";
			t.io.request(t,ds+"&table="+t.dbTable+"&es_do=addJob");
		});
		// show zones and details
		$("input[title='Configure']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.id).hide();
			$("#view-"+this.parentNode.parentNode.id).show();
			$("#view-"+this.parentNode.parentNode.id).data("zones").begin("view-"+this.parentNode.parentNode.id);
			//$.scrollTo("#view-"+this.parentNode.parentNode.id,500);
		});
		// ok config
		$("input[title='OK']",$(t.el)).live("click",function() {
			var id = this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id;
			if($("#"+id).data("jc-disabled")) return false;
			$("#"+id).hide().data("zones").clear();
			$("#"+id.substring(5)).show();
			t.lastPanel = "";
			t.currentRowID = id.substring(8);
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=refreshJob");
		});
		// show new proposal
		$("input[title='CreateProposal']",$(t.el)).live("click",function() {
			$("#data").data("job",this.parentNode.parentNode);
			t.drafts.itemForm();
		});
		// new zone
		$("input[title='NewZone']",$(t.el)).live("click",function() {
			var id = this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id;
			if($("#"+id).data("jc-disabled")) return false;
			$("#data").data("job"+id.substring(8),this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.previousElementSibling.previousElementSibling);
			$("#"+id).data("zones").itemForm();
			// disable the controls
			$("input[title='NewZone'],input[title='OK']",$("#"+id)).css("opacity","0.3");
			$("#"+id).data("jc-disabled",true);
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			t.lastPanel = "";
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
			//$.scrollTo("#edit-"+this.parentNode.parentNode.parentNode.id,500);
		});
		// edit link (from within view)
		$("a[title='Edit2']",$(t.el)).live("click",function() {
			t.lastPanel = "view-";
			$("#"+this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id.substring(5)).show();
			//$.scrollTo("#edit-"+this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id.substring(5),500);
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+t.lastPanel+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// add new
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			if(t.lastPanel=="view-") $("#view-job"+t.currentRowID).data("zones").clear();
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			// email check
			if(!$("#job_email",$(this).closest("form")).validate()) {
				alert("Please use a valid email address.");
				return false;
			}
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=updateJob");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			// get dependents
			t.io.request(t,"caller="+t.dbTable+"&id="+t.currentRowID+"&tables=es_zones,es_proposals&columns=zon_jobID,pro_jobID&es_do=getDependents");
		});
		// trash link (from within view)
		$("a[title='Trash2']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id.substring(8);
			// get dependents
			t.io.request(t,"caller="+t.dbTable+"&id="+t.currentRowID+"&tables=es_zones,es_proposals&columns=zon_jobID,pro_jobID&es_do=getDependents");
		});
		// monthly bill input
		$(".monthly-bill",$(t.el)).live("keydown",function(e) {
			// check if integer
			if(!$(this).intify(e)) return false;
		});
		$(".monthly-bill",$(t.el)).live("change",function(e) {
			// ignore if value is empty
			if(this.value=="") return false;
			// add appropriate amount of interconnections
			var bill_total = 0;
			$(".monthly-bill",$(this).closest("form")).each(function(i){
				bill_total += parseInt(this.value);
			});
			$("#job_kwh_load",$(this).closest("form")).val(bill_total);
		});
		// test email
		$(".email",$(t.el)).live("keyup",function() {
			var tc = $(this).validate() ? "#404040" : "red";
			$(this).css("color",tc);
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function(refresh) {
		if(!refresh) {
			this._super(); 
			this.show(".dashboard-main"); 
		}
		// get all
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc=job_officeID='"+$('#data').data('rep').rep_officeID+"'&es_do=browseAllJobs");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<input type='input' class='dashboard-search' value='search...' style='margin-right:4px;' /> \
						<h1 class='dashboard-header'>"+$("#data").data("city")+" Projects</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_jobs",
	dbOrder:"ID DESC",
	dbFulltext:"job_name, job_contact, job_phone, job_address1, job_address2, job_city, job_state, job_zip, job_country",
	itemForm:function(info) {
		this._super();
		// returns the form
		return "<form class='addform' action='javascript:void(0);'> \
					<h1 class='addform-header'>New Project Info:</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='job_name'>Project Name</label> \
						<input class='required' type='text' id='job_name' value='My Project' /> \
						<label for='job_drive_time'>1-Way Drive Time (min)</label> \
						<input class='required' type='text' id='job_drive_time' value='' /> \
						<label for='job_kwh_load'>Annual Consumption (kWh)</label> \
						<input class='required' type='text' id='job_kwh_load' value='' /> \
					</div> \
					<div class='form-column'> \
						<label for='job_contact'>Project Contact</label> \
						<input type='text' id='job_contact' value='"+info.contact+"' /> \
						<label for='job_company'>Project Company</label> \
						<input type='text' id='job_company' value='"+info.company+"' /> \
						<label for='job_phone'>Project Phone</label> \
						<input type='text' id='job_phone' value='"+info.phone+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='job_fax'>Project Fax</label> \
						<input type='text' id='job_fax' value='"+info.fax+"' /> \
						<label for='job_email'>Project Email</label> \
						<input class='required email' autocomplete='off' type='text' id='job_email' value='"+info.email+"' /> \
						<label for='job_address1'>Address 1</label> \
						<input class='required' type='text' id='job_address1' value='"+info.address1+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='job_address2'>Address 2</label> \
						<input type='text' id='job_address2' value='"+info.address2+"' /> \
						<label for='job_city'>City</label> \
						<input class='required' type='text' id='job_city' value='"+info.city+"' /> \
						<label for='job_state'>State</label> \
						<input class='required' type='text' id='job_state' value='"+info.state+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='job_zip'>Zip</label> \
						<input class='required' type='text' id='job_zip' value='"+info.zip+"' /> \
						<label for='job_country'>Country</label> \
						<input type='text' id='job_country' value='"+info.country+"' /> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<label style='font-weight:bold; padding-bottom:5px;'>Monthly Usage Data From Utility Bill (kWh)</label> \
					<span style='color:#808080;'>JAN:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_1' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>FEB:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_2' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>MAR:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_3' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>APR:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_4' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>MAY:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_5' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>JUN:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_6' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>JUL:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_7' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>AUG:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_8' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>SEP:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_9' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>OCT:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_10' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>NOV:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_11' value='0.0' />&nbsp;&nbsp; \
					<span style='color:#808080;'>DEC:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_12' value='0.0' />&nbsp;&nbsp; \
					<br /><br /> \
					<input type='submit' title='Add' value='Add New' /> \
					<input type='submit' title='Cancel' value='Cancel' /> \
				</form>";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc=job_officeID='"+$('#data').data('rep').rep_officeID+"'&es_do=browseAllJobs");
				break;
			case this.dbTable+" updated" :
				$("#edit-job"+this.currentRowID).html(this.editRowContent(json.data)).hide();
				$("#job"+this.currentRowID).html(this.rowContent(json.data,json.data2.customer,json.data2.rep));
				$("#view-job"+this.currentRowID).html(this.viewRowContent(json.data,json.data2.customer,json.data2.rep));
				$("#"+this.lastPanel+"job"+this.currentRowID).show();
				if(this.lastPanel=="view-") $("#"+this.lastPanel+"job"+this.currentRowID).data("zones").begin("view-job"+this.currentRowID);
				break;
			case this.dbTable+" deleted" :
				$("#job"+this.currentRowID).remove();
				$("#edit-job"+this.currentRowID).remove();
				$("#view-job"+this.currentRowID).remove();
				// hide dependents
				for(m in $("#data").data("deleting")) {
					for(i in $("#data").data("deleting")[m]) {
						var id = $("#data").data("deleting")[m][i];
						switch(m) {
							case "es_zones" : $("#zon"+id+",#edit-zon"+id).remove(); break;
							case "es_proposals" : $("#pro"+id+",#edit-pro"+id).remove(); break;
						}
					}
				}
				break;
			case "found "+this.dbTable :
				var color = ["light","dark"];
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>Project Name</th>";
				html += "<th colspan='1'>Sales Rep</th>";
				html += "<th colspan='1'>Contact</th>";
				html += "<th colspan='1' align='right'>Consumption (kWh)</th>";
				html += "<th colspan='1' align='right'>&nbsp;</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody>";
				// loop over each result
				var color = ["light","dark"];
				for(var i=0;i<json.data.length;i++) {
					// write the rows
					html += "<tr id='job"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i],json.data2.customer[i],json.data2.rep[i]);
					html += "</tr>";
					html += "<tr id='edit-job"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='view-job"+json.data[i].ID+"' style='display:none;' class='quick-view "+color[(i+1)%2]+"'>";
					html += this.viewRowContent(json.data[i],json.data2.customer[i],json.data2.rep[i]);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html(html);
				// create zones for each job
				for(var i=0;i<json.data.length;i++) {
					var _zones_io = new IO();
					var zones = new Zones("#m_zones"+json.data[i].ID,_zones_io);
					$("#view-job"+json.data[i].ID).data("zones",zones).data("customerID",json.data[i].job_customerID);
					$("#job"+json.data[i].ID).data("officeID",json.data[i].job_officeID);
					$("#job"+json.data[i].ID).data("repID",json.data[i].job_repID);
					$("#job"+json.data[i].ID).data("customerID",json.data[i].job_customerID);
					$("#job"+json.data[i].ID).data("ID",json.data[i].ID);
				}
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There are no projects in your system at the moment.</p>");
				break;
			case "empty "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>Your search <strong>- "+json.data.phrase+" -</strong> did not match any project info.</p>");
				break;
			case "found "+this.dbTable+" dependents" :
				// highlight this item
				$("#job"+this.currentRowID+",#view-job"+this.currentRowID).addClass("deleting");
				// highlight dependents on page
				var dependents = {};
				var nope = false;
				for(m in json.data) {
					// setup data
					dependents[m] = [];
					for(i in json.data[m]) {
						var id = json.data[m][i].ID;
						switch(m) {
							case "es_zones" : $("#zon"+id+",#edit-zon"+id).addClass("deleting"); break;
							case "es_proposals" : $("#pro"+id+",#edit-pro"+id).addClass("deleting"); nope = true; break;
						}
						// collect data
						dependents[m].push(id);
					}
				}
				// store data
				$("#data").data("deleting",dependents);
				// confirm
				if(nope) {
					alert("Oops, you don't have sufficient privileges to delete this project.")
					// un-highlight this item
					$("#job"+this.currentRowID+",#view-job"+this.currentRowID).removeClass("deleting");
					// un-highlight this item and its dependents
					for(m in json.data) {
						for(i in json.data[m]) {
							var id = json.data[m][i].ID;
							switch(m) {
								case "es_zones" : $("#zon"+id+",#edit-zon"+id).removeClass("deleting"); break;
								case "es_proposals" : $("#pro"+id+",#edit-pro"+id).removeClass("deleting"); break;
							}
						}
					}
				}
				else if(!confirm("Are you sure you want to delete this project and all of its dependents? This cannot be undone.")) {
					// un-highlight this item
					$("#job"+this.currentRowID+",#view-job"+this.currentRowID).removeClass("deleting");
					// un-highlight this item and its dependents
					for(m in json.data) {
						for(i in json.data[m]) {
							var id = json.data[m][i].ID;
							switch(m) {
								case "es_zones" : $("#zon"+id+",#edit-zon"+id).removeClass("deleting"); break;
								case "es_proposals" : $("#pro"+id+",#edit-pro"+id).removeClass("deleting"); break;
							}
						}
					}
				}
				else this.io.request(this,"id="+this.currentRowID+"&table="+this.dbTable+"&job_officeID="+$('#job'+this.currentRowID).data('officeID')+"&job_repID="+$('#job'+this.currentRowID).data('repID')+"&job_customerID="+$('#job'+this.currentRowID).data('customerID')+"&es_do=deleteJob");
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data,customer,rep) {
		// build contact
		var contact = data.job_contact;
		contact += contact=="" ? data.job_company : "";
		contact += contact=="" ? customer : "";
		if(contact=="") contact = "n / a";
		var email = data.job_email!="" ? data.job_email : "<span style='color:red;'>Warning: No Email</span>";
		// hide proposal button if no zones
		var prop_butt_vis = (data.job_num_zones==0) ? "style='display:none;'" : "style='margin-right:5px;'";
		// create the row
		var row = "<td colspan='1'>";
		row += "<span style='font-weight:bold;'>"+data.job_name+"</span><br />";
		row += "<span class='edit-panel'>";
		row += "<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a> | ";
		row += "<a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>";
		row += "</span>";
		row += "</td>";
		row += "<td colspan='1'>"+rep+"</td>";
		row += "<td colspan='1'>"+contact+"<br />"+email+"</td>";
		row += "<td colspan='1' align='right'>"+$.addCommas(data.job_kwh_load)+"</td>";
		row += "<td colspan='1' align='right'><input type='submit' title='CreateProposal' "+prop_butt_vis+" value='+ Proposal' /><input type='submit' title='Configure' value='Configure' /></td>";
		return row;
	},
	editRowContent:function(data) {
		this._super();
		// create the edit row
		var edit = "<td colspan='5'>";
		edit += "<form class='updateform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='job_name'>Project Name</label> \
						<input class='required' type='text' id='job_name' value='"+data.job_name+"' /> \
						<label for='job_drive_time'>1-Way Drive Time (min)</label> \
						<input class='required' type='text' id='job_drive_time' value='"+data.job_drive_time+"' /> \
						<label for='job_kwh_load'>Annual Consumption (kWh)</label> \
						<input class='required' type='text' id='job_kwh_load' value='"+data.job_kwh_load+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='job_contact'>Project Contact</label> \
						<input type='text' id='job_contact' value='"+data.job_contact+"' /> \
						<label for='job_company'>Project Company</label> \
						<input type='text' id='job_company' value='"+data.job_company+"' /> \
						<label for='job_phone'>Project Phone</label> \
						<input type='text' id='job_phone' value='"+data.job_phone+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='job_fax'>Project Fax</label> \
						<input type='text' id='job_fax' value='"+data.job_fax+"' /> \
						<label for='job_email'>Project Email</label> \
						<input class='required email' autocomplete='off' type='text' id='job_email' value='"+data.job_email+"' /> \
						<label for='job_address1'>Address 1</label> \
						<input class='required' type='text' id='job_address1' value='"+data.job_address1+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='job_address2'>Address 2</label> \
						<input type='text' id='job_address2' value='"+data.job_address2+"' /> \
						<label for='job_city'>City</label> \
						<input class='required' type='text' id='job_city' value='"+data.job_city+"' /> \
						<label for='job_state'>State</label> \
						<input class='required' type='text' id='job_state' value='"+data.job_state+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='job_zip'>Zip</label> \
						<input class='required' type='text' id='job_zip' value='"+data.job_zip+"' /> \
						<label for='job_country'>Country</label> \
						<input type='text' id='job_country' value='"+data.job_country+"' /> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<label style='font-weight:bold; padding-bottom:5px;'>Monthly Usage Data From Utility Bill (kWh)</label> \
					<span style='color:#808080;'>JAN:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_1' value='"+data.job_bill_1+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>FEB:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_2' value='"+data.job_bill_2+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>MAR:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_3' value='"+data.job_bill_3+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>APR:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_4' value='"+data.job_bill_4+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>MAY:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_5' value='"+data.job_bill_5+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>JUN:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_6' value='"+data.job_bill_6+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>JUL:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_7' value='"+data.job_bill_7+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>AUG:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_8' value='"+data.job_bill_8+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>SEP:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_9' value='"+data.job_bill_9+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>OCT:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_10' value='"+data.job_bill_10+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>NOV:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_11' value='"+data.job_bill_11+"' />&nbsp;&nbsp; \
					<span style='color:#808080;'>DEC:</span>&nbsp;<input class='monthly-bill' style='display:inline; width:30px; text-align:right;' type='text' id='job_bill_12' value='"+data.job_bill_12+"' />&nbsp;&nbsp; \
					<br /><br /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	},
	viewRowContent:function(data,customer,rep) {
		this._super();
		// create the view form
		if(data.job_address2!="") data.job_address2 += "<br />";
		var job_name = data.job_name.length>15 ? data.job_name.substring(0,12)+"..." : data.job_name;
		var contact = data.job_contact.length>15 ? data.job_contact.substring(0,12)+"..." : data.job_contact;
		contact += contact=="" ? data.job_company.length>15 ? data.job_company.substring(0,12)+"..." : data.job_company : "";
		contact += contact=="" ? customer.length>15 ? customer.substring(0,12)+"..." : customer : "";
		if(contact=="") contact = "n / a";
		var email = data.job_email!="" ? data.job_email : "<span style='color:red;'>Warning: No Email</span>";
		var view = "<td colspan='5' style='padding:0; border:none;'>"
		view += "<table cellpadding='0' cellspacing='0' width='100%' style='margin:0;'>";
		view += "<tr>";
		view += "<td colspan='1' style='color:#808080; padding:10px 0 15px 20px; width:80px; line-height:18px;'> \
					<h1 class='addform-header'>Details:</h1> \
					<br /> \
					Project Name:<br /> \
					Rep.:<br /> \
					Contact:<br /><br /> \
					Annual Cons.:<br /> \
					Drive Time:<br /> \
					Address:";
		view += "</td>";
		view += "<td colspan='1' style='padding:9px 15px 15px 10px; text-align:right; border-right:1px solid #eee; width:110px; line-height:18px;'> \
					<br /> \
					<br /> \
					"+job_name+"<br /> \
					"+rep+"<br /> \
					"+contact+"<br /> \
					"+email+"<br /> \
					"+$.addCommas(data.job_kwh_load)+" kWh<br /> \
					"+data.job_drive_time+" min<br /> \
					"+data.job_address1+"<br /> \
					"+data.job_address2+" \
					"+data.job_city+",  \
					"+data.job_state+"  \
					"+data.job_zip+"<br /> \
					"+data.job_country;
		view += "</td>";
		view += "<td colspan='5' style='padding:10px 0 0 0;'>";
		view += "<div class='zones-holder'></div>";
		view +=	"</td>";
		view += "</tr>";
		view += "<tr>";
		view += "<td colspan='2' style='border-top:1px solid #eee; border-right:1px solid #eee; padding:15px 0 0 20px;'>";
		view += "<span>";
		view += "<a href='javascript:void(0);' class='edit-link' title='Edit2'>Edit</a> | ";
		view += "<a href='javascript:void(0);' class='trash-link' title='Trash2'>Trash</a>";
		view += "</span>";
		view += "</td>";
		view += "<td colspan='5' style='border-top:1px solid #eee; padding:5px 10px 5px 0;' align='right'>";
		view += "<input type='submit' style='margin-right:5px;' title='NewZone' value='+ Zone' />";
		view += "<input type='submit' title='OK' value='OK' />";
		view +=	"</td>";
		view += "</tr>";
		view += "</table>";
		view +=	"</td>";
		return view;
	} 
});
////////////////////////////////////////////////////////////////////////////////// zones : reps
var Zones = Module.extend({
  	init:function(el,io) {
		this._super(el,io);
		var t = this;
		// new item - controlled from jobs
		// cancel add
		$("input[title='CancelZone']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&wc=zon_jobID='"+t.jobID+"'&"+t.itemFormOptions()+"&es_do=browseAllZones");
			// enable the job controls again
			$("input[title='NewZone'],input[title='OK']",$("#view-job"+t.jobID)).css("opacity","1");
			$("#view-job"+t.jobID).data("jc-disabled",false);
		});
		// add new
		$("input[title='AddZone']",$(t.el)).live("click",function() {
			// assign image id
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			ds += "zon_officeID="+$($("#data").data("job"+t.jobID)).data("officeID")+"&";
			ds += "zon_repID="+$($("#data").data("job"+t.jobID)).data("repID")+"&";
			ds += "zon_customerID="+$($("#data").data("job"+t.jobID)).data("customerID")+"&";
			ds += "zon_jobID="+t.jobID+"&";			
			// hide the form and show waiting gif
			$(".dashboard-item-content",$(t.el)).html($("<h1 id='zones-header' class='addform-header'>Please Wait...</h1><br /><div id='waiting'><p style='padding:0 0 0 20px; color:#b1cd49; font-weight:bold;'>Talking to NREL&rsquo;s PVWatts v.1.</p></div>"));
			t.blink = "0.8";
			t.waiting = setInterval(function() {
				$("#waiting").css("opacity",t.blink);
				t.blink = (t.blink=="0.8") ? t.blink = "1" : t.blink = "0.8";  
			}, 200);
			t.io.request(t,ds+"&table="+t.dbTable+"&es_do=addZone");
		});
		// hover over rows
		$("tr.zonehover",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr.zonehover",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// edit link
		$("a[title='EditZone']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
		});
		// cancel update
		$("input[title='CancelQZone']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// add new
		$("input[title='UpdateZone']",$(t.el)).live("click",function() {
			// temp disable the job controls
			$("input[title='NewZone'],input[title='OK']",$("#view-job"+t.jobID)).css("opacity","0.3");
			$("#view-job"+t.jobID).data("jc-disabled",true);
			// get the data
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			if(ds=="") return false;
			// hide the form and show waiting text
			var blink_text = "<td colspan='3' style='padding:0; border-top:1px solid #EEEEEE;'> \
									<h1 style='padding:10px 0 0 20px;' class='addform-header'>Please Wait...</h1> \
									<br /> \
									<div id='waiting'> \
										<p style='padding:0 0 10px 20px; color:#b1cd49; font-weight:bold;'>Talking to NREL&rsquo;s PVWatts v.1.</p> \
									</div> \
								</td>";
			$("#edit-zon"+t.currentRowID).html($(blink_text));
			t.blink = "0.8";
			t.waiting = setInterval(function() {
				$("#waiting").css("opacity",t.blink);
				t.blink = (t.blink=="0.8") ? t.blink = "1" : t.blink = "0.8";  
			}, 200);
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&"+t.itemFormOptions()+"&es_do=updateZone");
		});
		// trash link
		$("a[title='TrashZone']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			// get dependents
			t.io.request(t,"caller="+t.dbTable+"&id="+t.currentRowID+"&es_do=getProZones");
		});
		// tilt angle select
		$("select#zon_tilt",$(t.el)).live("change",function() {
			var chosen_tilt = this.value;
			if(chosen_tilt=="custom") {
				$("label[for='zon_custom_tilt']",$(this).closest("form")).show().css("display","inline");
				$("#zon_custom_tilt",$(this).closest("form")).show().addClass("required").css("display","inline");
			}
			else {
				$("label[for='zon_custom_tilt']",$(this).closest("form")).hide();
				$("#zon_custom_tilt",$(this).closest("form")).hide().removeClass("required");
			}
			$("#zon_pitch option:selected",$(this).closest("form")).each(function(i) {
				if($(this).text()=="--select--" && chosen_tilt!="custom") $("#zon_pitch option[value='"+chosen_tilt+"']",$(this).closest("form")).attr("selected","selected");
			});
		});
		// pitch angle select
		$("select#zon_pitch",$(t.el)).live("change",function() {
			if(this.value=="custom") {
				$("label[for='zon_custom_pitch']",$(this).closest("form")).show().css("display","inline");
				$("#zon_custom_pitch",$(this).closest("form")).show().addClass("required").css("display","inline");
			}
			else {
				$("label[for='zon_custom_pitch']",$(this).closest("form")).hide();
				$("#zon_custom_pitch",$(this).closest("form")).hide().removeClass("required");
			}
		});
		// uploads
		$(".file-input",$(t.el)).live("mouseenter",function() {
			$(this.parentNode.nextElementSibling).css("border","1px solid #808080");
			$(this.parentNode.nextElementSibling.nextElementSibling).css("border","1px solid #808080");
		});
		$(".file-input",$(t.el)).live("mouseleave",function() {
			$(this.parentNode.nextElementSibling).css("border","1px solid #ddd");
			$(this.parentNode.nextElementSibling.nextElementSibling).css("border","1px solid #ddd");
		});
		$(".file-input",$(t.el)).live("mousedown",function() {
			$(this.parentNode.nextElementSibling).css("background-image","-webkit-gradient(linear, 0% 100%, 0% 0%, from(rgb(255,255,255)), to(rgb(238,238,238)))");
			$(this.parentNode.nextElementSibling).css("background-image","-moz-linear-gradient(center bottom, rgb(255,255,255) 0%, rgb(238,238,238) 100%)");
			$(this.parentNode.nextElementSibling.nextElementSibling).css("background-image","-webkit-gradient(linear, 0% 100%, 0% 0%, from(rgb(255,255,255)), to(rgb(238,238,238)))");
			$(this.parentNode.nextElementSibling.nextElementSibling).css("background-image","-moz-linear-gradient(center bottom, rgb(255,255,255) 0%, rgb(238,238,238) 100%)");
		});
		$(".file-input",$(t.el)).live("mouseup",function() {
			$(this.parentNode.nextElementSibling).css("background-image","-webkit-gradient(linear, 0% 100%, 0% 0%, from(rgb(238,238,238)), to(rgb(255,255,255)))");
			$(this.parentNode.nextElementSibling).css("background-image","-moz-linear-gradient(center bottom, rgb(238,238,238) 0%, rgb(255,255,255) 100%)");
			$(this.parentNode.nextElementSibling.nextElementSibling).css("background-image","-webkit-gradient(linear, 0% 100%, 0% 0%, from(rgb(238,238,238)), to(rgb(255,255,255)))");
			$(this.parentNode.nextElementSibling.nextElementSibling).css("background-image","-moz-linear-gradient(center bottom, rgb(238,238,238) 0%, rgb(255,255,255) 100%)");
		});
		$(".file-input",$(t.el)).live("change",function() {
			// check if upload pending
			if($("#view-job"+t.jobID).data("jc-disabled")) return false;
			// disable controls while waiting for upload
			$("input[title='NewZone'],input[title='OK']",$("#view-job"+t.jobID)).css("opacity","0.3");
			$("#view-job"+t.jobID).data("jc-disabled",true);
			// store id cause it will change
			var ref = this.id;
			var id = ref.substring(3);
			// show loading gif
			$("#zon_layout-"+id).hide(50,function() {
				$(this).css({position:"relative",width:"66px",top:"58px",left:"63px"}).attr("src","gfx/uploading.gif").show();
			});
			// create a dynamic iframe
			var iframe = $("<iframe id='f-"+ref+"' name='f-"+ref+"' src='' style='display:none;' />");
			// add to doc
		    iframe.appendTo("body");
			// iframe event handling
			var uploaded = function(e) {
				// remove events
				$.removeEvent("f-"+ref,"load",uploaded);
				// show image
				var big_src = $("#f-"+ref).contents().find("body").html()+"_sized_800.jpg";
				var small_src = $("#f-"+ref).contents().find("body").html()+"_thumb.jpg";
				$("#zon_layout-"+id).hide(50,function() {
					if($(this.parentNode).hasClass("fancybox")) {
						$(this.parentNode).attr("href",big_src);
					} else {
						$(this).wrap("<a class='fancybox' href='"+big_src+"' />");
						$("a.fancybox",$("#zon"+id)).fancybox({ autoScale:true, titleShow:false });
						$("#file_butt_new-"+id).hide();
						$("#file_butt_edit-"+id).show();
						$("#tl-"+id).show();
					}
					$(this).css({position:"static",width:"auto",top:"auto",left:"auto"}).attr("src",small_src).fadeIn("fast");
				});
				// clean up
				setTimeout(function() {
					$("#f-"+ref).remove(); 
					$("#uploader-"+ref).remove();
					// enable the job controls again
					$("input[title='NewZone'],input[title='OK']",$("#view-job"+t.jobID)).css("opacity","1");
					$("#view-job"+t.jobID).data("jc-disabled",false);
				}, 1000);
			}
			$.addEvent("f-"+ref,"load",uploaded);
			// get ids
			var row = this.parentNode.parentNode.parentNode.parentNode;
			var oid = $(row).data("officeID");
			var rid = $(row).data("repID");
			var cid = $(row).data("customerID");
			var jid = $(row).data("jobID");
			var zid = id;
			// create the upload form
			var form = "<form id='uploader-"+ref+"' class='uploadform' action='includes/es-upload.php' enctype='multipart/form-data' encoding='multipart/form-data' method='post' style='display:none;'> \
							<input type='hidden' name='up_caption' value='' /> \
							<input type='hidden' name='up_officeID' value='"+oid+"' /> \
							<input type='hidden' name='up_repID' value='"+rid+"' /> \
							<input type='hidden' name='up_customerID' value='"+cid+"' /> \
							<input type='hidden' name='up_jobID' value='"+jid+"' /> \
							<input type='hidden' name='up_zoneID' value='"+zid+"' /> \
						</form>";
			// add to doc
		    $(form).appendTo("body");
			// change form's target to the iframe (this is what simulates ajax)
		    $("#uploader-"+ref).attr("target","f-"+ref);
			// add the file input to the form
			$("#"+ref).appendTo("#uploader-"+ref).attr("id",ref+"_temp");
			// submit form
		    $("#uploader-"+ref).submit();
			// re-attach input field
			$("#"+ref+"_temp").appendTo("#"+ref+"-holder").attr("id",ref);
			// ensure single submit
			return false;
		});
		$("a[title='TrashLayout']",$(t.el)).live("click",function() {
			// hold id
			var id = this.id.substring(3);
			// remove trash link
			$(this).remove();
			// hide thumb
			$("#zon_layout-"+id).hide(50,function() {
				// replace image
				$(this).css({position:"static",width:"auto",top:"auto",left:"auto"}).attr("src","gfx/layout.jpg").unwrap().fadeIn("fast");
				// switch butts
				$("#file_butt_edit-"+id).hide();
				$("#file_butt_new-"+id).show();
				// delete from zone
				t.io.request(t,"table="+t.dbTable+"&id="+id+"&es_do=deleteLayout");
			});
		});
	},
  	show:function(holder) { this._super(holder,"100",true); },
	hide:function() { this._super(); },
	begin:function(parent) {
		this._super();
		this.jobID = parent.substring(8);
		this.show("#"+parent+" .zones-holder");
		// get all
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc=zon_jobID='"+this.jobID+"'&"+this.itemFormOptions()+"&es_do=browseAllZones");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div>";
	},
	dbTable:"es_zones",
	dbOrder:"ID DESC",
	itemForm:function() {
		// override
		this.io.request(this,this.itemFormOptions()+"&table="+this.dbTable+"&es_do=getOptions");
	},
	itemFormOptions:function() {
		return "menus=zon_type,zon_tilt,zon_module,zon_racking,zon_mounting_method,zon_pitch,zon_mounting_medium&sources=es_arrays,es_angles,es_modules,es_racking,es_mounting_methods,es_angles,es_mounting_mediums&columns=arr_value,ang_value,mod_model_num,rac_model_num,met_value,ang_value,med_value";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" added" :
				// enable the job controls again
				$("input[title='NewZone'],input[title='OK']",$("#view-job"+this.jobID)).css("opacity","1");
				$("#view-job"+this.jobID).data("jc-disabled",false);
				// show the list again
				this.waiting = null;
				$(".dashboard-item-content",$(this.el)).html("<h1 id='zones-header' class='addform-header'>Zones:</h1><br />");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc=zon_jobID='"+this.jobID+"'&"+this.itemFormOptions()+"&es_do=browseAllZones");
				break;
			case this.dbTable+" updated" :
				// enable the job controls again
				$("input[title='NewZone'],input[title='OK']",$("#view-job"+this.jobID)).css("opacity","1");
				$("#view-job"+this.jobID).data("jc-disabled",false);
				// show the single item
				this.waiting = null;
				$("#zon"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-zon"+this.currentRowID).html(this.editRowContent(json.data,json.data2)).hide();
				// fancybox support
				$("a.fancybox",$(this.el)).fancybox({ autoScale:true, titleShow:false });
				break;
			case this.dbTable+" deleted" :
				$("#zon"+this.currentRowID).remove();
				$("#edit-zon"+this.currentRowID).remove();
				// hide dependents
				for(m in $("#data").data("deleting")) {
					for(i in $("#data").data("deleting")[m]) {
						var id = $("#data").data("deleting")[m][i];
						switch(m) {
							case "es_proposals" : $("#pro"+id+",#edit-pro"+id).remove(); break;
						}
					}
				}
				break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0' style='margin:0;'>";
				html += "<tbody>";
				// loop over each result
				var color = ["dark","light"];
				for(var i=0;i<json.data.length;i++) {
					// write the rows
					html += "<tr id='zon"+json.data[i].ID+"' class='"+color[(i+1)%2]+" zonehover'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-zon"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i],json.data2);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content", $(this.el)).html("<h1 id='zones-header' class='addform-header'>Zones:</h1><br />"+html);
				// fancybox support
				$("a.fancybox",$(this.el)).fancybox({ autoScale:true, titleShow:false });
				// assign rep
				for(var i=0;i<json.data.length;i++) {
					$("#zon"+json.data[i].ID).data("officeID",json.data[i].zon_officeID);
					$("#zon"+json.data[i].ID).data("repID",json.data[i].zon_repID);
					$("#zon"+json.data[i].ID).data("customerID",json.data[i].zon_customerID);
					$("#zon"+json.data[i].ID).data("jobID",json.data[i].zon_jobID);
				}
				break;
			case "no "+this.dbTable :
				// clear the list
				$(".dashboard-item-content",$(this.el)).html("<h1 id='zones-header' class='addform-header'>Zones:</h1><br /><p style='color:#808080; padding:0 0 0 20px;'>There are no zones associated with this project at the moment.</p>");
				break;
			case "got "+this.dbTable+" options" :
				// loop over the results
				var selects = {};
				for(set in json.data) {
					var menu = "<option value='' selected='selected'>--select--</option>";
					for(options in json.data[set]) {
						for(values in json.data[set][options]) {
							menu += "<option value='"+json.data[set][options][values]+"'>"+json.data[set][options][values]+"</option>";
						}
					}
					selects[set] = menu;
				}
				// make the form
				var form = "<form class='addzoneform' action='javascript:void(0);'> \
							<div class='form-column'> \
								<label for='zon_name'>Zone Name</label> \
								<input class='required' type='text' id='zon_name' value='My Zone' /> \
								<label for='zon_type'>Array Type</label> \
								<select class='required' id='zon_type'>"+selects.zon_type+"</select> \
								<label for='zon_tilt'>Array Tilt</label> \
								<select class='required' id='zon_tilt'>"+selects.zon_tilt+"</select> \
								<input type='text' id='zon_custom_tilt' value='' style='width:25%; display:none;'/><label for='zon_custom_tilt' style='padding-left:4px; display:none;'>º</label> \
								<label for='zon_azimuth'>Array Azimuth (º)</label> \
								<input class='required' type='text' id='zon_azimuth' value='' /> \
								<label for='zon_erate'>Cost of Electricity (¢/kWh)</label> \
								<input class='required' type='text' id='zon_erate' value='10.1' /> \
							</div> \
							<div class='form-column'> \
								<label for='zon_derate'>Derate</label> \
								<input class='required' type='text' id='zon_derate' value='0.77' /> \
								<label for='zon_module'>Module Type</label> \
								<select class='required' id='zon_module'>"+selects.zon_module+"</select> \
								<label for='zon_num_modules'># Modules (total)</label> \
								<input class='required' type='text' id='zon_num_modules' value='' /> \
								<label for='zon_per_landscape'># <span style='font-weight:bold;'>Landscape</span> Modules</label> \
								<input class='required' type='text' id='zon_per_landscape' value='0' /> \
								<label for='zon_racking'>Racking Type</label> \
								<select class='required' id='zon_racking'>"+selects.zon_racking+"</select> \
							</div> \
							<div class='form-column'> \
								<label for='zon_mounting_method'>Mounting Method</label> \
								<select class='required' id='zon_mounting_method'>"+selects.zon_mounting_method+"</select> \
								<label for='zon_pitch'>Surface Pitch</label> \
								<select class='required' id='zon_pitch'>"+selects.zon_pitch+"</select> \
								<input type='text' id='zon_custom_pitch' value='' style='width:25%; display:none;'/><label for='zon_custom_pitch' style='padding-left:4px; display:none;'>º</label> \
								<label for='zon_mounting_medium'>Mounting Medium</label> \
								<select class='required' id='zon_mounting_medium'>"+selects.zon_mounting_medium+"</select> \
								<label for='zon_support_dist'>Distance Between Supports (ft)</label> \
								<input class='required' type='text' id='zon_support_dist' value='4' /> \
							</div> \
							<div class='form-column-right'> \
								<label for='zon_num_cont_arrays'>Contiguous Arrays</label> \
								<input class='required' type='text' id='zon_num_cont_arrays' value='1' /> \
								<label for='zon_rebate'>Rebate ($/W)</label> \
								<input class='required' type='text' id='zon_rebate' value='0' /> \
								<label for='zon_rebate_desc'>Rebate Description</label> \
								<input type='text' id='zon_rebate_desc' value='' /> \
								<label for='zon_pvwatts'>PV Watts Query (optional)</label> \
								<input type='text' id='zon_pvwatts' value='' /> \
							</div> \
							<div class='clear'></div> \
							<br /> \
							<input type='submit' title='AddZone' value='Add New' /> \
							<input type='submit' title='CancelZone' value='Cancel' /> \
						</form>";
						// write the form
						$(".dashboard-item-content",$(this.el)).html("<h1 id='zones-header' class='addform-header'>New Zone Info:</h1><br />"+form);
				break;
			case "found "+this.dbTable+" dependents" :
				// highlight this item
				$("#zon"+this.currentRowID).addClass("deleting");
				// highlight dependents on page
				var dependents = {};
				var nope = false;
				for(m in json.data) {
					// setup data
					dependents[m] = [];
					for(i in json.data[m]) {
						var id = json.data[m][i].ID;
						switch(m) {
							case "es_proposals" : $("#pro"+id+",#edit-pro"+id).addClass("deleting"); nope = true; break;
						}
						// collect data
						dependents[m].push(id);
					}
				}
				// store data
				$("#data").data("deleting",dependents);
				// confirm
				if(nope) {
					alert("Oops, you don't have sufficient privileges to delete this zone.");
					// un-highlight this item
					$("#zon"+this.currentRowID).removeClass("deleting");
					// un-highlight this item and its dependents
					for(m in json.data) {
						for(i in json.data[m]) {
							var id = json.data[m][i].ID;
							switch(m) {
								case "es_proposals" : $("#pro"+id+",#edit-pro"+id).removeClass("deleting"); break;
							}
						}
					}
				}
				else if(!confirm("Are you sure you want to delete this zone and all of its dependents? This cannot be undone.")) {
					// un-highlight this item
					$("#zon"+this.currentRowID).removeClass("deleting");
					// un-highlight this item and its dependents
					for(m in json.data) {
						for(i in json.data[m]) {
							var id = json.data[m][i].ID;
							switch(m) {
								case "es_proposals" : $("#pro"+id+",#edit-pro"+id).removeClass("deleting"); break;
							}
						}
					}
				}
				else this.io.request(this,"id="+this.currentRowID+"&table="+this.dbTable+"&zon_jobID="+this.jobID+"&es_do=deleteZone");
				break;
			case "layout deleted" : break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// input field
		var butts = "<div style='position:relative; top:5px;'>";
		butts += "<span id='zi-"+data.ID+"-holder' style='position:absolute; top:1px; right:3px; z-index:1;'>";
		butts += "<input type='file' id='zi-"+data.ID+"' class='file-input' size='1' name='Filedata' style='opacity:0;' />";
		butts += "</span>";
		// image
		var pic, trash;
		if(data.zon_layout && data.zon_layout!=0) {
			pic = "<a class='fancybox' href='"+data.zon_layout+"_sized_800.jpg'><img id='zon_layout-"+data.ID+"' src='"+data.zon_layout+"_thumb.jpg' title='"+data.zon_name+" Layout' alt='zone layout' /></a>";
			trash = "<a id='tl-"+data.ID+"' href='javascript:void(0);' class='trash-link' title='TrashLayout' style='font-size:10px; text-align:right; padding:0 0 0 158px;'>Trash</a>";
			butts += "<input id='file_butt_new-"+data.ID+"' type='submit' title='AddLayout' value='+ Layout' style='position:absolute; right:10px; z-index:0; display:none;' />";
			butts += "<input id='file_butt_edit-"+data.ID+"' type='submit' title='AddLayout' value='&#9998; Layout' style='position:absolute; right:10px; z-index:0;' />";
		}
		else {
			pic = "<img id='zon_layout-"+data.ID+"' src='gfx/layout.jpg' title='"+data.zon_name+" Layout' alt='zone layout' />";
			trash = "<a id='tl-"+data.ID+"' href='javascript:void(0);' class='trash-link' title='TrashLayout' style='font-size:10px; text-align:right; padding:0 0 0 158px; display:none;'>Trash</a>";
			butts += "<input id='file_butt_new-"+data.ID+"' type='submit' title='AddLayout' value='+ Layout' style='position:absolute; right:10px; z-index:0;' />";
			butts += "<input id='file_butt_edit-"+data.ID+"' type='submit' title='AddLayout' value='&#9998; Layout' style='position:absolute; right:10px; z-index:0; display:none;' />";
		}
		butts += "</div>";
		// edit panel
		var panel = "<div class='edit-panel' style='font-weight:normal; padding:0 0 5px 10px;'>";
		panel += "<a href='javascript:void(0);' class='edit-link' title='EditZone'>Edit</a> | ";
		panel += "<a href='javascript:void(0);' class='trash-link' title='TrashZone'>Trash</a>";
		panel += "</div>";
		// write it
		var row = "<td style='border-top:1px solid #eee;'>";
		row += "<div style='font-weight:bold; font-size:14px; padding:5px 0 0 10px; float:left;'>"+data.zon_name+"</div>";
		row += butts;
		row += "<div class='clear'></div>";
		row += "<table cellpadding='0' cellspacing='0' style='width:100%; margin:0; padding:10px;'>";
		row += "<thead>";
		row += "<th colspan='2' style='padding:5px 0; border-bottom:1px solid grey;'>Parameters</th>";
		row += "<th colspan='1' style='padding:5px 0; border-bottom:1px solid grey;'>Layout"+trash+"</th>";
		row += "</thead>";
		row += "<tbody>";
		row += "<tr class='dark'>";
		row += "<td colspan='1' style='color:#808080; border:none;'>Zone Size:</td>";
		row += "<td colspan='1' style='font-weight:bold; border:none;' align='right'>"+$.addCommas(data.zon_size)+" kW</td>";
		row += "<td rowspan='8' width='192' style='color:#808080; padding:10px 10px 0 10px; border-top:none; border-left:1px solid grey;'>"+pic+"</td>";
		row += "</tr>";
		row += "<tr class='light'>";
		row += "<td colspan='1' style='color:#808080;'>Annual Production:</td>";
		row += "<td colspan='1' style='font-weight:bold;' align='right'>"+$.addCommas(data.zon_production)+" kWh</td>";
		row += "</tr>";
		row += "<tr class='dark'>";
		row += "<td colspan='1' style='color:#808080;'>Install Labor:</td>";
		row += "<td colspan='1' style='font-weight:bold;' align='right'>"+$.addCommas(data.zon_install_labor_hrs)+" hrs</td>";
		row += "</tr>";
		row += "<tr class='light'>";
		row += "<td colspan='1' style='color:#808080;'>Rebate:</td>";
		row += "<td colspan='1' style='font-weight:bold;' align='right'>$"+data.zon_rebate+"/W</td>";
		row += "</tr>";
		row += "<tr class='dark'>";
		row += "<td colspan='1' style='color:#808080;'>Modules (p / c):</td>";
		row += "<td colspan='1' style='font-weight:bold;' align='right'>$"+$.addCommas(data.zon_module_price)+" <span style='font-weight:normal;'>/ $"+$.addCommas(data.zon_module_cost)+"</span></td>";
		row += "</tr>";
		row += "<tr class='light'>";
		row += "<td colspan='1' style='color:#808080;'>Racking (p / c):</td>";
		row += "<td colspan='1' style='font-weight:bold;' align='right'>$"+$.addCommas(data.zon_racking_price)+" <span style='font-weight:normal;'>/ $"+$.addCommas(data.zon_racking_cost)+"</span></td>";
		row += "</tr>";
		row += "<tr class='dark'>";
		row += "<td colspan='1' style='color:#808080;'>Install Labor (p / c):</td>";
		row += "<td colspan='1' style='font-weight:bold;' align='right'>$"+$.addCommas(data.zon_install_labor_price)+" <span style='font-weight:normal;'>/ $"+$.addCommas(data.zon_install_labor_cost)+"</span></td>";
		row += "</tr>";
		row += "<tr class='light'>";
		row += "<td colspan='1' style='color:#808080;'>Connections (p / c):</td>";
		row += "<td colspan='1' style='font-weight:bold;' align='right'>$"+$.addCommas(data.zon_connection_price)+" <span style='font-weight:normal;'>/ $"+$.addCommas(data.zon_connection_cost)+"</span></td>";
		row += "</tr>";
		row += "</tbody>";
		row += "</table>";
		row += "<div class='clear'></div>";
		row += panel;
		row += "</td>";
		return row;
	},
	editRowContent:function(data,data2) {
		this._super();
		// loop over the results
		var selects = {};
		for(set in data2) {
			var menu = "";
			for(options in data2[set]) {
				for(values in data2[set][options]) {
					var selected = (data[set]==data2[set][options][values]) ? "selected='selected'" : "";
					menu += "<option value='"+data2[set][options][values]+"' "+selected+">"+data2[set][options][values]+"</option>";
				}
			}
			selects[set] = menu;
		}
		var custom_pitch_style = (data.zon_pitch!="custom") ? "display:none;" : "display:inline;";
		var custom_tilt_style = (data.zon_tilt!="custom") ? "display:none;" : "display:inline;";
		var num_land = Math.round(data.zon_num_modules*data.zon_per_landscape/100);
		// create the quick edit form
		var edit = "<td colspan='3' style='border-top:1px solid #EEEEEE;'>";
		edit += "<form class='updatezoneform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label for='zon_name'>Zone Name</label> \
						<input class='required' type='text' id='zon_name' value='"+data.zon_name+"' /> \
						<label for='zon_type'>Array Type</label> \
						<select class='required' id='zon_type'>"+selects.zon_type+"</select> \
						<label for='zon_tilt'>Array Tilt</label> \
						<select class='required' id='zon_tilt'>"+selects.zon_tilt+"</select> \
						<input type='text' id='zon_custom_tilt' value='"+data.zon_custom_tilt+"' style='width:25%; "+custom_tilt_style+"' /><label for='zon_custom_tilt' style='padding-left:4px; "+custom_tilt_style+"'>º</label> \
						<label for='zon_azimuth'>Array Azimuth (º)</label> \
						<input class='required' type='text' id='zon_azimuth' value='"+data.zon_azimuth+"' /> \
						<label for='zon_erate'>Cost of Electricity (¢/kWh)</label> \
						<input class='required' type='text' id='zon_erate' value='"+data.zon_erate+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='zon_derate'>Derate</label> \
						<input class='required' type='text' id='zon_derate' value='"+data.zon_derate+"' /> \
						<label for='zon_module'>Module Type</label> \
						<select class='required' id='zon_module'>"+selects.zon_module+"</select> \
						<label for='zon_num_modules'># Modules (total)</label> \
						<input class='required' type='text' id='zon_num_modules' value='"+data.zon_num_modules+"' /> \
						<label for='zon_per_landscape'># <span style='font-weight:bold;'>Landscape</span> Modules</label> \
						<input class='required' type='text' id='zon_per_landscape' value='"+num_land+"' /> \
						<label for='zon_racking'>Racking Type</label> \
						<select class='required' id='zon_racking'>"+selects.zon_racking+"</select> \
					</div> \
					<div class='form-column'> \
						<label for='zon_mounting_method'>Mounting Method</label> \
						<select class='required' id='zon_mounting_method'>"+selects.zon_mounting_method+"</select> \
						<label for='zon_pitch'>Surface Pitch</label> \
						<select class='required' id='zon_pitch'>"+selects.zon_pitch+"</select> \
						<input type='text' id='zon_custom_pitch' value='"+data.zon_custom_pitch+"' style='width:25%; "+custom_pitch_style+"' /><label for='zon_custom_pitch' style='padding-left:4px; "+custom_pitch_style+"'>º</label> \
						<label for='zon_mounting_medium'>Mounting Medium</label> \
						<select class='required' id='zon_mounting_medium'>"+selects.zon_mounting_medium+"</select> \
						<label for='zon_support_dist'>Distance Between Supports (ft)</label> \
						<input class='required' type='text' id='zon_support_dist' value='"+data.zon_support_dist+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='zon_num_cont_arrays'>Contiguous Arrays</label> \
						<input class='required' type='text' id='zon_num_cont_arrays' value='"+data.zon_num_cont_arrays+"' /> \
						<label for='zon_rebate'>Rebate ($/W)</label> \
						<input class='required' type='text' id='zon_rebate' value='"+data.zon_rebate+"' /> \
						<label for='zon_rebate_desc'>Rebate Description</label> \
						<input type='text' id='zon_rebate_desc' value='"+data.zon_rebate_desc+"' /> \
						<label for='zon_pvwatts'>PV Watts Query (optional)</label> \
						<input type='text' id='zon_pvwatts' value='"+data.zon_pvwatts+"' /> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='UpdateZone' value='Update' /> \
					<input type='submit' title='CancelQZone' value='Cancel' /> \
				</form>";
		edit += "</td>";
		return edit;
	}
});
////////////////////////////////////////////////////////////////////////////// proposals : reps
var Proposals = Module.extend({
  	init:function(el,io,s) {
		this._super(el,io);
		var t = this;
		// settings
		this.s = s;
		this.dbOrder = this.s.order;
		// new item -- controlled by customers
		// cancel add
		$("input[title='Cancel']",$(t.el)).live("click",function() {
			t.io.request(t,"table="+t.dbTable+"&order="+t.dbOrder+"&wc="+t.s.filter+"!!pro_officeID='"+$('#data').data('rep').rep_officeID+"'&"+t.itemFormOptions()+"&es_do=browseAllProposals");
		});
		// add new
		$("input[title='Add']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			var czID = "";
			$(".choose-zones",$(t.el)).each(function(i) { if($(this).attr("checked")) czID += $(this).attr("id").substring(11)+","; });
			if(czID=="") $("#pro_zones").css("color","red");
			if(ds=="" || czID=="") return false;
			ds += "pro_officeID="+$($("#data").data("job")).data("officeID")+"&";
			ds += "pro_repID="+$($("#data").data("job")).data("repID")+"&";
			ds += "pro_customerID="+$($("#data").data("job")).data("customerID")+"&";
			ds += "pro_jobID="+$($("#data").data("job")).data("ID")+"&";
			ds += "pro_zones="+czID+"&";
			ds += $("#pro_credit").attr("checked") ? "pro_credit=1&" : "pro_credit=0&";
			ds += $("#pro_incentive").attr("checked") ? "pro_incentive=1&" : "pro_incentive=0&";
			t.io.request(t,ds+"&table="+t.dbTable+"&es_do=addProposal");
		});
		// preview
		$("input[title='Preview']",$(t.el)).live("click",function() {
			var ds = $(this).closest("form").postify();
			var czID = "";
			$(".choose-zones",$(t.el)).each(function(i) { if($(this).attr("checked")) czID += $(this).attr("id").substring(11)+","; });
			if(czID=="") $("#pro_zones").css("color","red");
			if(ds=="" || czID=="") return false;
			ds += "pro_officeID="+$($("#data").data("job")).data("officeID")+"&";
			ds += "pro_repID="+$($("#data").data("job")).data("repID")+"&";
			ds += "pro_customerID="+$($("#data").data("job")).data("customerID")+"&";
			ds += "pro_jobID="+$($("#data").data("job")).data("ID")+"&";
			ds += "pro_zones="+czID+"&";
			ds += $("#pro_credit").attr("checked") ? "pro_credit=1&" : "pro_credit=0&";
			ds += $("#pro_incentive").attr("checked") ? "pro_incentive=1&" : "pro_incentive=0&";
			t.currentForm = $(this).closest("form");
			t.io.request(t,ds+"&table="+t.dbTable+"&es_do=peakProposal");
		});
		// submit
		$("input[title='Submit']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.id.substring(3);
			if(!confirm("Submitting will email this Proposal to your Office's General Manager(s) for review.\n\nSubmit Proposal #"+t.currentRowID+"?")) return false;
			$(this).hide();
			$("#emailing-gif-"+t.currentRowID).show();
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&"+t.itemFormOptions()+"&es_do=submitProposal");
		});
		// publish
		$("input[title='Publish']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.id.substring(3);
			if(!confirm("Publishing will email this Proposal to your prospective Customer for review.\n\nPublish Proposal #"+t.currentRowID+"?")) return false;
			$(this).hide();
			$("#emailing-gif-"+t.currentRowID).show();
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&es_do=publishProposal");
		});
		// hover over rows
		$("tr",$(t.el)).live("mouseenter",function() {
			$(".edit-panel",this).css("visibility","visible");
		});
		$("tr",$(t.el)).live("mouseleave",function() {
			$(".edit-panel",this).css("visibility","hidden");
		});
		// view link -- controlled by href
		// edit link
		$("a[title='Edit']",$(t.el)).live("click",function() {
			$("#data").data("inter-holder-id",this.parentNode.parentNode.parentNode.id.substring(3));
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#edit-"+this.parentNode.parentNode.parentNode.id).show();
			$("input[title='PreviewQ']",$("#edit-"+this.parentNode.parentNode.parentNode.id)).click();
		});
		// cancel update
		$("input[title='CancelQ']",$(t.el)).live("click",function() {
			$("#"+this.parentNode.parentNode.parentNode.id).hide();
			$("#"+this.parentNode.parentNode.parentNode.id.substring(5)).show();
		});
		// update
		$("input[title='Update']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			var czID = "";
			$(".choose-zones",this.parentNode).each(function(i) { if($(this).attr("checked")) czID += $(this).attr("id").substring(11)+","; });
			if(czID=="") $("#pro_zones"+t.currentRowID).css("color","red");
			if(ds=="" || czID=="") return false;
			ds += "pro_zones="+czID+"&";
			ds += $("#pro_credit"+t.currentRowID).attr("checked") ? "pro_credit=1&" : "pro_credit=0&";
			ds += $("#pro_incentive"+t.currentRowID).attr("checked") ? "pro_incentive=1&" : "pro_incentive=0&";
			t.io.request(t,ds+"id="+t.currentRowID+"&table="+t.dbTable+"&"+t.itemFormOptions()+"&es_do=updateProposal");
		});
		// preview update
		$("input[title='PreviewQ']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(8);
			var ds = $(this).closest("form").postify();
			var czID = "";
			$(".choose-zones",this.parentNode).each(function(i) { if($(this).attr("checked")) czID += $(this).attr("id").substring(11)+","; });
			if(czID=="") $("#pro_zones"+t.currentRowID).css("color","red");
			if(ds=="" || czID=="") return false;
			ds += "pro_officeID="+$("#pro"+t.currentRowID).data("officeID")+"&";
			ds += "pro_repID="+$("#pro"+t.currentRowID).data("repID")+"&";
			ds += "pro_customerID="+$("#pro"+t.currentRowID).data("customerID")+"&";
			ds += "pro_jobID="+$("#pro"+t.currentRowID).data("jobID")+"&";
			ds += "pro_zones="+czID+"&";
			ds += $("#pro_credit"+t.currentRowID).attr("checked") ? "pro_credit=1&" : "pro_credit=0&";
			ds += $("#pro_incentive"+t.currentRowID).attr("checked") ? "pro_incentive=1&" : "pro_incentive=0&";
			t.currentForm = $(this).closest("form");
			t.io.request(t,ds+"&table="+t.dbTable+"&es_do=peakProposal");
		});
		// clone link
		$("a[title='Clone']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.parentNode.id.substring(3);
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&"+t.itemFormOptions()+"&es_do=cloneProposal");
		});
		// trash link
		$("a[title='Trash']",$(t.el)).live("click",function() {
			t.currentRowID = this.parentNode.parentNode.parentNode.id.substring(3);
			if(!confirm("Are you sure you want to delete this item? This cannot be undone.")) return false;
			t.io.request(t,"id="+t.currentRowID+"&table="+t.dbTable+"&pro_officeID="+$('#pro'+t.currentRowID).data('officeID')+"&pro_repID="+$('#pro'+t.currentRowID).data('repID')+"&pro_customerID="+$('#pro'+t.currentRowID).data('customerID')+"&pro_jobID="+$('#pro'+t.currentRowID).data('jobID')+"&es_do=deleteProposal");
		});
		// interconnections
		$("a[title='Add Inverter(s)']",$(t.el)).live("click",function() {
			var num = this.parentNode.nextElementSibling.childElementCount+1;
			var clear = num%4==1 ? "clear" : "";
			var ai = "<div class='form-column "+clear+"'> \
							<label style='padding-bottom:5px;' for='pro_inter_method_"+num+"'>Interconnection Method <a href='javascript:void(0);' title='Delete Inverter(s)' class='lesser' style='vertical-align:bottom; padding:0 0 0 52px;'>&#10005;</a></label> \
							<select class='required' id='pro_inter_method_"+num+"'>"+$('#data').data('inter_methods')+"</select> \
							<label style='padding-bottom:5px;' for='pro_inverter_"+num+"'>Inverter Type</label> \
							<select class='required inverter-select' id='pro_inverter_"+num+"'>"+$('#data').data('inverters')+"</select> \
					 </div>";
			$(this.parentNode.nextElementSibling).append($(ai));
		});
		$("a[title='Delete Inverter(s)']",$(t.el)).live("click",function() {
			$(this.parentNode.parentNode).remove();
		});
		$(".inverter-select",$(t.el)).live("change",function() {
			if(this.value.substring(0,7).toLowerCase()=="enphase") {
				var qnty = "<div class='inverter-qnty-holder'><span style='color:#808080;'>x </span>&nbsp;<input style='display:inline; width:30px; text-align:right;' type='text' id='qnty-"+this.id+"' value='1' /></div>";
				$(".inverter-qnty-holder",this.parentNode).remove();
				$(this.parentNode).append(qnty);
			} else $(".inverter-qnty-holder",this.parentNode).remove();
		});
		// rebates
		$("a[title='Add Rebate']",$(t.el)).live("click",function() {
			var num = this.parentNode.nextElementSibling.childElementCount+1;
			var ar = "<div class='form-column'> \
						<label for='pro_rebate_type_"+num+"'>Rebate Type <a href='javascript:void(0);' title='Delete Rebate' class='lesser' style='vertical-align:bottom; padding:0 0 0 84px;'>&#10005;</a></label> \
						<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+num+"' value='0' checked='checked' /> $/W \
						<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+num+"' value='1' /> Percent \
						<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+num+"' value='2' /> Fixed \
						<label for='pro_rebate_amnt_"+num+"' style='padding:5px 0 2px;'>Rebate Amount</label> \
						<input type='text' id='pro_rebate_amnt_"+num+"' value='' /> \
						<label for='pro_rebate_desc_"+num+"'>Rebate Description</label> \
						<input type='text' id='pro_rebate_desc_"+num+"' value='' /> \
					</div>";
			$(this.parentNode.nextElementSibling).append($(ar));
		});
		$("a[title='Delete Rebate']",$(t.el)).live("click",function() {
			$(this.parentNode.parentNode).remove();
		});
		// incentive
		$(".pro-incentive",$(t.el)).live("click",function() {
			if($(this.nextElementSibling).css("display")=="none") $(this.nextElementSibling).show();
			else $(this.nextElementSibling).hide();
		});
	},
  	show:function(holder) { this._super(holder); },
	hide:function() { this._super(); },
	begin:function(refresh) {
		if(!refresh) {
			this._super(); 
			this.show(this.s.holder);
		}
		// get all
		this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc="+this.s.filter+"!!pro_officeID='"+$('#data').data('rep').rep_officeID+"'&"+this.itemFormOptions()+"&es_do=browseAllProposals");
	},
	clear:function() { this._super(); },
	iHTML:function() {
		this._super();
		// returns the initial html for this module
		return "<div class='dashboard-item'> \
					<div class='dashboard-item-header'> \
						<h1 class='dashboard-header'>"+$("#data").data("city")+" "+this.s.title+"</h1> \
					</div> \
					<div class='dashboard-item-content'><p style='padding:10px; color:#808080;'>Loading...</p></div> \
				</div>";
	},
	dbTable:"es_proposals",
	dbOrder:"",
	itemForm:function() {
		// override
		this.io.request(this,this.itemFormOptions()+"&table="+this.dbTable+"&jobID="+$($("#data").data("job")).data("ID")+"&offID="+$($("#data").data("job")).data("officeID")+"&es_do=getOptions");
	},
	itemFormOptions:function() {
		return "menus=pro_zones,pro_inter_method,pro_inverter&sources=es_zones,es_inter_comps,es_inverters&columns=ID,int_model_num,inv_model_num";
	},
	receive:function(json) {
		this._super();
		// build vars
		var html = "";
		switch(json.did) {
			case this.dbTable+" previewed" :
				// optional margins
				var p_margin = json.data.permit_margin!=0 ? json.data.permit_margin+"%" : "n / a";
				var s_margin = json.data.sub_margin!=0 ? json.data.sub_margin+"%" : "n / a";
				var e_margin = json.data.equip_margin!=0 ? json.data.equip_margin+"%" : "n / a";
				var l_margin = json.data.install_labor_margin!=0 ? json.data.install_labor_margin+"%" : "n / a";
				var i_margin = json.data.inventory_margin!=0 ? json.data.inventory_margin+"%" : "n / a";
				var ni_margin = json.data.non_inventory_margin!=0 ? json.data.non_inventory_margin+"%" : "n / a";
				// colors
				var p_margin_c = (p_margin<Einstein.MARGIN_LOWER) ? "red" : (p_margin>Einstein.MARGIN_UPPER) ? "green" : "black";
				var s_margin_c = (s_margin<Einstein.MARGIN_LOWER) ? "red" : (s_margin>Einstein.MARGIN_UPPER) ? "green" : "black";
				var e_margin_c = (e_margin<Einstein.MARGIN_LOWER) ? "red" : (e_margin>Einstein.MARGIN_UPPER) ? "green" : "black";
				var l_margin_c = (l_margin<Einstein.MARGIN_LOWER) ? "red" : (l_margin>Einstein.MARGIN_UPPER) ? "green" : "black";
				var i_margin_c = (i_margin<Einstein.MARGIN_LOWER) ? "red" : (i_margin>Einstein.MARGIN_UPPER) ? "green" : "black";
				var ni_margin_c = (ni_margin<Einstein.MARGIN_LOWER) ? "red" : (ni_margin>Einstein.MARGIN_UPPER) ? "green" : "black";
				var t_margin_c = (json.data.total_margin<Einstein.MARGIN_LOWER) ? "red" : (json.data.total_margin>Einstein.MARGIN_UPPER) ? "green" : "black";
				var ppw_gross_c = (json.data.ppw_gross<Einstein.PPW_GROSS_LOWER) ? "red" : (json.data.ppw_gross>Einstein.PPW_GROSS_UPPER) ? "green" : "black";
				var ppw_net_c = (json.data.ppw_net<Einstein.PPW_NET_LOWER) ? "red" : (json.data.ppw_net>Einstein.PPW_NET_UPPER) ? "green" : "black";
				// write it
				var html = "<table cellpadding='0' cellspacing='0'>";
				html += "<tr class='dark'>";
				html += "<td style='color:#808080;'>Inventory Margin:</td><td style='color:"+i_margin_c+";' align='right'>"+i_margin+"</td>";
				html += "<td style='color:#808080;'>System Size:</td><td style='font-weight:bold;' align='right'>"+json.data.size+" kW</td>";
				html += "</tr>";
				html += "<tr class='light'>";
				html += "<td style='color:#808080;'>Non-Inventory Margin:</td><td style='color:"+ni_margin_c+";' align='right'>"+ni_margin+"</td>";
				html += "<td style='color:#808080;'>Install Labor:</td><td style='font-weight:bold;' align='right'>"+(Math.round(json.data.install_labor_hrs*100)/100)+" hrs</td>";
				html += "</tr>";
				html += "<tr class='dark'>";
				html += "<td style='color:#808080;'>Equipment Margin:</td><td style='color:"+e_margin_c+";' align='right'>"+e_margin+"</td>";
				html += "<td style='color:#808080;'>Price:</td><td style='font-weight:bold;' align='right'>$"+json.data.price+"</td>";
				html += "</tr>";
				html += "<tr class='light'>";
				html += "<td style='color:#808080;'>Installation Labor Margin:</td><td style='color:"+l_margin_c+";' align='right'>"+l_margin+"</td>";
				html += "<td style='color:#808080;'>PPW Gross:</td><td style='color:"+ppw_gross_c+"; font-weight:bold;' align='right'>$"+json.data.ppw_gross+"/W</td>";
				html += "</tr>";
				html += "<tr class='dark'>";
				html += "<td style='color:#808080;'>Permit Margin:</td><td style='color:"+p_margin_c+";' align='right'>"+p_margin+"</td>";
				html += "<td style='color:#808080;'>PPW Net:</td><td style='color:"+ppw_net_c+"; font-weight:bold;' align='right'>$"+json.data.ppw_net+"/W</td>";
				html += "</tr>";
				html += "<tr class='light'>";
				html += "<td style='color:#808080;'>Subcontractor Margin:</td><td style='color:"+s_margin_c+";' align='right'>"+s_margin+"</td>";
				html += "<td style='color:#808080;'>Total Margin:</td><td style='color:"+t_margin_c+"; font-weight:bold;' align='right'>"+json.data.total_margin+"%</td>";
				html += "</tr>";
				html += "</table>";
				// show the results
				$(".preview-panel",this.currentForm).html($(html));
				break;
			case this.dbTable+" added" :
				// show the list again
				$(".dashboard-item-content",$(this.el)).html("");
				this.io.request(this,"table="+this.dbTable+"&order="+this.dbOrder+"&wc="+this.s.filter+"!!pro_officeID='"+$('#data').data('rep').rep_officeID+"'&"+this.itemFormOptions()+"&es_do=browseAllProposals");
				break;
			case this.dbTable+" updated" :
				$("#pro"+this.currentRowID).html(this.rowContent(json.data)).show();
				$("#edit-pro"+this.currentRowID).html(this.editRowContent(json.data,json.data2)).hide();
				// get the calculations
				this.io.request(this,"id="+this.currentRowID+"&es_do=getPropCalcs");
				break;
			case this.dbTable+" deleted" :
				// remove the rows
				$("#pro"+this.currentRowID).remove();
				$("#edit-pro"+this.currentRowID).remove();
				// clear if none left
				if(!$("#"+this.s.wrapper).children().length) this.empty();
				break;
			case this.dbTable+" cloned" :
				// find drafts bin
				var drafts = this.drafts || this;
				// create the row
				var html = "<tr id='pro"+json.data.ID+"' class='cloned-row'>";
				html += drafts.rowContent(json.data);
				html += "</tr>";
				html += "<tr id='edit-pro"+json.data.ID+"' style='display:none;' class='quick-edit cloned-row'>";
				html += drafts.editRowContent(json.data,json.data2);
				html += "</tr>";
				// add to page
				$("#"+drafts.s.wrapper).prepend(html);
				// add vars
				$("#pro"+json.data.ID).data("officeID",json.data.pro_officeID);
				$("#pro"+json.data.ID).data("repID",json.data.pro_repID);
				$("#pro"+json.data.ID).data("customerID",json.data.pro_customerID);
				$("#pro"+json.data.ID).data("jobID",json.data.pro_jobID);
				// get the calculations
				drafts.io.request(drafts,"id="+json.data.ID+"&es_do=getPropCalcs");
				break;
			case "invalid email" :
				alert('Oops! '+json.data.action+' Proposal #'+json.data.pro+' failed.\n\nThis Proposal\'s Project, "'+json.data.job+'", has an invalid e-mail address. Please edit this Project and provide a valid e-mail address before '+json.data.action+' again.\n\n'+'');
				$("#emailing-gif-"+json.data.pro).hide();
				$("input",$("#pro"+json.data.pro)).show();
				break;
			case this.dbTable+" submitted" :
				// check structure
				if(!$("#"+this.submitted.s.wrapper).length) {
					var html = "<table cellpadding='0' cellspacing='0'>";
					// build the titles
					html += "<thead>";
					html += "<tr>";
					html += "<th colspan='1'>#</th>";
					html += "<th colspan='1'>Project Name</th>";
					html += "<th colspan='1' align='right'>System Size (kW)</th>";
					html += "<th colspan='1' align='right'>Price ($)</th>";
					html += "<th colspan='1' align='right'>PPW Gross ($/W)</th>";
					html += "<th colspan='1' align='right'>PPW Net ($/W)</th>";
					html += "<th colspan='1' align='right'>Total Margin (%)</th>";
					html += "<th colspan='1' align='right'>"+this.submitted.s.date.head+"</th>";
					html += "</tr>";
					html += "</thead>";
					html += "<tbody id='"+this.submitted.s.wrapper+"'>";
					html += "</tbody>";
					html += "</table>";
					// add to page
					$(".dashboard-item-content",$(this.submitted.el)).html(html);
				}
				// write the row
				var row = "<tr id='pro"+json.data.ID+"' class='moved'>";
				row += this.submitted.rowContent(json.data);
				row += "</tr>";
				row += "<tr id='edit-pro"+json.data.ID+"' style='display:none;' class='quick-edit moved'>";
				row += this.submitted.editRowContent(json.data,json.data2);
				row += "</tr>";
				// remove from proposal drafts
				$("#pro"+this.currentRowID).remove();
				$("#edit-pro"+this.currentRowID).remove();
				// clear if none left
				if(!$("#"+this.s.wrapper).children().length) this.empty();
				// add to submitted proposals
				$(row).prependTo("#"+this.submitted.s.wrapper);
				// create vars for proposal
				$("#pro"+json.data.ID).data("officeID",json.data.pro_officeID);
				$("#pro"+json.data.ID).data("repID",json.data.pro_repID);
				$("#pro"+json.data.ID).data("customerID",json.data.pro_customerID);
				$("#pro"+json.data.ID).data("jobID",json.data.pro_jobID);
				// get the calculations
				this.io.request(this,"id="+json.data.ID+"&es_do=getPropCalcs");
				// send mail
				this.io.request(this,"id="+json.data.ID+"&es_do=sendProposal");
				break;
			case this.dbTable+" published" :
				// check structure
				if(!$("#"+this.published.s.wrapper).length) {
					var html = "<table cellpadding='0' cellspacing='0'>";
					// build the titles
					html += "<thead>";
					html += "<tr>";
					html += "<th colspan='1'>#</th>";
					html += "<th colspan='1'>Project Name</th>";
					html += "<th colspan='1' align='right'>System Size (kW)</th>";
					html += "<th colspan='1' align='right'>Price ($)</th>";
					html += "<th colspan='1' align='right'>PPW Gross ($/W)</th>";
					html += "<th colspan='1' align='right'>PPW Net ($/W)</th>";
					html += "<th colspan='1' align='right'>Total Margin (%)</th>";
					html += "<th colspan='1' align='right'>"+this.published.s.date.head+"</th>";
					html += "</tr>";
					html += "</thead>";
					html += "<tbody id='"+this.published.s.wrapper+"'>";
					html += "</tbody>";
					html += "</table>";
					// add to page
					$(".dashboard-item-content",$(this.published.el)).html(html);
				}
				// write the row
				var row = "<tr id='pro"+json.data.ID+"' class='moved'>";
				row += this.published.rowContent(json.data);
				row += "</tr>";
				// remove from proposal drafts
				$("#pro"+this.currentRowID).remove();
				$("#edit-pro"+this.currentRowID).remove();
				// clear if none left
				if(!$("#"+this.s.wrapper).children().length) this.empty();
				// add to submitted proposals
				$(row).prependTo("#"+this.published.s.wrapper);
				// create vars for proposal
				$("#pro"+json.data.ID).data("officeID",json.data.pro_officeID);
				$("#pro"+json.data.ID).data("repID",json.data.pro_repID);
				$("#pro"+json.data.ID).data("customerID",json.data.pro_customerID);
				$("#pro"+json.data.ID).data("jobID",json.data.pro_jobID);
				// get the calculations
				this.io.request(this,"id="+json.data.ID+"&es_do=getPropCalcs");
				// send mail
				this.io.request(this,"id="+json.data.ID+"&es_do=sendProposal");
				break;
			case "sent proposal" : break;
			case "found "+this.dbTable :
				var html = "<table cellpadding='0' cellspacing='0'>";
				// build the titles
				html += "<thead>";
				html += "<tr>";
				html += "<th colspan='1'>#</th>";
				html += "<th colspan='1'>Project Name</th>";
				html += "<th colspan='1' align='right'>System Size (kW)</th>";
				html += "<th colspan='1' align='right'>Price ($)</th>";
				html += "<th colspan='1' align='right'>PPW Gross ($/W)</th>";
				html += "<th colspan='1' align='right'>PPW Net ($/W)</th>";
				html += "<th colspan='1' align='right'>Total Margin (%)</th>";
				html += "<th colspan='1' align='right'>"+this.s.date.head+"</th>";
				html += "</tr>";
				html += "</thead>";
				html += "<tbody id='"+this.s.wrapper+"'>";
				// loop over each result
				var color = ["dark","light"];
				for(var i=0;i<json.data.length;i++) {
					// write the rows
					html += "<tr id='pro"+json.data[i].ID+"' class='"+color[(i+1)%2]+"'>";
					html += this.rowContent(json.data[i]);
					html += "</tr>";
					html += "<tr id='edit-pro"+json.data[i].ID+"' style='display:none;' class='quick-edit "+color[(i+1)%2]+"'>";
					html += this.editRowContent(json.data[i],json.data2);
					html += "</tr>";
				}
				html += "</tbody>";
				html += "</table>";
				// add to page
				$(".dashboard-item-content",$(this.el)).html(html);
				// create vars for each proposal
				for(var i=0;i<json.data.length;i++) {
					$("#pro"+json.data[i].ID).data("officeID",json.data[i].pro_officeID);
					$("#pro"+json.data[i].ID).data("repID",json.data[i].pro_repID);
					$("#pro"+json.data[i].ID).data("customerID",json.data[i].pro_customerID);
					$("#pro"+json.data[i].ID).data("jobID",json.data[i].pro_jobID);
				}
				// get the calculations
				for(var i=0;i<json.data.length;i++) {
					this.io.request(this,"id="+json.data[i].ID+"&es_do=getPropCalcs");
				}
				break;
			case this.dbTable+" got calcs" :
				// colors
				var t_margin_c = (json.data.total_margin<Einstein.MARGIN_LOWER) ? "red" : (json.data.total_margin>Einstein.MARGIN_UPPER) ? "green" : "black";
				var ppw_gross_c = (json.data.ppw_gross<Einstein.PPW_GROSS_LOWER) ? "red" : (json.data.ppw_gross>Einstein.PPW_GROSS_UPPER) ? "green" : "black";
				var ppw_net_c = (json.data.ppw_net<Einstein.PPW_NET_LOWER) ? "red" : (json.data.ppw_net>Einstein.PPW_NET_UPPER) ? "green" : "black";
				// polulate the proper row
				$("#pro_size-"+json.data.ID).html(json.data.size);
				$("#pro_price-"+json.data.ID).html(json.data.price);
				$("#pro_ppw_gross-"+json.data.ID).html(json.data.ppw_gross).css("color",ppw_gross_c);
				$("#pro_ppw_net-"+json.data.ID).html(json.data.ppw_net).css("color",ppw_net_c);
				$("#pro_margin-"+json.data.ID).html(json.data.total_margin).css("color",t_margin_c);
				break;
			case "no "+this.dbTable :
				// clear the list
				this.empty();
				break;
			case "got "+this.dbTable+" options" :
				// loop over the results
				var selects = {};
				for(set in json.data) {
					if(set!="pro_zones" && set!="pro_cover_letter") {	
						var menu = "<option value='' selected='selected'>--select--</option>";
						for(options in json.data[set]) {
							for(values in json.data[set][options]) {
								menu += "<option value='"+json.data[set][options][values]+"'>"+json.data[set][options][values]+"</option>";
							}
						}
					} else if(set!="pro_cover_letter") {
						var menu = "";
						for(options in json.data[set]) {
							menu += "<input style='display:inline;' type='checkbox' id='choose-zone"+json.data[set][options].ID+"' class='choose-zones' value='' /> "+json.data[set][options].zon_name+" ("+json.data[set][options].zon_size+" kW)<br />";
						}
					}
					selects[set] = menu;
				}
				// cover letter
				var default_cover_letter = json.data.pro_cover_letter;
				// make the form
				var form = "<form class='addproposalform' action='javascript:void(0);'> \
							<h1 class='add-proposal-section'>Zone Info</h1> \
							<div class='form-column'> \
								<label id='pro_zones'>Choose Project Zones:</label> \
								"+selects.pro_zones+" \
							</div> \
							<div class='clear'></div> \
							<br /> \
							\
							<h1 class='add-proposal-section'>Inverters&nbsp;&nbsp;<a class='adder' title='Add Inverter(s)' href='javascript:void(0);'>+</a></h1> \
							<div> \
								<div class='form-column'> \
									<label style='padding-bottom:5px;' for='pro_inter_method_1'>Interconnection Method <a href='javascript:void(0);' title='Delete Inverter(s)' class='lesser' style='vertical-align:bottom; padding:0 0 0 52px;'>&#10005;</a></label> \
									<select class='required' id='pro_inter_method_1'>"+selects.pro_inter_method+"</select> \
									<label style='padding-bottom:5px;' for='pro_inverter_1'>Inverter Type</label> \
									<select class='required inverter-select' id='pro_inverter_1'>"+selects.pro_inverter+"</select> \
								</div> \
							</div> \
							<div class='clear'></div> \
							<br /> \
							\
							<h1 class='add-proposal-section'>Miscellaneous</h1> \
							<div class='form-column'> \
								<label for='pro_conduit_out'>Overground Conduit (ft)</label> \
								<input class='required' type='text' id='pro_conduit_out' value='0' /> \
								<label for='pro_conduit_in'>Indoor Conduit (ft)</label> \
								<input class='required' type='text' id='pro_conduit_in' value='0' /> \
								<label for='pro_conduit_under'>Underground Conduit (ft)</label> \
								<input class='required' type='text' id='pro_conduit_under' value='0' /> \
							</div> \
							<div class='form-column'> \
								<label for='pro_num_trips'># Install Days</label> \
								<input class='required' type='text' id='pro_num_trips' value='2' /> \
								<label for='pro_num_installers'># Installers</label> \
								<input class='required' type='text' id='pro_num_installers' value='3' /> \
							</div> \
							<div class='form-column'> \
								<label for='pro_winter'>Off-season installation?</label> \
								<select class='required' id='pro_winter'> \
									<option value='1'>yes</option> \
									<option value='0' selected='selected'>no</option> \
								</select> \
								<label for='pro_others_involved'>Other builders involved?</label> \
								<select class='required' id='pro_others_involved'> \
									<option value='1'>yes</option> \
									<option value='0' selected='selected'>no</option> \
								</select> \
							</div> \
							<div class='clear'></div> \
							<br /> \
							\
							<h1 class='add-proposal-section'>Other Costs & Fees</h1> \
							<div class='form-column'> \
								<label for='pro_taxrate'>Sales Tax Rate (%)</label> \
								<input class='required' type='text' id='pro_taxrate' value='3.41' /> \
								<label for='pro_engin_fee'>Engineering Fee ($)</label> \
								<input class='required' type='text' id='pro_engin_fee' value='0' /> \
								<label for='pro_permit_fee'>Permit Fee ($)</label> \
								<input class='required' type='text' id='pro_permit_fee' value='0' /> \
							</div> \
							<div class='form-column'> \
								<label for='pro_inspection'>Des. / Ins. / Comm. Fee ($)</label> \
								<input class='required' type='text' id='pro_inspection' value='0' /> \
								<label for='pro_equip_rental'>Equipment Rental Fee ($)</label> \
								<input class='required' type='text' id='pro_equip_rental' value='0' /> \
								<label for='pro_fluctuation'>Add / Subtract Labor ($)</label> \
								<input class='required' type='text' id='pro_fluctuation' value='0' /> \
							</div> \
							<div class='form-column'> \
								<label for='pro_misc_materials'>Misc. Materials ($)</label> \
								<input type='text' id='pro_misc_materials' value='0' /> \
								<label for='pro_misc_materials_up'>Misc. Materials Margin (%)</label> \
								<input type='text' id='pro_misc_materials_up' value='0' /> \
								<label for='pro_misc_materials_desc'>Misc. Materials Description</label> \
								<input type='text' id='pro_misc_materials_desc' value='' /> \
							</div> \
							<div class='form-column'> \
								<label for='pro_extra_fee'>Extra Fees ($)</label> \
								<input type='text' id='pro_extra_fee' value='0' /> \
								<label for='pro_extra_desc'>Extra Fees Description</label> \
								<input type='text' id='pro_extra_desc' value='' /> \
							</div> \
							<div class='form-column-right'> \
								<label for='pro_discount'>Discount ($)</label> \
								<input class='required' type='text' id='pro_discount' value='0' /> \
								<label for='pro_discount_desc'>Discount Description</label> \
								<input type='text' id='pro_discount_desc' value='' /> \
							</div> \
							<div class='clear'></div> \
							<br /> \
							\
							<h1 class='add-proposal-section'>Additional Rebates&nbsp;&nbsp;<a class='adder' title='Add Rebate' href='javascript:void(0);'>+</a></h1> \
							<div> \
								<div class='form-column'> \
									<label for='pro_rebate_type_1'>Rebate Type <a href='javascript:void(0);' title='Delete Rebate' class='lesser' style='vertical-align:bottom; padding:0 0 0 84px;'>&#10005;</a></label> \
									<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_1' value='0' checked='checked' /> $/W \
									<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_1' value='1' /> Percent \
									<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_1' value='2' /> Fixed \
									<label for='pro_rebate_amnt_1' style='padding:5px 0 2px;'>Rebate Amount</label> \
									<input type='text' id='pro_rebate_amnt_1' value='' /> \
									<label for='pro_rebate_desc_1'>Rebate Description</label> \
									<input type='text' id='pro_rebate_desc_1' value='' /> \
								</div> \
							</div> \
							<div class='clear'></div> \
							<br /> \
							\
							<h1 class='add-proposal-section'>Options</h1> \
							<div class='form-column'> \
								<input style='display:inline;' type='checkbox' class='no-postify' id='pro_credit' value='' checked='checked' /> Include 30% Tax Credit? \
								<br /> \
								<input style='display:inline; margin:5px 0 0;' type='checkbox' class='pro-incentive' id='pro_incentive' value='' /> Include Production Based Incentive?&nbsp;&nbsp; \
								<span style='display:none;'> \
									<input style='display:inline; width:30px; text-align:right;' type='text' id='pro_incentive_rate' value='0.11' />&nbsp;&nbsp;<span style='color:#808080;'>$/kWh for</span>&nbsp; \
									<input style='display:inline; width:30px; text-align:right;' type='text' id='pro_incentive_yrs' value='20' />&nbsp;&nbsp;<span style='color:#808080;'>Years</span> \
								</span> \
							</div> \
							<div class='clear'></div> \
							<br /> \
							\
							<h1 class='add-proposal-section'>Cover Letter</h1> \
							<textarea id='pro_cover_letter' style='width:100%; height:200px;'>"+default_cover_letter+"</textarea> \
							<div class='clear'></div> \
							<br /> \
							<input type='submit' title='Preview' value='Preview' /> \
							<input type='submit' title='Add' value='Add New' /> \
							<input type='submit' title='Cancel' value='Cancel' /> \
							<div class='preview-panel'></div> \
						</form>";
						// write the form
						$(".dashboard-item-content",$(this.el)).html("<h1 id='proposals-header' class='addform-header'>New Proposal Info:</h1><br />"+form);
						// add data for interconnections
						$("#data").data("inter_methods",selects.pro_inter_method).data("inverters",selects.pro_inverter);
						$("#data").data("inter-holder-id","new");
						// go to it
						$.scrollTo(this.el);
				break;
			//-----------------------------------//
			default :
				console.log(json.did+" from "+this.dbTable);
				break;
		}
	},
	rowContent:function(data) {
		this._super();
		// vars
		var panel, action;
		switch(this.s.panel) {
			case 0 :
				panel = "<span class='edit-panel'>";
				panel += 	"<a href='"+Einstein.PORTAL_URI+"?pro_key="+data.pro_key+"' target='_blank' class='view-link' title='View'>View</a> | ";
				panel += 	"<a href='javascript:void(0);' class='edit-link' title='Edit'>Edit</a>";
				panel += 	"<span> | <a href='javascript:void(0);' class='clone-link' title='Clone'>Clone</a></span>";
				panel += 	($("#data").data("role")==2 || $("#data").data("role")==4) ? " | <a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>" : "";
				panel += "</span>";
				break;
			case 1 :
				panel = "<span class='edit-panel'>";
				panel += 	"<a href='"+Einstein.PORTAL_URI+"?pro_key="+data.pro_key+"' target='_blank' class='view-link' title='View'>View</a>";
				panel += 	"<span> | <a href='javascript:void(0);' class='clone-link' title='Clone'>Clone</a></span>";
				panel += 	($("#data").data("role")==2 || $("#data").data("role")==4) ? " | <a href='javascript:void(0);' class='trash-link' title='Trash'>Trash</a>" : "";
				panel += "</span>";
				break;
		}
		switch(this.s.action) {
			case "submit" :
				action = "<td colspan='1' align='right'><input type='submit' title='Submit' value='Submit' /><img style='display:none;' id='emailing-gif-"+data.ID+"' src='gfx/emailing.gif' alt='emailing...' /></td>";
				break;
			case "publish" :
				action = ($("#data").data("role")==2 || $("#data").data("role")==4) ? "<td colspan='1' align='right'><input type='submit' title='Publish' value='Publish' /><img style='display:none;' id='emailing-gif-"+data.ID+"' src='gfx/emailing.gif' alt='emailing...' /></td>" : "";
				break;
			default : action = "";
		}
		// create the row
		var row = "<td colspan='1'>";
		row += "<span style='font-weight:bold;'>"+data.ID+"</span><br />";
		row += panel;
		row += "</td>";
		row += "<td colspan='1'>"+data.pro_name+"</td>";
		row += "<td id='pro_size-"+data.ID+"' colspan='1' align='right'><img src='gfx/emailing.gif' alt='loading...' /></td>";
		row += "<td id='pro_price-"+data.ID+"' colspan='1' align='right'><img src='gfx/emailing.gif' alt='loading...' /></td>";
		row += "<td id='pro_ppw_gross-"+data.ID+"' colspan='1' align='right'><img src='gfx/emailing.gif' alt='loading...' /></td>";
		row += "<td id='pro_ppw_net-"+data.ID+"' colspan='1' align='right'><img src='gfx/emailing.gif' alt='loading...' /></td>";
		row += "<td id='pro_margin-"+data.ID+"' colspan='1' align='right'><img src='gfx/emailing.gif' alt='loading...' /></td>";
		row += "<td colspan='1' align='right'>"+$.tsToDate(data[this.s.date.src])+"</td>";
		row += action;
		return row;
	},
	editRowContent:function(data,data2) {
		this._super();
		// loop over the results
		var selects = {};
		for(set in data2) {
			if(set=="pro_zones"+data.ID) {
				var menu = "";
				var used_zone_ids = data['pro_zones'].substring(0,data['pro_zones'].length-1).split(",");
				for(options in data2[set]) {
					var checked = "";
					for(id in used_zone_ids) if(used_zone_ids[id]==data2[set][options].ID) checked = "checked='yes'";
					menu += "<input style='display:inline;' type='checkbox' id='choose-zone"+data2[set][options].ID+"' class='choose-zones' value='' "+checked+" /> "+data2[set][options].zon_name+" ("+data2[set][options].zon_size+" kW)<br />";
				}
				selects['pro_zones'] = menu;
			} else if(set=="pro_inter_method" || set=="pro_inverter") {
				var parsed = data[set].substring(0,data[set].length-1).split(",");
				// clean up, remove duplicates
				if(set=="pro_inverter") {
					for(var i in parsed) {
						for(var j in parsed) {
							if(parsed[j]==parsed[i] && i!=j && parsed[i]!=null && parsed[j]!=null) {
								if(parsed[j].substring(0,7).toLowerCase()=="enphase") parsed[j] = null;
							}
						}
					}
					parsed = parsed.filter(function(val) { return val !== null; });
					for(var i in parsed) if(parsed[i].search("_g_")!=-1) parsed[i] = parsed[i].slice(0,parsed[i].search("_g_"));
				}
				// write
				var i = 0;
				for(name in parsed) {
					i++;
					var menu = "";
					for(options in data2[set]) {
						for(values in data2[set][options]) {
							var selected = "";
							if(parsed[name]==data2[set][options][values]) { selected = "selected='selected'"; };
							menu += "<option value='"+data2[set][options][values]+"' "+selected+">"+data2[set][options][values]+"</option>";
						}
					}
					selects[set+"_"+i] = menu;
				}
				// make generic menus for adding additional inverters
				var menu = "<option value='' selected='selected'>--select--</option>";
				for(options in data2[set]) {
					for(values in data2[set][options]) {
						menu += "<option value='"+data2[set][options][values]+"'>"+data2[set][options][values]+"</option>";
					}
				}
				selects[set] = menu;
			} else if(set.substring(0,9)!="pro_zones") {
				var menu = "";
				for(options in data2[set]) {
					for(values in data2[set][options]) {
						var selected = (data[set]==data2[set][options][values]) ? "selected='selected'" : "";
						menu += "<option value='"+data2[set][options][values]+"' "+selected+">"+data2[set][options][values]+"</option>";
					}
				}
				selects[set] = menu;
			}
		}
		// add inverters
		var inverters = data.pro_inverter.substring(0,data.pro_inverter.length-1).split(",");
		var duplicates = [];
		for(i in inverters) duplicates[i] = 0;
		for(i in inverters) {
			for(j in inverters) {
				if(inverters[j]==inverters[i] && i!=j && inverters[i]!=null && inverters[j]!=null) {
					if(inverters[j].substring(0,7).toLowerCase()=="enphase") {
						duplicates[j] = -1;
						inverters[j] = null;
					}
				}
			}
		}
		for(i=0;i<duplicates.length;i++) {
			if(duplicates[i]==0) {
				var q = 0;
				var j = i+1;
				while(duplicates[j]==-1) {
					q += 1;
					j += 1; 
				}
				duplicates[i] = q == 0 ? 0 : q + 1;
			}
		}
		inverters = inverters.filter(function(val) { return val !== null; });
		duplicates = duplicates.filter(function(val) { return val !== -1; });
		for(i in duplicates) { 
			if(duplicates[i]==0) {
				if(inverters[i].substring(0,7).toLowerCase()!="enphase") duplicates[i] = -1;
				else duplicates[i] = 1;
			}
		}
		// write inverters
		var inverters_html = "";
		for(i=0;i<inverters.length;i++) {
			var clear = (i+1)%4==1 ? "clear" : ""; var qnty;
			qnty = duplicates[i]!=-1 ? "<div class='inverter-qnty-holder'><span style='color:#808080;'>x </span>&nbsp;<input style='display:inline; width:30px; text-align:right;' type='text' id='qnty-pro_inverter_"+(i+1)+"' value='"+duplicates[i]+"' /></div>" : "";
			inverters_html += "<div class='form-column "+clear+"'> \
								<label style='padding-bottom:5px;' for='pro_inter_method_"+(i+1)+"'>Interconnection Method <a href='javascript:void(0);' title='Delete Inverter(s)' class='lesser' style='vertical-align:bottom; padding:0 0 0 52px;'>&#10005;</a></label> \
						   		<select class='required' id='pro_inter_method_"+(i+1)+"'>"+selects['pro_inter_method_'+(i+1)]+"</select> \
						   		<label style='padding-bottom:5px;' for='pro_inverter_"+(i+1)+"'>Inverter Type</label> \
						   		<select class='required inverter-select' id='pro_inverter_"+(i+1)+"'>"+selects['pro_inverter_'+(i+1)]+"</select> \
								"+qnty+" \
							</div>";
		}
		// additional rebates
		var rebates_html = "";
		var types = data.pro_rebate_type ? data.pro_rebate_type.substring(0,data.pro_rebate_type.length-1).split(",") : [];
		var amnts = data.pro_rebate_amnt ? data.pro_rebate_amnt.substring(0,data.pro_rebate_amnt.length-1).split(",") : [];
		var descs = data.pro_rebate_desc ? data.pro_rebate_desc.substring(0,data.pro_rebate_desc.length-1).split(",") : [];
		for(i=0;i<types.length;i++) {
			var type_html = "";
			switch(types[i]) {
				case "0" :
					type_html = "<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+(i+1)+"' value='0' checked='checked' /> $/W \
								<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+(i+1)+"' value='1' /> Percent \
								<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+(i+1)+"' value='2' /> Fixed";
					break;
				case "1" :
					type_html = "<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+(i+1)+"' value='0' /> $/W \
								<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+(i+1)+"' value='1' checked='checked' /> Percent \
								<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+(i+1)+"' value='2' /> Fixed";
					break;
				case "2" :
					type_html = "<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+(i+1)+"' value='0' /> $/W \
								<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+(i+1)+"' value='1' /> Percent \
								<input style='display:inline; margin:5px 0 0;' type='radio' name='pro_rebate_type_"+(i+1)+"' value='2' checked='checked' /> Fixed";
					break;
			}
			rebates_html += "<div class='form-column'> \
								<label for='pro_rebate_type_"+(i+1)+"'>Rebate Type <a href='javascript:void(0);' title='Delete Rebate' class='lesser' style='vertical-align:bottom; padding:0 0 0 84px;'>&#10005;</a></label> \
								"+type_html+" \
								<label for='pro_rebate_amnt_"+(i+1)+"' style='padding:5px 0 2px;'>Rebate Amount</label> \
								<input type='text' id='pro_rebate_amnt_"+(i+1)+"' value='"+amnts[i]+"' /> \
								<label for='pro_rebate_desc_"+(i+1)+"'>Rebate Description</label> \
								<input type='text' id='pro_rebate_desc_"+(i+1)+"' value='"+descs[i]+"' /> \
							</div>";
		}
		// yes or no selects
		var pro_winter_selects = (data.pro_winter==1) ? "<option value='1' selected='selected'>yes</option><option value='0'>no</option>" : "<option value='1'>yes</option><option value='0' selected='selected'>no</option>";
		var pro_others_involved_selects = (data.pro_others_involved==1) ? "<option value='1' selected='selected'>yes</option><option value='0'>no</option>" : "<option value='1'>yes</option><option value='0' selected='selected'>no</option>";
		// check boxes
		var pro_credit_checked = (data.pro_credit==1) ? "checked='checked'" : "";
		var pro_incentive_checked = (data.pro_incentive==1) ? "checked='checked'" : "";
		var pro_incentive_display = (data.pro_incentive==1) ? "" : "display:none;";
		// null values
		if(data.pro_cover_letter==null) data.pro_cover_letter = "";
		else data.pro_cover_letter = data.pro_cover_letter.replace(/#amp;/g,"&");
		// add data for interconnections
		$("#data").data("inter_methods",selects.pro_inter_method).data("inverters",selects.pro_inverter);
		// create the quick edit form
		var edit = "<td colspan='9'>";
		edit += "<form class='updateproposalform' action='javascript:void(0);'> \
					<h1 class='addform-header'>Quick Edit</h1> \
					<br /> \
					<div class='form-column'> \
						<label id='pro_zones"+data.ID+"'>Choose Project Zones:</label> \
						"+selects.pro_zones+" \
					</div> \
					<div class='clear'></div> \
					<br /> \
					\
					<h1 class='add-proposal-section'>Inverters&nbsp;&nbsp;<a class='adder' title='Add Inverter(s)' href='javascript:void(0);'>+</a></h1> \
					<div> \
						"+inverters_html+" \
					</div> \
					<div class='clear'></div> \
					<br /> \
					\
					<h1 class='add-proposal-section'>Miscellaneous</h1> \
					<div class='form-column'> \
						<label for='pro_conduit_out'>Overground Conduit (ft)</label> \
						<input class='required' type='text' id='pro_conduit_out' value='"+data.pro_conduit_out+"' /> \
						<label for='pro_conduit_in'>Indoor Conduit (ft)</label> \
						<input class='required' type='text' id='pro_conduit_in' value='"+data.pro_conduit_in+"' /> \
						<label for='pro_conduit_under'>Underground Conduit (ft)</label> \
						<input class='required' type='text' id='pro_conduit_under' value='"+data.pro_conduit_under+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='pro_num_trips'># Install Days</label> \
						<input class='required' type='text' id='pro_num_trips' value='"+data.pro_num_trips+"' /> \
						<label for='pro_num_installers'># Installers</label> \
						<input class='required' type='text' id='pro_num_installers' value='"+data.pro_num_installers+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='pro_winter'>Off-season installation?</label> \
						<select class='required' id='pro_winter'> \
							"+pro_winter_selects+" \
						</select> \
						<label for='pro_others_involved'>Other builders involved?</label> \
						<select class='required' id='pro_others_involved'> \
							"+pro_others_involved_selects+" \
						</select> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					\
					<h1 class='add-proposal-section'>Other Costs & Fees</h1> \
					<div class='form-column'> \
						<label for='pro_taxrate'>Sales Tax Rate (%)</label> \
						<input class='required' type='text' id='pro_taxrate' value='"+data.pro_taxrate+"' /> \
						<label for='pro_engin_fee'>Engineering Fee ($)</label> \
						<input class='required' type='text' id='pro_engin_fee' value='"+data.pro_engin_fee+"' /> \
						<label for='pro_permit_fee'>Permit Fee ($)</label> \
						<input class='required' type='text' id='pro_permit_fee' value='"+data.pro_permit_fee+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='pro_inspection'>Des. / Ins. / Comm. Fee ($)</label> \
						<input class='required' type='text' id='pro_inspection' value='"+data.pro_inspection+"' /> \
						<label for='pro_equip_rental'>Equipment Rental Fee ($)</label> \
						<input class='required' type='text' id='pro_equip_rental' value='"+data.pro_equip_rental+"' /> \
						<label for='pro_fluctuation'>Add / Subtract Labor ($)</label> \
						<input class='required' type='text' id='pro_fluctuation' value='"+data.pro_fluctuation+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='pro_misc_materials'>Misc. Materials ($)</label> \
						<input type='text' id='pro_misc_materials' value='"+data.pro_misc_materials+"' /> \
						<label for='pro_misc_materials_up'>Misc. Materials Margin (%)</label> \
						<input type='text' id='pro_misc_materials_up' value='"+data.pro_misc_materials_up+"' /> \
						<label for='pro_misc_materials_desc'>Misc. Materials Description</label> \
						<input type='text' id='pro_misc_materials_desc' value='"+data.pro_misc_materials_desc+"' /> \
					</div> \
					<div class='form-column'> \
						<label for='pro_extra_fee'>Extra Fees ($)</label> \
						<input type='text' id='pro_extra_fee' value='"+data.pro_extra_fee+"' /> \
						<label for='pro_extra_desc'>Extra Fees Description</label> \
						<input type='text' id='pro_extra_desc' value='"+data.pro_extra_desc+"' /> \
					</div> \
					<div class='form-column-right'> \
						<label for='pro_discount'>Discount ($)</label> \
						<input class='required' type='text' id='pro_discount' value='"+data.pro_discount+"' /> \
						<label for='pro_discount_desc'>Discount Description</label> \
						<input type='text' id='pro_discount_desc' value='"+data.pro_discount_desc+"' /> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					\
					<h1 class='add-proposal-section'>Additional Rebates&nbsp;&nbsp;<a class='adder' title='Add Rebate' href='javascript:void(0);'>+</a></h1> \
					<div> \
						"+rebates_html+" \
					</div> \
					<div class='clear'></div> \
					<br /> \
					\
					<h1 class='add-proposal-section'>Options</h1> \
					<div class='form-column'> \
						<input style='display:inline;' type='checkbox' class='no-postify' id='pro_credit"+data.ID+"' value='' "+pro_credit_checked+" /> Include 30% Tax Credit? \
						<br /> \
						<input style='display:inline; margin:5px 0 0;' type='checkbox' class='pro-incentive' id='pro_incentive"+data.ID+"' value='' "+pro_incentive_checked+" /> Include Production Based Incentive?&nbsp;&nbsp; \
						<span style='"+pro_incentive_display+"'> \
							<input style='display:inline; width:30px; text-align:right;' type='text' id='pro_incentive_rate' value='"+data.pro_incentive_rate+"' />&nbsp;&nbsp;<span style='color:#808080;'>$/kWh for</span>&nbsp; \
							<input style='display:inline; width:30px; text-align:right;' type='text' id='pro_incentive_yrs' value='"+data.pro_incentive_yrs+"' />&nbsp;&nbsp;<span style='color:#808080;'>Years</span> \
						</span> \
					</div> \
					<div class='clear'></div> \
					<br /> \
					\
					<h1 class='add-proposal-section'>Cover Letter</h1> \
					<textarea id='pro_cover_letter' style='width:100%; height:200px;'>"+data.pro_cover_letter+"</textarea> \
					<div class='clear'></div> \
					<br /> \
					<input type='submit' title='PreviewQ' value='Preview' /> \
					<input type='submit' title='Update' value='Update' /> \
					<input type='submit' title='CancelQ' value='Cancel' /> \
					<div class='preview-panel'></div> \
				</form>";
		edit += "</td>";
		return edit;
	},
	empty:function() {
		// clear the list
		$(".dashboard-item-content",$(this.el)).html("<p style='padding:10px; color:#808080;'>There are no "+this.s.slug+" in your system at the moment.</p>");
	}
});
/*###########################################################################
################################################################### DOC READY  
###########################################################################*/
$(function() {
	//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– EXTEND UTILS
	// on core classes
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g,""); }
	String.prototype.ltrim = function() { return this.replace(/^\s+/,""); }
	String.prototype.rtrim = function() { return this.replace(/\s+$/,""); }
	if(!Array.prototype.filter) { Array.prototype.filter = function(fun /*, thisp*/) {
	    	var len = this.length >>> 0;
	    	if(typeof fun!="function") throw new TypeError();
	    	var res = [];
	    	var thisp = arguments[1];
	    	for(var i=0;i<len;i++) {
	    		if(i in this) {
	        		var val = this[i]; // in case fun mutates this
					if(fun.call(thisp,val,i,this)) res.push(val);
	    		}
	    	}
	    	return res;
		};  
	}
	// on jquery
	$.extend({
		array_combine:function(keys,values) {
		    var new_array = {}, keycount = keys && keys.length, i = 0;
		    if(typeof keys!=='object' || typeof values!=='object' || typeof keycount!=='number' || typeof values.length!=='number' || !keycount)
				return false;
			if(keycount!=values.length) return false;
		    for(i=0; i<keycount; i++) new_array[keys[i]] = values[i];
		    return new_array;
		},
		set_cookie:function(c_name,value,expiredays) {
			var exdate = new Date();
			exdate.setDate(exdate.getDate()+expiredays);
			document.cookie = c_name+"="+escape(value)+((expiredays==null) ? "" : ";expires="+exdate.toUTCString());
		},
		get_cookie:function(c_name) {
			if(document.cookie.length>0) {
		  		var c_start = document.cookie.indexOf(c_name+"=");
		  		if(c_start!=-1) {
		    		c_start = c_start + c_name.length+1;
		    		c_end = document.cookie.indexOf(";",c_start);
		    		if(c_end==-1) c_end = document.cookie.length;
		    		return unescape(document.cookie.substring(c_start,c_end));
		    	}
		  	} return "";
		},
		addEvent:function(obj_id,type,cb) {
			var obj = document.getElementById(obj_id);
			if(obj.addEventListener) obj.addEventListener(type,cb,true);
			if(obj.attachEvent) obj.attachEvent("on"+type,cb);
		},
		removeEvent:function(obj_id,type,cb) {
			var obj = document.getElementById(obj_id);
			if(obj.detachEvent) obj.detachEvent('on'+type,cb);
			else obj.removeEventListener(type,cb,false);
		},
		addCommas:function(nStr) {
			nStr += '';
			x = nStr.split('.');
			x1 = x[0];
			x2 = x.length>1 ? '.'+x[1] : '';
			var rgx = /(\d+)(\d{3})/;
			while(rgx.test(x1)) x1 = x1.replace(rgx,'$1'+','+'$2');
			return x1+x2;
		},
		tsToDate:function(ts) {
			var regex=/^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
			var parts=ts.replace(regex,"$1 $2 $3 $4 $5 $6").split(' ');
			var d = new Date(parts[0],parts[1]-1,parts[2],parts[3],parts[4],parts[5]);
			// convert utc to local time
			var time = d.getTime();
			var tz = $.getTimeZone();
			var l = new Date(time+(3600000*tz));
			return l.format("shortDate")+" "+l.format("longTime");
		},
		getTimeZone:function() {
			var rightNow = new Date();
			var jan1 = new Date(rightNow.getFullYear(), 0, 1, 0, 0, 0, 0);  // jan 1st
			var june1 = new Date(rightNow.getFullYear(), 6, 1, 0, 0, 0, 0); // june 1st
			var temp = jan1.toGMTString();
			var jan2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
			temp = june1.toGMTString();
			var june2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
			var std_time_offset = (jan1 - jan2) / (1000 * 60 * 60);
			var daylight_time_offset = (june1 - june2) / (1000 * 60 * 60);
			var dst;
			if (std_time_offset==daylight_time_offset) dst = false; // daylight savings time is NOT observed
			else { // positive is southern, negative is northern hemisphere
				var hemisphere = std_time_offset - daylight_time_offset;
				if(hemisphere>=0) std_time_offset = daylight_time_offset;
				dst = true; // daylight savings time is observed
			}
			return dst ? std_time_offset+1 : std_time_offset;
		}
	});
	// on jquery objects
	$.fn.extend({
		refresh:function() {
			// clear fields	
			$("input, textarea",this).each(function(i) { this.value = ""; });
			$("select",this).each(function(i) { this.value = ""; });
		},
		postify:function(exclude) {
			// create post string for name - value pairs
			var valid = true; var returning = "";
			$("input[type!='submit'], select, textarea",this).each(function(i) {
				if(this.className.substring(0,8)=="required" && this.value.trim()=="") { $("label[for='"+this.id+"']").css("color","red"); valid=false; }
				else if(this.id!=exclude
						&& this.type!="radio"
						&& this.className!="choose-zones"
						&& this.className!="file-input"
						&& this.className!="no-postify"
						&& this.className!="pro-incentive") {
							var value = this.value.trim().replace(/&/g,"#amp;");
							returning += this.id+"="+value+"&";
							$("label[for='"+this.id+"']").css("color","#808080");
				} else if(this.type=="radio") {
					if(this.checked) returning += this.name+"="+this.value+"&";
				}
			});
			return (valid) ? returning : "";
		},
		intify:function(e) {
			if (!e) var e = window.event;
			var code = e.keyCode ? e.keyCode : e.which ? e.which : e.charCode;
			var character = String.fromCharCode(code);
			// if they pressed esc... remove focus from field...
			if(code==27) { this.blur(); return false; }
			// ignore if shift is pressed
			if(e.shiftKey==1) return false;
			// ignore if they are press other keys
			// strange because code: 39 is the down key AND ' key... and DEL also equals .
			if(!e.ctrlKey && code!=13 && code!=9 && code!=8 && code!=36 && code!=37 && code!=38 && (code!=39 || (code==39 && character=="'")) && code!=40)
				return (character.match(/[1234567890]/g)) ? true : false;
			else return true;
		},
		validate:function() {
			return Einstein.VALID_EMAIL.test($(this).val());
		}
	});
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– DOC SETUP
	// define console to avoid errors when Firebug isn't available
	if(!window.console) window.console = { log:function(){} };
	// no submit
	$("form[class!='uploadform']").live("submit",function() { return false; });
	//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– INIT OBJECTS
	// create login objects
	var _login_io = new IO();
	var login = new Login("#m_login",_login_io);
	// create super io
	var _offices_io = new IO();
	var _modules_io = new IO();
	var _inverters_io = new IO();
	var _racking_io = new IO();
	var _connects_io = new IO();
	var _inters_io = new IO();
	// create super objects
	var offices = new Offices("#m_offices",_offices_io);
	var modules = new Modules("#m_modules",_modules_io);
	var inverters = new Inverters("#m_inverters",_inverters_io);
	var racking = new Racking("#m_racking",_racking_io);
	var connects = new Connects("#m_connects",_connects_io);
	var inters = new Inters("#m_inters",_inters_io);
	// create office io
	var _settings_io = new IO();
	var _reps_io = new IO();
	// create office objects
	var settings = new Settings("#m_settings",_settings_io);
	var reps = new Reps("#m_reps",_reps_io);
	// create rep io
	var _customers_io = new IO();
	var _jobs_io = new IO();
	// create rep objects
	var customers = new Customers("#m_customers",_customers_io);
	var jobs = new Jobs("#m_jobs",_jobs_io);
	// proposal io
	var _drafts_io = new IO();
	var _submitted_io = new IO();
	var _published_io = new IO();
	var _approved_io = new IO();
	// proposal objects
	var drafts = new Proposals("#m_drafts",_drafts_io,
		{
			title:"Proposal Drafts",
			slug:"drafts",
			holder:".dashboard-main",
			wrapper:"all-drafts",
			order:"ID DESC",
			filter:"pro_submitted='0'!!pro_published='0'!!pro_approved='0'",
			panel:0,
			action:"submit",
			date:{ src:"pro_date", head:"Last Updated" }
		}
	);
	var submitted = new Proposals("#m_submitted",_submitted_io,
		{
			title:"Submitted Proposals",
			slug:"submitted proposals",
			holder:".dashboard-main",
			wrapper:"all-submitted",
			order:"pro_submitted_date DESC",
			filter:"pro_submitted='1'!!pro_published='0'!!pro_approved='0'",
			panel:0,
			action:"publish",
			date:{ src:"pro_submitted_date", head:"Submitted" }
		}
	);
	var published = new Proposals("#m_published",_published_io,
		{
			title:"Published Proposals",
			slug:"published proposals",
			holder:".dashboard-main",
			wrapper:"all-published",
			order:"pro_published_date DESC",
			filter:"pro_submitted='1'!!pro_published='1'!!pro_approved='0'",
			panel:1,
			action:"",
			date:{ src:"pro_published_date", head:"Published" }
		}
	);
	var approved = new Proposals("#m_approved",_approved_io,
		{
			title:"Approved Proposals",
			slug:"approved proposals",
			holder:".dashboard-main",
			wrapper:"all-approved",
			order:"pro_approved_date DESC",
			filter:"pro_submitted='1'!!pro_published='1'!!pro_approved='1'",
			panel:1,
			action:"",
			date:{ src:"pro_approved_date", head:"Approved" }
		}
	);
	// module interactions
	customers.jobs = jobs;
	jobs.customers = customers;
	jobs.drafts = drafts;
	// proposal interactions
	drafts.submitted = submitted;
	submitted.published = published;
	submitted.drafts = drafts;
	published.drafts = drafts;
	approved.drafts = drafts;
	// try to resume login
	login.isSuper = [offices, modules, inverters, racking, connects, inters];
	login.isOffice = [settings, reps];
	login.isAdmin = [customers, jobs, drafts, submitted, published, approved];
	login.isRep = [customers, jobs, drafts, submitted, published, approved];
	login.isSupport = [customers, jobs, drafts, submitted, published, approved];
	login.begin();
});
//####################################################################### END