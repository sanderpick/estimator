<?php
############
# REQUIRES #
############
require_once("es-db.class.php");
###############
# DECLARATION #
###############
class EstimatorManager {
	######################
	# PRIVATE PROPERTIES #
	######################
	private $_esdb;
	private $_rep;
	private $_lastData;
	##################
	# PUBLIC METHODS #
	##################
	// constructor - create db object
	public function EstimatorManager() {
		$host = $_SERVER['SERVER_NAME'];
		preg_match('/\.([a-z,A-Z]{2,6})$/',$host,$tld);
		switch($tld[1]) {
			case "ld" : $this->_esdb = new DBConnection('localhost','root','plebeian','ces_einstein'); break; // local
			default : 
				if($host=='einstein-beta.cleanenergysolutionsinc.com') $this->_esdb = new DBConnection('estimator.cleanenergysolutionsinc.com','ces_albert','V4rfvB5tgb','ces_einstein_beta');
				else $this->_esdb = new DBConnection('estimator.cleanenergysolutionsinc.com','ces_albert','V4rfvB5tgb','ces_einstein'); 
				break;
		}
	} 
	#—————————————————————————————— create ————————————————————————————#
	// add a row
	public function addRow($table,$row) {
		return $this->_esdb->insert($table,$row);
	}
	// add a row
	public function updateRow($table,$id,$row) {
		return $this->_esdb->update($table,$id,$row);
	}
	// edit a cell
	public function editCell($table,$value,$column,$row,$append=FALSE,$incr=FALSE) {
		return $this->_esdb->updateCell($table,$value,$column,$row,$append,$incr);
	}
	#—————————————————————————————— show ——————————————————————————————#
	// get something
	public function getRow($table,$id,$col="ID") {
		if($row=$this->_esdb->get_results("SELECT * FROM $table WHERE $col='$id'",TRUE)) {
			$this->_lastData = $row;
			return TRUE;
		} else return FALSE;
	}
	// get everything
	public function getAll($table,$get,$order,$wc=NULL) {
		($wc!=NULL) ? $wc = "WHERE ".$wc : $wc="";
		if($all=$this->_esdb->get_results("SELECT $get FROM $table $wc ORDER BY $order")) {
			$this->_lastData = $all;
			return TRUE;
		} else return FALSE;
	}
	// execute a search
	public function search($table,$cols,$get,$phrase,$wc=NULL) {
		($wc!=NULL) ? $wc = $wc." AND" : $wc="";
		if($results=$this->_esdb->get_results("SELECT $get FROM $table WHERE $wc MATCH($cols) AGAINST('$phrase')")) {
			$this->_lastData = $results;
			return TRUE;
		} else return FALSE;
	}
	// retrieve results
	public function lastData() {
		return ($this->_lastData!=NULL) ? $this->_lastData : FALSE;
	}
	#—————————————————————————————— delete ————————————————————————————#
	// delete a row
	public function deleteRow($table,$id) {
		return $this->_esdb->delete($table,array('ID'=>$id));
	}
	// delete all
	public function deleteAll($table,$wheres) {
		return $this->_esdb->delete($table,$wheres);
	}
	#—————————————————————————————— user ——————————————————————————————#
	// login rep
	public function login($user,$pass) {
		$salt = substr(md5($user),0,15);
		$pass_salted = $pass.$salt;
		$pass = sha1($pass_salted);
		if($rep=$this->_esdb->get_results("SELECT * FROM es_reps WHERE rep_pass='$pass'",TRUE)) {
			$this->_rep = $rep;
			$_SESSION["ses_rep"] = $this->_rep->rep_key;
			$_SESSION["ses_id"] = session_id();
			$_SESSION["ses_ip"] = $_SERVER['REMOTE_ADDR'];
			$_SESSION["ses_time"] = date('y-m-d H:i:s');
			$pass = NULL;
			return $this->_esdb->insert('es_sessions',$_SESSION);
		} else return FALSE;
	}
	// resume session
	public function resume($rep_key) {
		if($rep=$this->_esdb->get_results("SELECT * FROM es_reps WHERE rep_key='$rep_key'",TRUE)) {
			$this->_rep = $rep;
			$rep_key = NULL;
			return TRUE;		
		} else return FALSE;
	}
	// logout rep
	public function logout() {
		$logout = $this->_esdb->delete('es_sessions',$_SESSION);
		foreach($_SESSION as $key=>$val) unset($_SESSION[$key]);
		$this->_rep = NULL;
		return (session_destroy()) ? $logout : FALSE;
	}
	// get info about current signed in rep
	public function getRep($p=NULL) { 
		if($this->_rep!=NULL) { 
			if($p!=NULL) { 
				return $this->_rep->$p;
			} else {
				$this->_rep->rep_pass="";
				return $this->_rep;
			} 
		} else return FALSE;
	}
}
#######
# END #
#######
?>
