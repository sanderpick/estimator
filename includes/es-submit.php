<?php
#——————————————————————————————–—————————————————————–––––––––– HOST
$host = $_SERVER["SERVER_NAME"];
preg_match('/\.([a-z,A-Z]{2,6})$/',$host,$tld);
#——————————————————————————————–—————————————————————–––––– SETTINGS
require_once("es-object.class.php");
$E = new Object();
switch($tld[1]) {
	case "ld" : // local
		$E->push("PORTAL_URI","http://lighthousesolar.ld/portal/");
		$E->push("EINSTEIN_URI","http://lighthousesolar.ld/estimator/");
		break;
	default : 
		$E->push("PORTAL_URI","http://mylighthousesolar.com/");
		$E->push("EINSTEIN_URI","http://einstein.cleanenergysolutionsinc.com/");
		break;
}
$E->push("EINSTEIN_SMTP_SERVER","ssl://smtp.gmail.com");
$E->push("EINSTEIN_SMTP_PORT",465);
$E->push("EINSTEIN_SMTP_USER","lhadmin@lighthousesolar.com");
$E->push("EINSTEIN_SMTP_PASS","l1gh7h0u53!");
$E->push("EINSTEIN_SMTP_FROM","lhadmin@lighthousesolar.com");
#——————————————————————————————–—————————————————————–– INIT MANAGER
require_once("es-manager.class.php");
$m = new EstimatorManager();
// ensure universal time
date_default_timezone_set("UTC");
#————————————————————————————————————————————————– EXECUTE & RESPOND
// initialize the response
$r = array();
// execute the actions
if(isset($_POST['es_do']) && function_exists($_POST['es_do'])) $_POST['es_do']();
else $r['error'] = "invalid action";
// encode and send the response
echo json_encode($r);
#—————————————————————————————— user ———————————————––————————————#
// login
function login() {
	global $m,$r;
	session_start();
	if($m->login($_POST['rep_username'],$_POST['rep_password'])) {
		$r['did'] = "login";
		$r['data'] = $m->getRep();
		if($r['data']->rep_officeID==0) $r['data2'] = array("location"=>"National","city"=>"","state"=>"","zip"=>"");
		else if($m->getRow("es_offices",$r['data']->rep_officeID)) {
			$r['data2'] = array("location"=>$m->lastData()->off_city.", ".$m->lastData()->off_state,"city"=>$m->lastData()->off_city,"state"=>$m->lastData()->off_state,"zip"=>$m->lastData()->off_zip);
		} else $r['data2'] = array("location"=>"unknown location","city"=>"","state"=>"","zip"=>"");
		// get all offices for support
		$m->getAll("es_offices","ID,off_city,off_state","ID");
		$r['data3'] = $m->lastData();
	} else $r['did'] = "failed login";
}
// resume
function resume() {
	global $m,$r;
	session_start();
	if(isset($_SESSION['ses_rep']) && isset($_SESSION['ses_id']) && isset($_SESSION['ses_ip']) && isset($_SESSION['ses_time'])) {
		if($m->resume($_SESSION['ses_rep'])) {
			$r['did'] = "resume";
			$r['data'] = $m->getRep();
			if($r['data']->rep_officeID==0) $r['data2'] = array("location"=>"National","city"=>"","state"=>"","zip"=>"");
			else if($m->getRow("es_offices",$r['data']->rep_officeID)) {
				$r['data2'] = array("location"=>$m->lastData()->off_city.", ".$m->lastData()->off_state,"city"=>$m->lastData()->off_city,"state"=>$m->lastData()->off_state,"zip"=>$m->lastData()->off_zip);
			} else $r['data2'] = array("location"=>"unknown location","city"=>"","state"=>"","zip"=>"");
			// get all offices for support
			$m->getAll("es_offices","ID,off_city,off_state","ID");
			$r['data3'] = $m->lastData();
		} else $r['did'] = "cant resume";
	} else $r['did'] = "cant resume";
}
// logout
function logout() {
	global $m,$r;
	session_start();
	if($m->logout()) {
		$r['did'] = "logout";
	} else $r['did'] = "failed logout";
}
#—————————————————————————————— browse ——————————————–––——————————#

// get a single item
function getItem() {
	global $m,$r;
	$table = $_POST['table'];
	if($m->getRow($table,$_POST['id'])) {
		$r['did'] = "got ".$table;
		$r['data'] = $m->lastData();
	} else $r['did'] = "no ".$table;
}

// get an entire table
function browseAll() {
	global $m,$r;
	$table = $_POST['table'];
	$order = $_POST['order'];
	if(isset($_POST['wc'])) {
		$_POST['wc'] = stripslashes($_POST['wc']);
		$wc = str_replace("!!"," AND ",$_POST['wc']);
		$wc = str_replace("::"," OR ",$wc);
	} else $wc = NULL;
	if($m->getAll($table,"*",$order,$wc)) {
		$r['did'] = "found ".$table;
		$r['data'] = $m->lastData();
	} else $r['did'] = "no ".$table;
}

// get an entire table
function browseAllJobs() {
	global $m,$r;
	$table = $_POST['table'];
	$order = $_POST['order'];
	if(isset($_POST['wc'])) {
		$_POST['wc'] = stripslashes($_POST['wc']);
		$wc = str_replace("!!"," AND ",$_POST['wc']);
		$wc = str_replace("::"," OR ",$wc);
	} else $wc = NULL;
	if($m->getAll($table,"*",$order,$wc)) {
		$r['did'] = "found ".$table;
		$r['data'] = $m->lastData();
		foreach($r['data'] as $job) {
			if($m->getRow("es_customers",$job->job_customerID)) {
				$r['data2']['customer'][] = $m->lastData()->cus_name_first." ".$m->lastData()->cus_name_last;
			} else $r['did'] = "no ".$table;
			if($m->getRow("es_reps",$job->job_repID)) {
				$r['data2']['rep'][] = $m->lastData()->rep_name_first." ".$m->lastData()->rep_name_last;
			} else $r['did'] = "no ".$table;
		}
	} else $r['did'] = "no ".$table;
}

// get an entire table
function browseAllZones() {
	global $m,$r;
	$table = $_POST['table'];
	$order = $_POST['order'];
	if(isset($_POST['wc'])) {
		$_POST['wc'] = stripslashes($_POST['wc']);
		$wc = str_replace("!!"," AND ",$_POST['wc']);
		$wc = str_replace("::"," OR ",$wc);
	} else $wc = NULL;
	if($m->getAll($table,"*",$order,$wc)) {
		$r['did'] = "found ".$table;
		$r['data'] = $m->lastData();
		foreach($r['data'] as $zon) {
			if($m->getRow('es_uploads',$zon->zon_layout))
				$zon->zon_layout = $m->lastData()->up_root.$m->lastData()->up_handle."/".$m->lastData()->up_handle;
			// rebate dollars to watts
			$m->getRow('es_modules',$zon->zon_module,"mod_model_num");
			$mod_watts = $m->lastData()->mod_stc;
			$zon->zon_rebate = $zon->zon_rebate / ($zon->zon_num_modules * $mod_watts);
		}
	} else $r['did'] = "no ".$table;
	// get zone menu options
	$menus = explode(",",$_POST['menus']);
	$sources = explode(",",$_POST['sources']);
	$columns = explode(",",$_POST['columns']);
	for($i=0;$i<count($menus);$i++) {
		if($m->getAll($sources[$i],$columns[$i],"ID","active='1'")) {
			$r['data2'][$menus[$i]] = $m->lastData();
		} else $r['did'] = "failed ".$table." options";
	}
}

// get an entire table
function browseAllProposals() {
	global $m,$r;
	$table = $_POST['table'];
	$order = $_POST['order'];
	if(isset($_POST['wc'])) {
		$_POST['wc'] = stripslashes($_POST['wc']);
		$wc = str_replace("!!"," AND ",$_POST['wc']);
		$wc = str_replace("::"," OR ",$wc);
	} else $wc = NULL;
	if($m->getAll($table,"*",$order,$wc)) {
		$r['did'] = "found ".$table;
		$r['data'] = $m->lastData();
		foreach($r['data'] as $pro) {
			$jobID = $pro->pro_jobID;
			if($m->getAll("es_zones","ID,zon_name,zon_size","ID","zon_jobID='$jobID'")) {
				$r['data2']['pro_zones'.$pro->ID] = $m->lastData();
			} else $r['did'] = "failed ".$table." options";
		}
	} else $r['did'] = "no ".$table;
	// get proposal menu options
	$menus = explode(",",$_POST['menus']);
	$sources = explode(",",$_POST['sources']);
	$columns = explode(",",$_POST['columns']);
	for($i=0;$i<count($menus);$i++) {
		if($sources[$i]!="es_zones") {
			if($m->getAll($sources[$i],$columns[$i],"ID","active='1'")) {
				$r['data2'][$menus[$i]] = $m->lastData();
			} else $r['did'] = "failed ".$table." options";
		}
	}
}

#—————————————————————————————— add ——————————————–––—————————————#

// add new item
function addItem() {
	global $m,$r;
	$table = $_POST['table'];
	unset($_POST['es_do'],$_POST['table']);
	if($id=$m->addRow($table,$_POST)) {
		$r['did'] = $table." added";
		$r['data'] = $id;
	} else $r['did'] = "failed ".$table." add";
}

// add new office
function addOffice() {
	global $m,$r;
	$table = $_POST['table'];
	unset($_POST['es_do'],$_POST['table']);
	$off = $_POST;
	$off['off_manager_list'] = strtolower(str_replace(" ","_",$off['off_city'])."_gm@lighthousesolar.com");
	if($id=$m->addRow($table,$off)) {
		// create office admin
		$rep['rep_login'] = strtolower(str_replace(" ","_",$off['off_city']."_".$off['off_state']));
		$salt = substr(md5($rep['rep_login']),0,15);
		$pass = substr(uniqid(md5(rand())),0,8);
		$rep['rep_pass'] = sha1($pass.$salt);
		$rep['rep_name_first'] = $off['off_city'];
		$rep['rep_name_last'] = $off['off_state'];
		$rep['rep_title'] = $off['off_city'].", ".$off['off_state']." Office Administrator";
		$rep['rep_phone'] = $off['off_phone'];
		$rep['rep_email'] = $off['off_manager_list'];
		$rep['rep_registered'] = date('Y-m-d H:i:s');
		$rep['rep_key'] = uniqid(md5(rand()));
		$rep['rep_role'] = 1;
		$rep['rep_officeID'] = $id;
		if($rep_id=$m->addRow("es_reps",$rep)) {
			$r['did'] = $table." added";
			$r['data']['rep_id'] = $rep_id;
			$r['data']['rep_pass'] = $pass;
		}
	} else $r['did'] = "failed ".$table." add";
}

// add new rep
function addRep() {
	global $m,$r;
	$table = $_POST['table'];
	unset($_POST['es_do'],$_POST['table'],$_POST['rep_pass_confirm']);
	$rep = $_POST;
	$rep['rep_registered'] = date('Y-m-d H:i:s');
	$rep['rep_key'] = uniqid(md5(rand()));
	$salt = substr(md5($rep['rep_login']),0,15);
	$rep['rep_pass'] = sha1($rep['rep_pass'].$salt);
	if($id=$m->addRow($table,$rep)) {
		$r['did'] = $table." added";
		$r['data'] = $id;
	} else $r['did'] = "failed ".$table." add";
}

// add new customer
function addCustomer() {
	global $m,$r;
	$table = $_POST['table'];
	unset($_POST['es_do'],$_POST['table']);
	if($id=$m->addRow($table,$_POST)) {
		$r['did'] = $table." added";
		$r['data'] = $id;
		//if(!$m->editCell("es_reps",1,"rep_num_cus",$_POST['cus_repID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
		//if(!$m->editCell("es_offices",1,"off_num_cus",$_POST['cus_officeID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
	} else $r['did'] = "failed ".$table." add";
}

// add new job
function addJob() {
	global $m,$r;
	$table = $_POST['table'];
	unset($_POST['es_do'],$_POST['table']);
	if($id=$m->addRow($table,$_POST)) {
		$r['did'] = $table." added";
		$r['data'] = $id;
		//if(!$m->editCell("es_reps",1,"rep_num_jobs",$_POST['job_repID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
		//if(!$m->editCell("es_customers",1,"cus_num_jobs",$_POST['job_customerID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
		//if(!$m->editCell("es_offices",1,"off_num_jobs",$_POST['job_officeID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
	} else $r['did'] = "failed ".$table." add";
}

// add new prop
function addProposal() {
	global $m,$r;
	$table = $_POST['table'];
	unset($_POST['es_do'],$_POST['table']);
	$pro = $_POST;
	// parse interconnections
	$pro['pro_inter_method'] = "";
	$pro['pro_inverter'] = "";
	foreach($pro as $key=>$val) {
		if(substr($key,0,17)=="pro_inter_method_") {
			$pro['pro_inter_method'] .= $val.",";
			unset($pro[$key]);
		} else if(substr($key,0,13)=="pro_inverter_") {
			if(isset($pro["qnty-".$key])) {
				$group = uniqid("_g_");
				for($k=0;$k<$pro["qnty-".$key];$k++) $pro['pro_inverter'] .= $val.$group.",";
				unset($pro["qnty-".$key]);
			} else $pro['pro_inverter'] .= $val.",";
			unset($pro[$key]);
		}
	}
	// parse rebates
	$pro['pro_rebate_amnt'] = "";
	$pro['pro_rebate_desc'] = "";
	$pro['pro_rebate_type'] = "";
	//@mcn
	$pro['pro_rebate_display_weight'] = "";

	foreach($pro as $key=>$val) {
		if(substr($key,0,16)=="pro_rebate_amnt_") {
			$pro['pro_rebate_amnt'] .= $val.",";
			unset($pro[$key]);
		} else if(substr($key,0,16)=="pro_rebate_desc_") {
			$pro['pro_rebate_desc'] .= $val.",";
			unset($pro[$key]);
		} else if(substr($key,0,16)=="pro_rebate_type_") {
			$pro['pro_rebate_type'] .= $val.",";
			unset($pro[$key]);
		}
		else if(substr($key,0,26)=="pro_rebate_display_weight_") {
			$pro['pro_rebate_display_weight'] .= $val.",";
			unset($pro[$key]);
		}
	}
	// get name
	$m->getRow('es_jobs',$pro['pro_jobID']);
	$pro['pro_name'] = $m->lastData()->job_name;
	// set date
	$pro['pro_date'] = date('Y-m-d H:i:s');
	// make link
	$pro['pro_key'] = uniqid(md5(rand()));
	// add to db
	if($id=$m->addRow($table,$pro)) {
		$r['did'] = $table." added";
		$r['data'] = $id;
		//if(!$m->editCell("es_reps",1,"rep_num_props",$_POST['pro_repID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
		//if(!$m->editCell("es_customers",1,"cus_num_props",$_POST['pro_customerID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
		//if(!$m->editCell("es_jobs",1,"job_num_props",$_POST['pro_jobID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
		//if(!$m->editCell("es_offices",1,"off_num_props",$_POST['pro_officeID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
	} else $r['did'] = "failed ".$table." add";
}

// add new zone
function addZone() {
	global $m,$r;
	$table = $_POST['table'];
	unset($_POST['es_do'],$_POST['table']);
	// rebate to dollars
	$m->getRow('es_modules',$_POST['zon_module'],"mod_model_num");
	$mod_watts = $m->lastData()->mod_stc;
	$_POST['zon_rebate'] = $_POST['zon_rebate'] * $_POST['zon_num_modules'] * $mod_watts;
	// # landscape to %
	$_POST['zon_per_landscape'] = (($_POST['zon_per_landscape'] / $_POST['zon_num_modules'])*100);
	// make the zone
	$zone = makeZone($_POST,$_POST['zon_officeID']);
	// add to db
	if($id=$m->addRow($table,$zone)) {
		$r['did'] = $table." added";
		$r['data'] = $id;
		if(!$m->editCell("es_jobs",1,"job_num_zones",$zone['zon_jobID'],FALSE,TRUE)) $r['did'] = "failed ".$table." add";
		// add zone id to upload
		//if(isset($zone['zon_layout']))
		//if(!$m->editCell("es_uploads",$id,"up_zoneID",$zone['zon_layout']) || !$m->editCell("es_uploads","1","active",$zone['zon_layout'])) $r['did'] = "failed ".$table." add";
	} else $r['did'] = "failed ".$table." add";
}

#—————————————————————————————— delete ——————————————–––——————————#

// delete an item
function deleteItem() {
	global $m,$r;
	$table = $_POST['table'];
	if($m->deleteRow($table,$_POST['id'])) {
		$r['did'] = $table." deleted";
	} else $r['did'] = "failed ".$table." delete";
}

// delete an office
function deleteOffice() {
	global $m,$r;
	$table = $_POST['table'];
	if($m->deleteRow($table,$_POST['id'])) {
		$r['did'] = $table." deleted";
		// delete all dependancies
		if(!$m->deleteAll("es_reps",array('rep_officeID'=>$_POST['id']))
			|| !$m->deleteAll("es_customers",array('cus_officeID'=>$_POST['id']))
			|| !$m->deleteAll("es_jobs",array('job_officeID'=>$_POST['id']))
			|| !$m->deleteAll("es_zones",array('zon_officeID'=>$_POST['id']))
			|| !$m->deleteAll("es_proposals",array('pro_officeID'=>$_POST['id']))
			|| !removeUploads("up_officeID",$_POST['id'])
			//|| !$m->deleteAll("es_uploads",array('up_officeID'=>$_POST['id']))
		) $r['did'] = "failed ".$table." delete";
	} else $r['did'] = "failed ".$table." delete";
}

// delete rep
function deleteRep() {
	global $m,$r;
	$table = $_POST['table'];
	if($m->deleteRow($table,$_POST['id'])) {
		$r['did'] = $table." deleted";
		//if(!$m->editCell("es_offices",-1,"off_num_reps",$_POST['rep_officeID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		// delete all dependancies
		if(!$m->deleteAll("es_customers",array('cus_repID'=>$_POST['id']))
			|| !$m->deleteAll("es_jobs",array('job_repID'=>$_POST['id']))
			|| !$m->deleteAll("es_zones",array('zon_repID'=>$_POST['id']))
			|| !$m->deleteAll("es_proposals",array('pro_repID'=>$_POST['id']))
			|| !removeUploads("up_repID",$_POST['id'])
			//|| !$m->deleteAll("es_uploads",array('up_repID'=>$_POST['id']))
		) $r['did'] = "failed ".$table." delete";
	} else $r['did'] = "failed ".$table." delete";
}

// delete job
function deleteCustomer() {
	global $m,$r;
	$table = $_POST['table'];
	if($m->deleteRow($table,$_POST['id'])) {
		$r['did'] = $table." deleted";
		//if(!$m->editCell("es_reps",-1,"rep_num_cus",$_POST['cus_repID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		//if(!$m->editCell("es_offices",-1,"off_num_cus",$_POST['cus_officeID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		// delete all dependancies
		if(!$m->deleteAll("es_jobs",array('job_customerID'=>$_POST['id']))
			|| !$m->deleteAll("es_zones",array('zon_customerID'=>$_POST['id']))
			|| !$m->deleteAll("es_proposals",array('pro_customerID'=>$_POST['id']))
			|| !removeUploads("up_customerID",$_POST['id'])
			//|| !$m->deleteAll("es_uploads",array('up_customerID'=>$_POST['id']))
		) $r['did'] = "failed ".$table." delete";
	} else $r['did'] = "failed ".$table." delete";
}

// delete job
function deleteJob() {
	global $m,$r;
	$table = $_POST['table'];
	if($m->deleteRow($table,$_POST['id'])) {
		$r['did'] = $table." deleted";
		//if(!$m->editCell("es_reps",-1,"rep_num_jobs",$_POST['job_repID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		//if(!$m->editCell("es_customers",-1,"cus_num_jobs",$_POST['job_customerID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		//if(!$m->editCell("es_offices",-1,"off_num_jobs",$_POST['job_officeID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		// delete all dependancies
		if(!$m->deleteAll("es_zones",array('zon_jobID'=>$_POST['id']))
			|| !$m->deleteAll("es_proposals",array('pro_jobID'=>$_POST['id']))
			|| !removeUploads("up_jobID",$_POST['id'])
			//|| !$m->deleteAll("es_uploads",array('up_jobID'=>$_POST['id']))
		) $r['did'] = "failed ".$table." delete";
	} else $r['did'] = "failed ".$table." delete";
}

// delete zone 
function deleteZone() {
	global $m,$r;
	$table = $_POST['table'];
	if($m->deleteRow($table,$_POST['id'])) {
		$r['did'] = $table." deleted";
		if(!$m->editCell("es_jobs",-1,"job_num_zones",$_POST['zon_jobID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		// delete all dependancies
		if(!removeUploads("up_zoneID",$_POST['id']) 
			//|| !$m->deleteAll("es_uploads",array('up_zoneID'=>$_POST['id']))
		) $r['did'] = "failed ".$table." delete";
	} else $r['did'] = "failed ".$table." delete";
}

// delete layout
function deleteLayout() {
	global $m,$r;
	$table = $_POST['table'];
	if($m->getRow("es_zones",$_POST['id'])) {
		$m->editCell("es_uploads","0","active",$m->lastData()->zon_layout);
		$m->editCell("es_zones","0","zon_layout",$_POST['id']);
		$r['did'] = "layout deleted";
	} else $r['did'] = "failed layout delete";
}

// delete proposal
function deleteProposal() {
	global $m,$r;
	$table = $_POST['table'];
	if($m->deleteRow($table,$_POST['id'])) {
		$r['did'] = $table." deleted";
		//if(!$m->editCell("es_reps",-1,"rep_num_props",$_POST['pro_repID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		//if(!$m->editCell("es_customers",-1,"cus_num_props",$_POST['pro_customerID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		//if(!$m->editCell("es_jobs",-1,"job_num_props",$_POST['pro_jobID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		//if(!$m->editCell("es_offices",-1,"off_num_props",$_POST['pro_officeID'],FALSE,TRUE)) $r['did'] = "failed ".$table." delete";
		// delete all dependancies -- none
	} else $r['did'] = "failed ".$table." delete";
}

// delete an upload (set to inactive for next clean cron clean-up)
function removeUploads($col,$id) {
	global $m;
	//if($m->getAll("es_uploads","up_root,up_handle","ID","$col='$id'"))
	//	foreach($m->lastData() as $up) destroy("../".$up->up_root.$up->up_handle);
	if($m->getAll("es_uploads","ID","ID","$col='$id'"))
		foreach($m->lastData() as $up) $m->editCell("es_uploads","0","active",$up->ID);
	return true;
}

#—————————————————————————————— update ——————————————–––———————————#

// update a single cell
function updateCells() {
	global $m,$r;
	$table = $_POST['table'];
	$row = $_POST['row'];
	unset($_POST['es_do'],$_POST['table'],$_POST['row']);
	foreach($_POST as $column=>$value) {
		if($m->editCell($table,$value,$column,$row)) {
			$r['did'] = $table." updated";
			$r['data'][$column] = $value;
		} else $r['did'] = "failed ".$table." update";
	}
}

// update item - customer
function updateItem() {
	global $m,$r;
	$table = $_POST['table'];
	$id = $_POST['id'];
	unset($_POST['es_do'],$_POST['table'],$_POST['id']);
	if($m->updateRow($table,$id,$_POST)) {
		if($m->getRow($table,$id)) {
			$r['did'] = $table." updated";
			$r['data'] = $m->lastData();
		} else $r['did'] = "failed ".$table." update";
	} else $r['did'] = "failed ".$table." update";
}

// update rep
function updateRep() {
	global $m,$r;
	$table = $_POST['table'];
	$id = $_POST['id'];
	unset($_POST['es_do'],$_POST['table'],$_POST['id']);
	$rep = $_POST;
	if(isset($rep['rep_pass'])) {
		$salt = substr(md5($rep['rep_login']),0,15);
		$rep['rep_pass'] = sha1($rep['rep_pass'].$salt);
	}
	if($m->updateRow($table,$id,$rep)) {
		if($m->getRow($table,$id)) {
			$r['did'] = $table." updated";
			$r['data'] = $m->lastData();
		} else $r['did'] = "failed ".$table." update";
	} else $r['did'] = "failed ".$table." update";
}

// update job
function updateJob() {
	global $m,$r;
	$table = $_POST['table'];
	$id = $_POST['id'];
	unset($_POST['es_do'],$_POST['table'],$_POST['id']);
	if($m->updateRow($table,$id,$_POST)) {
		if($m->getRow($table,$id)) {
			$r['did'] = $table." updated";
			$r['data'] = $m->lastData();
			if($m->getRow("es_customers",$r['data']->job_customerID)) {
				$r['data2']['customer'] = $m->lastData()->cus_name_first." ".$m->lastData()->cus_name_last;
			} else $r['did'] = "failed ".$table." update";
			if($m->getRow("es_reps",$r['data']->job_repID)) {
				$r['data2']['rep'] = $m->lastData()->rep_name_first." ".$m->lastData()->rep_name_last;
			} else $r['did'] = "failed ".$table." update";
		} else $r['did'] = "failed ".$table." update";
	} else $r['did'] = "failed ".$table." update";
}

// update a zone
function updateZone() {
	global $m,$r;
	$table = $_POST['table'];
	$id = $_POST['id'];
	$menus = explode(",",$_POST['menus']);
	$sources = explode(",",$_POST['sources']);
	$columns = explode(",",$_POST['columns']);
	unset($_POST['es_do'],$_POST['table'],$_POST['id'],$_POST['menus'],$_POST['sources'],$_POST['columns']);
	// get the old zone
	$m->getRow($table,$id);
	$old_zone = $m->lastData();
	//$old_upload = $m->lastData()->zon_layout;
	// check to see if upload is different
	//if(isset($_POST['zon_layout'])) {
	//	removeUploads("ID",$old_upload);
	//	$m->deleteRow("es_uploads",$old_upload);
	//}
	// rebate to dollars
	$m->getRow('es_modules',$_POST['zon_module'],"mod_model_num");
	$mod_watts = $m->lastData()->mod_stc;
	$_POST['zon_rebate'] = $_POST['zon_rebate'] * $_POST['zon_num_modules'] * $mod_watts;
	// # landscape to %
	$_POST['zon_per_landscape'] = (($_POST['zon_per_landscape'] / $_POST['zon_num_modules'])*100);
	// make the zone
	$zone = makeZone($_POST,$old_zone->zon_officeID);
	// update db
	if($m->updateRow($table,$id,$zone)) {
		if($m->getRow($table,$id)) {
			$r['did'] = $table." updated";
			$r['data'] = $m->lastData();
			if($m->getRow('es_uploads',$r['data']->zon_layout))
				$r['data']->zon_layout = $m->lastData()->up_root.$m->lastData()->up_handle."/".$m->lastData()->up_handle;
			// rebate dollars to watts
			$m->getRow('es_modules',$r['data']->zon_module,"mod_model_num");
			$mod_watts = $m->lastData()->mod_stc;
			$r['data']->zon_rebate = $r['data']->zon_rebate / ($r['data']->zon_num_modules * $mod_watts);
		} else $r['did'] = "failed ".$table." update";
		// add zone id to upload
		//if(isset($zone['zon_layout']))
			//if(!$m->editCell("es_uploads",$id,"up_zoneID",$zone['zon_layout']) || !$m->editCell("es_uploads","1","active",$zone['zon_layout'])) $r['did'] = "failed ".$table." update";
	} else $r['did'] = "failed ".$table." update";
	// get zone menu options
	for($i=0;$i<count($menus);$i++) {
		if($m->getAll($sources[$i],$columns[$i],"ID","active='1'")) {
			$r['data2'][$menus[$i]] = $m->lastData();
		} else $r['did'] = "failed ".$table." options";
	}
}

// update a proposal
function updateProposal() {
	global $m,$r;
	$table = $_POST['table'];
	$id = $_POST['id'];
	$menus = explode(",",$_POST['menus']);
	$sources = explode(",",$_POST['sources']);
	$columns = explode(",",$_POST['columns']);
	unset($_POST['es_do'],$_POST['table'],$_POST['id'],$_POST['menus'],$_POST['sources'],$_POST['columns']);
	$pro = $_POST;
	// parse interconnections
	$pro['pro_inter_method'] = "";
	$pro['pro_inverter'] = "";
	foreach($pro as $key=>$val) {
		if(substr($key,0,17)=="pro_inter_method_") {
			$pro['pro_inter_method'] .= $val.",";
			unset($pro[$key]);
		} else if(substr($key,0,13)=="pro_inverter_") {
			if(isset($pro["qnty-".$key])) {
				$group = uniqid("_g_");
				for($k=0;$k<$pro["qnty-".$key];$k++) $pro['pro_inverter'] .= $val.$group.",";
				unset($pro["qnty-".$key]);
			} else $pro['pro_inverter'] .= $val.",";
			unset($pro[$key]);
		}
	}
	// parse rebates
	$pro['pro_rebate_amnt'] = "";
	$pro['pro_rebate_desc'] = "";
	$pro['pro_rebate_type'] = "";

	//@mcn
	$pro['pro_rebate_display_weight'] = "";

	foreach($pro as $key=>$val) {
		if(substr($key,0,16)=="pro_rebate_amnt_") {
			$pro['pro_rebate_amnt'] .= $val.",";
			unset($pro[$key]);
		} else if(substr($key,0,16)=="pro_rebate_desc_") {
			$pro['pro_rebate_desc'] .= $val.",";
			unset($pro[$key]);
		} else if(substr($key,0,16)=="pro_rebate_type_") {
			$pro['pro_rebate_type'] .= $val.",";
			unset($pro[$key]);
		}
		//@mcn
		else if(substr($key,0,26)=="pro_rebate_display_weight_") {
			$pro['pro_rebate_display_weight'] .= $val.",";
			unset($pro[$key]);
		}
	}
	// update date
	$pro['pro_date'] = date('Y-m-d H:i:s');
	// update db
	if($m->updateRow($table,$id,$pro)) {
		if($m->getRow($table,$id)) {
			$r['did'] = $table." updated";
			$r['data'] = $m->lastData();
		} else $r['did'] = "failed ".$table." update";
	} else $r['did'] = "failed ".$table." update";
	// get proposal menu options
	for($i=0;$i<count($menus);$i++) {
		if($sources[$i]=="es_zones") {
			$jobID = $r['data']->pro_jobID;
			if($m->getAll($sources[$i],"ID,zon_name,zon_size","ID","zon_jobID='$jobID'")) {
				$r['data2']['pro_zones'.$r['data']->ID] = $m->lastData();
			}
		} else if($m->getAll($sources[$i],$columns[$i],"ID","active='1'")) {
			$r['data2'][$menus[$i]] = $m->lastData();
		} else $r['did'] = "failed ".$table." options";
	}
}

// refresh job
function refreshJob() {
	global $m,$r;
	$table = $_POST['table'];
	$id = $_POST['id'];
	unset($_POST['es_do'],$_POST['table'],$_POST['id']);
	if($m->getRow($table,$id)) {
		$r['did'] = $table." updated";
		$r['data'] = $m->lastData();
		if($m->getRow("es_customers",$r['data']->job_customerID)) {
			$r['data2']['customer'] = $m->lastData()->cus_name_first." ".$m->lastData()->cus_name_last;
		} else $r['did'] = "failed ".$table." update";
		if($m->getRow("es_reps",$r['data']->job_repID)) {
			$r['data2']['rep'] = $m->lastData()->rep_name_first." ".$m->lastData()->rep_name_last;
		} else $r['did'] = "failed ".$table." update";
	} else $r['did'] = "failed ".$table." update";
}

// clone proposal
function cloneProposal() {
	global $m,$r;
	$table = $_POST['table'];
	$tid = $_POST['id'];
	$menus = explode(",",$_POST['menus']);
	$sources = explode(",",$_POST['sources']);
	$columns = explode(",",$_POST['columns']);
	// get target pro
	$m->getRow($table,$tid);
	$clone = array();
	foreach($m->lastData() as $k=>$v) if($k!="ID") $clone[$k] = $v;
	// set date
	$clone['pro_date'] = date('Y-m-d H:i:s');
	// reset submitted, published, and approved
	$clone['pro_submitted'] = 0;
	$clone['pro_published'] = 0;
	$clone['pro_approved'] = 0;
	unset($clone['pro_submitted_date'],$clone['pro_published_date'],$clone['pro_approved_date']);
	// make link
	$clone['pro_key'] = uniqid(md5(rand()));
	// add to db
	if($id=$m->addRow($table,$clone)) {
		$r['did'] = $table." cloned";
		$m->getRow($table,$id);
		$r['data'] = $m->lastData();
		//if(!$m->editCell("es_reps",1,"rep_num_props",$clone['pro_repID'],FALSE,TRUE)) $r['did'] = "failed ".$table." clone";
		//if(!$m->editCell("es_customers",1,"cus_num_props",$clone['pro_customerID'],FALSE,TRUE)) $r['did'] = "failed ".$table." clone";
		//if(!$m->editCell("es_jobs",1,"job_num_props",$clone['pro_jobID'],FALSE,TRUE)) $r['did'] = "failed ".$table." clone";
		//if(!$m->editCell("es_offices",1,"off_num_props",$clone['pro_officeID'],FALSE,TRUE)) $r['did'] = "failed ".$table." clone";
	} else $r['did'] = "failed ".$table." clone";
	// get proposal menu options
	for($i=0;$i<count($menus);$i++) {
		if($sources[$i]=="es_zones") {
			$jobID = $r['data']->pro_jobID;
			if($m->getAll($sources[$i],"ID,zon_name,zon_size","ID","zon_jobID='$jobID'")) {
				$r['data2']['pro_zones'.$r['data']->ID] = $m->lastData();
			}
		} else if($m->getAll($sources[$i],$columns[$i],"ID","active='1'")) {
			$r['data2'][$menus[$i]] = $m->lastData();
		} else $r['did'] = "failed ".$table." options";
	}
}

// submit proposal
function submitProposal() {
	global $m,$r;
	$table = $_POST['table'];
	$id = $_POST['id'];
	$pub_date = date('Y-m-d H:i:s');
	unset($_POST['es_do'],$_POST['table'],$_POST['id']);
	// get info
	$m->getRow("es_proposals",$id);
	$pro = $m->lastData();
	$m->getRow("es_jobs",$pro->pro_jobID);
	$job = $m->lastData();
	// validate email address for job associated with proposal
	if(validateEmail($job->job_email)) {
		// set submitted value
		if($m->editCell($table,1,"pro_submitted",$id) && $m->editCell($table,$pub_date,"pro_submitted_date",$id)) {
			// get updated proposal
			$m->getRow("es_proposals",$id);
			$pro = $m->lastData();
			$r['did'] = $table." submitted";
			$r['data'] = $pro;
			// get zones
			$jobID = $pro->pro_jobID;
			if($m->getAll("es_zones","ID,zon_name,zon_size","ID","zon_jobID='$jobID'")) {
				$r['data2']['pro_zones'.$pro->ID] = $m->lastData();
			} else $r['did'] = "failed ".$table." options";
			// get proposal menu options
			$menus = explode(",",$_POST['menus']);
			$sources = explode(",",$_POST['sources']);
			$columns = explode(",",$_POST['columns']);
			for($i=0;$i<count($menus);$i++) {
				if($sources[$i]!="es_zones") {
					if($m->getAll($sources[$i],$columns[$i],"ID","active='1'")) {
						$r['data2'][$menus[$i]] = $m->lastData();
					} else $r['did'] = "failed ".$table." options";
				}
			}
		} else $r['did'] = "failed ".$table." submit";
	} else {	
		$r['did'] = "invalid email";
		$r['data']['job'] = $job->job_name;
		$r['data']['pro'] = $pro->ID;
		$r['data']['action'] = "Submitting";
	}
}

// publish proposal
function publishProposal() {
	global $m,$r;
	$table = $_POST['table'];
	$id = $_POST['id'];
	$del_date = date('Y-m-d H:i:s');
	unset($_POST['es_do'],$_POST['table'],$_POST['id']);
	// get info
	$m->getRow("es_proposals",$id);
	$pro = $m->lastData();
	$m->getRow("es_jobs",$pro->pro_jobID);
	$job = $m->lastData();
	// validate email address for job associated with proposal
	if(validateEmail($job->job_email)) {
		// set published value
		if($m->editCell($table,1,"pro_published",$id) && $m->editCell($table,$del_date,"pro_published_date",$id)) {
			// get updated proposal
			$m->getRow("es_proposals",$id);
			$pro = $m->lastData();
			$r['did'] = $table." published";
			$r['data'] = $pro;
		} else $r['did'] = "failed ".$table." publish";
	} else {	
		$r['did'] = "invalid email";
		$r['data']['job'] = $job->job_name;
		$r['data']['pro'] = $pro->ID;
		$r['data']['action'] = "Publishing";
	}
}

// approve proposal
function approveProposal() {
	global $m,$r;
	$pro_key = $_POST['pro_key'];
	$app_date = date('Y-m-d H:i:s');
	// get id
	$m->getRow("es_proposals",$pro_key,"pro_key");
	$pro = $m->lastData();
	$id = $pro->ID;
	// set approved value
	if($m->editCell("es_proposals",1,"pro_approved",$id) && $m->editCell("es_proposals",$app_date,"pro_approved_date",$id)) $r['did'] = 1;
	else $r['did'] = 0;
}

#—————————————————————————————— search ——————————————–––——————————————#

// search - customers
function search() {
	global $m,$r;
	$table = $_POST['table'];
	$fulltext = $_POST['fulltext'];
	$phrase = $_POST['phrase'];
	if(isset($_POST['wc'])) {
		$_POST['wc'] = stripslashes($_POST['wc']);
		$wc = str_replace("!!"," AND ",$_POST['wc']);
		$wc = str_replace("::"," OR ",$wc);
	} else $wc = NULL;
	if($m->search($table,$fulltext,"*",$phrase,$wc)) {
		$r['did'] = "found ".$table;
		$r['data'] = $m->lastData();
	} else {
		$r['did'] = "empty ".$table;
		$r['data'] = array("phrase"=>$phrase);
	}
}

// search - jobs
function searchJobs() {
	global $m,$r;
	$table = $_POST['table'];
	$fulltext = $_POST['fulltext'];
	$phrase = $_POST['phrase'];
	if(isset($_POST['wc'])) {
		$_POST['wc'] = stripslashes($_POST['wc']);
		$wc = str_replace("!!"," AND ",$_POST['wc']);
		$wc = str_replace("::"," OR ",$wc);
	} else $wc = NULL;
	if($m->search($table,$fulltext,"*",$phrase,$wc)) {
		$r['did'] = "found ".$table;
		$r['data'] = $m->lastData();
		foreach($r['data'] as $job) {
			if($m->getRow("es_customers",$job->job_customerID)) {
				$r['data2']['customer'][] = $m->lastData()->cus_name_first." ".$m->lastData()->cus_name_last;
			} else $r['did'] = "empty ".$table;
			if($m->getRow("es_reps",$job->job_repID)) {
				$r['data2']['rep'][] = $m->lastData()->rep_name_first." ".$m->lastData()->rep_name_last;
			} else $r['did'] = "empty ".$table;
		}
	} else {
		$r['did'] = "empty ".$table;
		$r['data'] = array("phrase"=>$phrase);
	}
}

#—————————————————————————————— misc ——————————————–––————————––——————#

// get item dependancies 
function getDependents() {
	global $m,$r;
	$caller = $_POST['caller'];
	$id = $_POST['id'];
	$tables = explode(",",$_POST['tables']);
	$columns = explode(",",$_POST['columns']);
	$combos = array_combine($tables,$columns);
	foreach($combos as $table=>$column) {
		if($m->getAll($table,"ID","ID","$column='$id'")) {
			$r['data'][$table] = $m->lastData();
		} else $r['data'][$table] = array();
	}	
	$r['did'] = "found ".$caller." dependents";
}

// get item dependancies 
function getProZones() {
	global $m,$r;
	$caller = $_POST['caller'];
	$id = $_POST['id'];
	$r['data']['es_proposals'] = array();
	if($m->getAll("es_proposals","ID,pro_zones","ID")) {
		foreach($m->lastData() as $pro) {
			$zoneIDs = explode(",",substr($pro->pro_zones,0,-1));
			$matchID = "";
			foreach($zoneIDs as $zoneID) {
				if($zoneID==$id) $matchID = $pro->ID;
			}
			if($matchID!="") $r['data']['es_proposals'][] = array('ID'=>$matchID);
		}
	}
	$r['did'] = "found ".$caller." dependents";
}

// get menu options
function getOptions() {
	global $m,$r;
	$table = $_POST['table'];
	$menus = explode(",",$_POST['menus']);
	$sources = explode(",",$_POST['sources']);
	$columns = explode(",",$_POST['columns']);
	for($i=0;$i<count($menus);$i++) {
		if($sources[$i]=="es_zones") {
			$jobID = $_POST['jobID'];
			if($m->getAll($sources[$i],"ID,zon_name,zon_size","ID","zon_jobID='$jobID'")) {
				$r['did'] = "got ".$table." options";
				$r['data']['pro_zones'] = $m->lastData();
			}
		} else if($m->getAll($sources[$i],$columns[$i],"ID","active='1'")) {
			$r['did'] = "got ".$table." options";
			$r['data'][$menus[$i]] = $m->lastData();
		} else $r['did'] = "failed ".$table." options";
	}
	// for cover letter
	if(isset($_POST['offID'])) {
		$offID = $_POST['offID'];
		if($m->getRow("es_offices",$offID)) {
			$r['did'] = "got ".$table." options";
			$r['data']['pro_cover_letter'] = $m->lastData()->off_cover_letter;
		}
	}
}

// make a zone
function makeZone($zone,$officeID) {
	global $m;
	// get office variables
	$m->getRow('es_offices',$officeID);
	$labor_unit_cost = $m->lastData()->off_labor_cost;
	$labor_unit_price = $m->lastData()->off_labor_price;
	$off_inventory_up = $m->lastData()->off_inventory_up;
	$pvwatts_data = $zone['zon_pvwatts']!="" ? explode(":",$zone['zon_pvwatts']) : explode(":",$m->lastData()->off_pvwatts);
	// determine mode from array type
	switch($zone['zon_type']) {
		case "Fixed Tilt" :
			$pvwatts_mode = "0";
			break;
		case "1-Axis Tracking" :
			$pvwatts_mode = "1";
			break;
		case "2-Axis Tracking" :
			$pvwatts_mode = "2";
			break;
		default :
			$pvwatts_mode = "0";
			break;
	}
	// get module variables
	$m->getRow('es_modules',$zone['zon_module'],"mod_model_num");
	$module_width = $m->lastData()->mod_width;
	$module_length = $m->lastData()->mod_length;
	$module_stc = $m->lastData()->mod_stc;
	$module_ptc = $m->lastData()->mod_ptc;
	$module_labor_hrs = $m->lastData()->mod_labor;
	$module_unit_cost = $m->lastData()->mod_cost;
	$module_unit_price = $m->lastData()->mod_price;
	$module_rating = $m->lastData()->mod_stc;
	$pvwatts_dcrate = $module_rating*$zone['zon_num_modules']/1000;
	// get the tilt
	if($zone['zon_tilt']!="custom") {
		if(preg_match('|\({1}(.*?)\){1}|',$zone['zon_tilt'], $tm)) $zone_tilt = $tm[1];
	} else $zone_tilt = $zone['zon_custom_tilt'];
	// get the pitch
	if($zone['zon_pitch']!="custom") {
		if(preg_match('|\({1}(.*?)\){1}|',$zone['zon_pitch'], $pm)) $zone_pitch = $pm[1];
		$m->getRow('es_angles',$zone['zon_pitch'],"ang_value");
		$pitch_labor_hrs = $m->lastData()->ang_labor;
	} else {
		$zone_pitch = $zone['zon_custom_pitch'];
		if($zone_pitch>45.01) $pitch_labor_hrs = 1.5;
		else if($zone_pitch>30.63) $pitch_labor_hrs = 1;
		else if($zone_pitch>18.44) $pitch_labor_hrs = 0.5;
		else $pitch_labor_hrs = 0;
	}
	// call pvwatts
	$nrel = "http://rredc.nrel.gov/solar/calculators/PVWATTS/version1/US/code/pvwattsv1.cgi?city=".$pvwatts_data[0]."&state=".$pvwatts_data[1]."&wban=".$pvwatts_data[2]."&dcrate=".$pvwatts_dcrate."&derate=".$zone['zon_derate']."&mode=".$pvwatts_mode."&tilt=".$zone_tilt."&sazm=".$zone['zon_azimuth']."&cost=".$zone['zon_erate'];
	// start curl
	$ch = curl_init();
	curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt ($ch, CURLOPT_URL, $nrel);
	curl_setopt ($ch, CURLOPT_TIMEOUT, 60);
	$curl_out = curl_exec($ch);
	curl_close($ch);
	// match the data
	preg_match_all('|<font[^>]*>(.*?)</font>|im', $curl_out, $pvm);
	// parse results
	$in = FALSE; $c = 0; $pvt = array();
	foreach($pvm[1] as $match) {
		// purge whitespace
		$match = preg_replace('|&#160|', '', preg_replace('|\s|', '', $match));
		// collect the table elements
		if($c<52 && $in) {
		 	array_push($pvt,$match);
			$c++;
		}
		// get in the table
		if($match=="($)") $in = TRUE;
	}
	// create strings to store the data by month
	$zone['zon_pvwatts_m1'] = $pvt[1].",".$pvt[2].",".$pvt[3];
	$zone['zon_pvwatts_m2'] = $pvt[5].",".$pvt[6].",".$pvt[7];
	$zone['zon_pvwatts_m3'] = $pvt[9].",".$pvt[10].",".$pvt[11];
	$zone['zon_pvwatts_m4'] = $pvt[13].",".$pvt[14].",".$pvt[15];
	$zone['zon_pvwatts_m5'] = $pvt[17].",".$pvt[18].",".$pvt[19];
	$zone['zon_pvwatts_m6'] = $pvt[21].",".$pvt[22].",".$pvt[23];
	$zone['zon_pvwatts_m7'] = $pvt[25].",".$pvt[26].",".$pvt[27];
	$zone['zon_pvwatts_m8'] = $pvt[29].",".$pvt[30].",".$pvt[31];
	$zone['zon_pvwatts_m9'] = $pvt[33].",".$pvt[34].",".$pvt[35];
	$zone['zon_pvwatts_m10'] = $pvt[37].",".$pvt[38].",".$pvt[39];
	$zone['zon_pvwatts_m11'] = $pvt[41].",".$pvt[42].",".$pvt[43];
	$zone['zon_pvwatts_m12'] = $pvt[45].",".$pvt[46].",".$pvt[47];
	$zone['zon_pvwatts_mt'] = $pvt[49].",".$pvt[50].",".$pvt[51];
	$radiation_total = $pvt[49];
	$energy_total = $pvt[50];
	$value_total = $pvt[51];
	// get racking variables
	$m->getRow('es_racking',$zone['zon_racking'],"rac_model_num");
	$racking_cost_ft = $m->lastData()->rac_cost;
	$racking_price_ft = $m->lastData()->rac_price;
	$m->getRow('es_mounting_methods',$zone['zon_mounting_method'],"met_value");
	$racking_method_cost_x = $m->lastData()->met_cost;
	$racking_method_price_x = $m->lastData()->met_price;
	$racking_method_labor_hrs = $m->lastData()->met_labor;
	$m->getRow('es_mounting_mediums',$zone['zon_mounting_medium'],"med_value");
	$racking_medium_labor_hrs = $m->lastData()->med_labor;
	// calc module costs
	$module_cost = $module_unit_cost*$zone['zon_num_modules'] + $module_unit_cost*$zone['zon_num_modules']*$off_inventory_up*0.01;
	$module_price = $module_unit_price*$zone['zon_num_modules'] + $module_unit_price*$zone['zon_num_modules']*$off_inventory_up*0.01;
	// calc racking costs
	$racking_unit_length = 2*(((1-($zone['zon_per_landscape']/100))*$module_width)+(($zone['zon_per_landscape']/100)*$module_length))/12;
	$racking_length = $racking_unit_length*$zone['zon_num_modules'];
	$racking_cost = $racking_length*$racking_cost_ft + $racking_length*$racking_cost_ft*$off_inventory_up*0.01;
	$racking_price = $racking_length*$racking_price_ft + $racking_length*$racking_price_ft*$off_inventory_up*0.01;
	// calc connection costs
	$num_connections = $racking_length/$zone['zon_support_dist'];
	//$racking_method_labor_hrs = $racking_method_labor_hrs*$num_connections*0.005;
	$connection_cost = $num_connections*$racking_method_cost_x + $num_connections*$racking_method_cost_x*$off_inventory_up*0.01;
	$connection_price = $num_connections*$racking_method_price_x + $num_connections*$racking_method_price_x*$off_inventory_up*0.01;
	// labor costs
	$per_landscape_labor_hrs = $zone['zon_per_landscape']*0.005;
	$num_cont_arrays_labor_hrs = ($zone['zon_num_cont_arrays']>8) ? 1 : ($zone['zon_num_cont_arrays']*0.125)-0.125;
	$labor_unit_hrs = $module_labor_hrs + $racking_method_labor_hrs + $racking_medium_labor_hrs + $pitch_labor_hrs + $per_landscape_labor_hrs + $num_cont_arrays_labor_hrs;
	$labor_hrs = $labor_unit_hrs*$zone['zon_num_modules'];
	$labor_cost = $labor_unit_hrs*$labor_unit_cost*$zone['zon_num_modules'];
	$labor_price = $labor_unit_hrs*$labor_unit_price*$zone['zon_num_modules'];
	// add figures to zone
	$zone['zon_racking_length'] = $racking_length;
	$zone['zon_size'] = $pvwatts_dcrate;
	$zone['zon_production'] = $energy_total;
	$zone['zon_install_labor_hrs'] = $labor_hrs;
	$zone['zon_install_labor_cost'] = $labor_cost;
	$zone['zon_install_labor_price'] = $labor_price;
	$zone['zon_module_cost'] = $module_cost;
	$zone['zon_module_price'] = $module_price;
	$zone['zon_racking_cost'] = $racking_cost;
	$zone['zon_racking_price'] = $racking_price;
	$zone['zon_connection_cost'] = $connection_cost;
	$zone['zon_connection_price'] = $connection_price;
	// done
	return $zone;
}

// gives a glimpse of what the proposal will look like
function peakProposal() {
	global $m,$r;
	unset($_POST['es_do']);
	$pro = $_POST;
	// parse interconnections
	$pro['pro_inter_method'] = "";
	$pro['pro_inverter'] = "";
	foreach($pro as $key=>$val) {
		if(substr($key,0,17)=="pro_inter_method_") {
			$pro['pro_inter_method'] .= $val.",";
			unset($pro[$key]);
		} else if(substr($key,0,13)=="pro_inverter_") {
			if(isset($pro["qnty-".$key])) {
				$group = uniqid("_g_");
				for($k=0;$k<$pro["qnty-".$key];$k++) $pro['pro_inverter'] .= $val.$group.",";
				unset($pro["qnty-".$key]);
			} else $pro['pro_inverter'] .= $val.",";
			unset($pro[$key]);
		}
	}
	// parse rebates
	$pro['pro_rebate_amnt'] = "";
	$pro['pro_rebate_desc'] = "";
	$pro['pro_rebate_type'] = "";
	//@mcn
	$pro['pro_rebate_display_weight'] = "";

	foreach($pro as $key=>$val) {
		if(substr($key,0,16)=="pro_rebate_amnt_") {
			$pro['pro_rebate_amnt'] .= $val.",";
			unset($pro[$key]);
		} else if(substr($key,0,16)=="pro_rebate_desc_") {
			$pro['pro_rebate_desc'] .= $val.",";
			unset($pro[$key]);
		} else if(substr($key,0,16)=="pro_rebate_type_") {
			$pro['pro_rebate_type'] .= $val.",";
			unset($pro[$key]);
		}
		else if(substr($key,0,26)=="pro_rebate_display_weight_") {
			$pro['pro_rebate_display_weight'] .= $val.",";
			unset($pro[$key]);
		}
	}
	// convert to object
	$pro_obj = new Object();
	foreach($pro as $k=>$v) {
		if(!is_numeric($k)) $pro_obj->push($k,$v);
	}
	// make the calcs
	require_once("es-calcs.php");
	$r['did'] = "es_proposals previewed";
	$r['data'] = estimate($pro_obj);
}

// just loads calcs to the row headers
function getPropCalcs() {
	global $m,$r;
	// get the proposal data
	$m->getRow("es_proposals",$_POST['id']);
	// make the calcs
	require_once("es-calcs.php");
	$r['did'] = "es_proposals got calcs";
	$r['data'] = estimate($m->lastData());
	$r['data']['ID'] = $_POST['id'];
}

// send proposal
function sendProposal() {
	global $E,$m,$r;
	$id = $_POST['id'];
	// include mailer
	require_once("swift/lib/swift_required.php");
	$transport = Swift_SmtpTransport::newInstance($E->EINSTEIN_SMTP_SERVER,$E->EINSTEIN_SMTP_PORT)->setUsername($E->EINSTEIN_SMTP_USER)->setPassword($E->EINSTEIN_SMTP_PASS);
	$mailer = Swift_Mailer::newInstance($transport);
	// get info
	$m->getRow("es_proposals",$id);
	$pro = $m->lastData();
	$m->getRow("es_jobs",$pro->pro_jobID);
	$job = $m->lastData();
	$m->getRow("es_reps",$pro->pro_repID);
	$rep = $m->lastData();
	$m->getRow("es_offices",$pro->pro_officeID);
	$off = $m->lastData();
	$m->getRow("es_customers",$pro->pro_customerID);
	$cus = $m->lastData();
	// determine action
	if($pro->pro_submitted && $pro->pro_published && $pro->pro_approved) { // just approved
		// build emails
		$cus_email = "Dear ".$cus->cus_name_first." ".$cus->cus_name_last.",\n\n";
		$cus_email .= "Thank you for your interest in our services. I will be contacting you within 24 hours to discuss contract options for your Lighthousesolar system installation.\n\n";
		$cus_email .= "Let me know if you have any questions or concerns.\n\n";
		$cus_email .= "Sincerely Yours,\n".$rep->rep_name_first." ".$rep->rep_name_last."\n\nTechnical Sales Engineer\nLighthousesolar ".$off->off_city.", ".$off->off_state."\n".$rep->rep_email."\n".$off->off_phone;
		$tse_email = $rep->rep_name_first.",\n\nYour Proposal #".$pro->ID.": \"".$pro->pro_name."\" has been approved by your Customer, ".$cus->cus_name_first." ".$cus->cus_name_last.".\n\n";
		$tse_email .= "Follow this link to view your Proposal: ".$E->PORTAL_URI."?pro_key=".$pro->pro_key."\n\n";
		$tse_email .= "Thanks for using Einstein.\n\n";
		$tse_email .= "- LHS ".$off->off_city.", ".$off->off_state;
		// customer info -- temp, should always be from job
		$cus_address = $job->job_email!="" ? $job->job_email : ($cus->cus_email1!="" ? $cus->cus_email1 : $cus->cus_email2);
		$cus_name = $job->job_contact!="" ? $job->job_contact : $cus->cus_name_first." ".$cus->cus_name_last;
		// make messages
		$cus_message = Swift_Message::newInstance("Your Lighthousesolar Proposal #".$pro->ID.": \"".$pro->pro_name."\" is pending contract review.")
		  ->setFrom(array($rep->rep_email => $rep->rep_name_first." ".$rep->rep_name_last))
		  ->setTo(array($cus_address => $cus_name))
		  ->setBody($cus_email);
		$tse_message = Swift_Message::newInstance("[LHS ".$off->off_city.", ".$off->off_state." – Einstein] Proposal #".$pro->ID.": \"".$pro->pro_name."\""." Approved.")
		  ->setFrom(array($E->EINSTEIN_SMTP_FROM => "LHS Einstein"))
		  ->setTo(array($rep->rep_email => $rep->rep_name_first." ".$rep->rep_name_last))
		  ->setBcc(array($off->off_manager_list => "General Manager, Lighthouse ".$off->off_city.", ".$off->off_state))
		  ->setBody($tse_email);
		// send mail
		$mailer->send($cus_message);
		$mailer->send($tse_message);
	} else if($pro->pro_submitted && $pro->pro_published) { // just published
		// for customer
		$cus_email = "Dear ".$cus->cus_name_first." ".$cus->cus_name_last.",<br /><br />";
		$cus_email .= "Thank you for offering Lighthouse Solar the opportunity to produce a Proposal for your solar energy systems. Please follow the link below to review your Proposal.<br /><br />";
		$cus_email .= $E->PORTAL_URI."?pro_key=".$pro->pro_key."<br /><br />";
		$cus_email .= "Let me know if you have any questions or concerns. We look forward to hearing from you!<br /><br />";
		$cus_email .= "Sincerely Yours,<br />".$rep->rep_name_first." ".$rep->rep_name_last."<br /><br />Technical Sales Engineer<br />Lighthousesolar ".$off->off_city.", ".$off->off_state."<br />".$rep->rep_email."<br />".$off->off_phone;
		$cus_email .= "<br /><br />--------------------------------------------------<br />";
		$cus_email .= "Having trouble viewing your PV Proposal? To ensure the best viewing experience, please try installing or upgrading to the latest version of <a href='http://www.google.com/chrome/'>Chrome</a>, <a href='http://www.apple.com/safari/download/'>Safari</a>, or <a href='http://www.mozilla.com/'>Firefox</a>. Please inform your Lighthouse Solar Sales Rep as soon as possible if you're unable to view your PV Proposal. We value your feeback.";
		// for tse
		$tse_email = $rep->rep_name_first.",\n\nYour Proposal #".$pro->ID.": \"".$pro->pro_name."\" has been delivered to your Customer, ".$cus->cus_name_first." ".$cus->cus_name_last.".\n\n";
		$tse_email .= "Follow this link to view your Proposal: ".$E->PORTAL_URI."?pro_key=".$pro->pro_key."\n\n";
		$tse_email .= "Thanks for using Einstein.\n\n";
		$tse_email .= "- LHS ".$off->off_city.", ".$off->off_state;
		// customer info -- temp, should always be from job
		$cus_address = $job->job_email!="" ? $job->job_email : ($cus->cus_email1!="" ? $cus->cus_email1 : $cus->cus_email2);
		$cus_name = $job->job_contact!="" ? $job->job_contact : $cus->cus_name_first." ".$cus->cus_name_last;
		// make messages
		$cus_message = Swift_Message::newInstance("Your Lighthousesolar Proposal #".$pro->ID.": \"".$pro->pro_name."\" is ready for review.")
		  ->setFrom(array($rep->rep_email => $rep->rep_name_first." ".$rep->rep_name_last))
		  ->setTo(array($cus_address => $cus_name))
		  ->setBcc(array($off->off_manager_list => "General Manager, Lighthouse ".$off->off_city.", ".$off->off_state))
		  ->setBody($cus_email)
		  ->setContentType("text/html");
		$tse_message = Swift_Message::newInstance("[LHS ".$off->off_city.", ".$off->off_state." – Einstein] Proposal #".$pro->ID.": \"".$pro->pro_name."\""." Delivered.")
		  ->setFrom(array($E->EINSTEIN_SMTP_FROM => "LHS Einstein"))
		  ->setTo(array($rep->rep_email => $rep->rep_name_first." ".$rep->rep_name_last))
		  ->setBody($tse_email);
		// send mail
		$mailer->send($cus_message);
		$mailer->send($tse_message);
	} else { // just submitted
		// make calcs
		require_once("es-calcs.php");
		$figures = estimate($pro);
		// ensure no zeros
		if($figures['permit_margin']==0) $figures['permit_margin'] = "n / a";
		else $figures['permit_margin'] .= "%";
		if($figures['sub_margin']==0) $figures['sub_margin'] = "n / a";
		else $figures['sub_margin'] .= "%";
		if($figures['equip_margin']==0) $figures['equip_margin'] = "n / a";
		else $figures['equip_margin'] .= "%";
		if($figures['install_labor_margin']==0) $figures['install_labor_margin'] = "n / a";
		else $figures['install_labor_margin'] .= "%";
		if($figures['inventory_margin']==0) $figures['inventory_margin'] = "n / a";
		else $figures['inventory_margin'] .= "%";
		if($figures['non_inventory_margin']==0) $figures['non_inventory_margin'] = "n / a";
		else $figures['non_inventory_margin'] .= "%";
		if($figures['total_margin']==0) $figures['total_margin'] = "n / a";
		else $figures['total_margin'] .= "%";
		// build emails
		$sm_email = "I just submitted a new Proposal. Here are the details:\n\n";
		$tse_email = "Here are the details of the Proposal you just submitted:\n\n";
		$details = "System Size: ".$figures['size']." kW\n";
		$details .= "Labor Hours: ".$figures['install_labor_hrs']." hrs\n";
		$details .= "Price: $".$figures['price']."\n";
		$details .= "PPW Gross: $".$figures['ppw_gross']."/W\n";
		$details .= "PPW Net: $".$figures['ppw_net']."/W\n";
		$details .= "Permit Margin: ".$figures['permit_margin']."\n";
		$details .= "Subcontractor Margin: ".$figures['sub_margin']."\n";
		$details .= "Equipment Margin: ".$figures['equip_margin']."\n";
		$details .= "Installation Labor Margin: ".$figures['install_labor_margin']."\n";
		$details .= "Inventory Margin: ".$figures['inventory_margin']."\n";
		$details .= "Non-Inventory Margin: ".$figures['non_inventory_margin']."\n\n";
		$details .= "Total Margin: ".$figures['total_margin']."\n\n";
		$sm_email .= $details;
		$tse_email .= $details;
		$sm_email .= "- ".$rep->rep_name_first." ".$rep->rep_name_last."\n\n\n";
		$sm_email .= "--------------------------------------------------\n";
		$sm_email .= "View Proposal: ".$E->PORTAL_URI."?pro_key=".$pro->pro_key."\n\n";
		$sm_email .= "Please login to your account at ".$E->EINSTEIN_URI." and moderate this Proposal.\n\n";
		$sm_email .= "Thanks for using Einstein.\n\n";
		$sm_email .= "- LHS ".$off->off_city.", ".$off->off_state;
		$tse_email .= "\n--------------------------------------------------\n";
		$tse_email .= "View Proposal: ".$E->PORTAL_URI."?pro_key=".$pro->pro_key."\n\n";
		$tse_email .= "Your General Manager has been notified of this action and will moderate your Proposal before it is sent to your Customer.\n\n";
		$tse_email .= "Thanks for using Einstein.\n\n";
		$tse_email .= "- LHS ".$off->off_city.", ".$off->off_state;
		// make messages
		$sm_message = Swift_Message::newInstance("[LHS ".$off->off_city.", ".$off->off_state." – Einstein] Please moderate Proposal #".$pro->ID.": \"".$pro->pro_name."\"")
		  ->setFrom(array($rep->rep_email => $rep->rep_name_first." ".$rep->rep_name_last))
		  ->setTo(array($off->off_manager_list => "General Manager, Lighthouse ".$off->off_city.", ".$off->off_state))
		  ->setBody($sm_email);
		$tse_message = Swift_Message::newInstance("[LHS ".$off->off_city.", ".$off->off_state." – Einstein] Proposal #".$pro->ID.": \"".$pro->pro_name."\""." Submitted.")
		  ->setFrom(array($E->EINSTEIN_SMTP_FROM => "LHS Einstein"))
		  ->setTo(array($rep->rep_email => $rep->rep_name_first." ".$rep->rep_name_last))
		  ->setBody($tse_email);
		// send mail
		$mailer->send($sm_message);
		$mailer->send($tse_message);
	}
	$r['did'] = "sent proposal";
}

// notify reps
function notifyRep() {
	global $E,$m,$r;
	$id = $_POST['id'];
	$type = $_POST['type'];
	$pass = $_POST['pass'];
	// include mailer
	require_once("swift/lib/swift_required.php");
	$transport = Swift_SmtpTransport::newInstance($E->EINSTEIN_SMTP_SERVER,$E->EINSTEIN_SMTP_PORT)->setUsername($E->EINSTEIN_SMTP_USER)->setPassword($E->EINSTEIN_SMTP_PASS);
	$mailer = Swift_Mailer::newInstance($transport);
	// get info
	$m->getRow("es_reps",$id);
	$rep = $m->lastData();
	$m->getRow("es_offices",$rep->rep_officeID);
	$off = $m->lastData();
	// determine action
	if($type=="new") {
		// notify rep of new account
		$rep_email = $rep->rep_name_first.",\n\nYour Einstein Estimator Sales Rep Account has been created.\n\n";
		$rep_email .= "Username: ".$rep->rep_login."\n";
		$rep_email .= "Password: ".$pass."\n\n";
		$rep_email .= "Follow this link to Log In and start building Proposals: ".$E->EINSTEIN_URI."\n\n";
		$rep_email .= "Thanks for using Einstein.\n\n";
		$rep_email .= "- LHS ".$off->off_city.", ".$off->off_state;
		// notify gm of new account
		$sm_email = "You created a new Einstein Estimator Sales Rep Account for ".$rep->rep_name_first." ".$rep->rep_name_last.".\n\n";
		$sm_email .= "Username: ".$rep->rep_login."\n";
		$sm_email .= "Password: ".$pass."\n\n";
		$sm_email .= "Thanks for using Einstein.\n\n";
		$sm_email .= "- LHS ".$off->off_city.", ".$off->off_state;
		// make messages
		$rep_message = Swift_Message::newInstance("[LHS ".$off->off_city.", ".$off->off_state." – Einstein] New Sales Rep created.")
		  ->setFrom(array($E->EINSTEIN_SMTP_FROM => "LHS Einstein"))
		  ->setTo(array($rep->rep_email => $rep->rep_name_first." ".$rep->rep_name_last))
		  ->setBody($rep_email);
		$sm_message = Swift_Message::newInstance("[LHS ".$off->off_city.", ".$off->off_state." – Einstein] New Sales Rep created.")
		  ->setFrom(array($E->EINSTEIN_SMTP_FROM => "LHS Einstein"))
		  ->setTo(array($off->off_manager_list => "General Manager, Lighthouse ".$off->off_city.", ".$off->off_state))
		  ->setBody($sm_email);
		// send mail
		$mailer->send($rep_message);
		$mailer->send($sm_message);
	} else if($type=="update") {
		// notify rep of password change
		$rep_email = $rep->rep_name_first.",\n\nYour Einstein Estimator Sales Rep Account password has been reset.\n\n";
		$rep_email .= "New Password: ".$pass."\n\n";
		$rep_email .= "Follow this link to Log In: ".$E->EINSTEIN_URI."\n\n";
		$rep_email .= "Thanks for using Einstein.\n\n";
		$rep_email .= "- LHS ".$off->off_city.", ".$off->off_state;
		// make messages
		$rep_message = Swift_Message::newInstance("[LHS ".$off->off_city.", ".$off->off_state." – Einstein] Account changed.")
		  ->setFrom(array($E->EINSTEIN_SMTP_FROM => "LHS Einstein"))
		  ->setTo(array($rep->rep_email => $rep->rep_name_first." ".$rep->rep_name_last))
		  ->setBody($rep_email);
		// send mail
		$mailer->send($rep_message);
	} else if($type=="new_office") {
		// notify rep of new account
		$rep_email = $rep->rep_name_first.", ".$rep->rep_name_last." -\n\nYour Einstein Estimator Office Administrator Account has been created.\n\n";
		$rep_email .= "Username: ".$rep->rep_login."\n";
		$rep_email .= "Password: ".$pass."\n\n";
		$rep_email .= "Follow this link to Log In, configure your Office Settings, and create Sales Rep Accounts: ".$E->EINSTEIN_URI."\n\n";
		$rep_email .= "Thanks for using Einstein.\n\n";
		$rep_email .= "- LHS Einstein";
		// make messages
		$rep_message = Swift_Message::newInstance("[LHS ".$off->off_city.", ".$off->off_state." – Einstein] New Office Admin created.")
		  ->setFrom(array($E->EINSTEIN_SMTP_FROM => "LHS Einstein"))
		  ->setTo(array($rep->rep_email => $rep->rep_name_first." ".$rep->rep_name_last))
		  ->setBcc(array($E->EINSTEIN_SMTP_FROM => "LHS Admin"))
		  ->setBody($rep_email);
		// send mail
		$mailer->send($rep_message);
	}
	$r['did'] = "rep notified";
}

// check if email associated with proposal
function validateEmail($e) {
	global $m,$r;
	// match valid email syntax
	$sntx = "/^(([A-Za-z0-9]+_+)|([A-Za-z0-9]+\-+)|([A-Za-z0-9]+\.+)|([A-Za-z0-9]+\++))*[A-Za-z0-9]+@((\w+\-+)|(\w+\.))*\w{1,63}\.[a-zA-Z]{2,6}$/";
	return preg_match($sntx,$e);
}

#——————————————————————————————–————————————————————––––—– UTILITIES

// delete entire directory tree -- fucked up, do NOT use ! may delete all ancestors
function destroy($dir) {
	if(substr($dir,count($dir)-1)!="/") $dir.="/";
    $mydir = opendir($dir);
    while(false !== ($file = readdir($mydir))) {
        if($file != "." && $file != "..") {
            chmod($dir.$file, 0777);
            if(is_dir($dir.$file)) {
                chdir(".");
                destroy($dir.$file."/");
                rmdir($dir.$file);
            } else unlink($dir.$file);
        }
    }
    closedir($mydir);
	rmdir($dir);
}

#——————————————————————————————–—————————————————————––––––––––– END

?>
