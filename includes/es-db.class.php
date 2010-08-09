<?php
############
# REQUIRES #
############
require_once("es-object.class.php");
###############
# DECLARATION #
###############
class DBConnection {
	######################
	# PRIVATE PROPERTIES #
	######################
	// db vars
	# live
	//private $_HOSTNAME = 'keeper101.db.5185848.hostedresource.com';
	//private $_USERNAME = 'keeper101';
	//private $_PASSWORD = 'V4rfvB5tgb';
	//private $_DB = 'keeper101';
	# local
	private $_HOSTNAME = 'localhost';
	private $_USERNAME = 'root';
	private $_PASSWORD = 'solarone';
	private $_DB = 'keeper101';
	private $_db_link = 0;
	private $_query_id = 0;
	private $_affected_rows = 0;
	private $_last_results;
	// error vars
	private $_error = "";
	private $_errno = 0;
	private $_errors = array();
	##################
	# PUBLIC METHODS #
	##################
	// constructor
	public function DBConnection() {}
	// returns query as an array of objects or single object
	public function get_results($sql,$single=FALSE) {
		$this->_connect();
		$query_id = $this->_query($sql);
		$this->_flush();
		while($results = @mysql_fetch_array($query_id)) {
			$row = new Object();
			foreach($results as $col=>$val) {
				if(!is_numeric($col)) $row->push($col,$val);
			}
			$this->_last_results[] = $row;
		}
		$this->_disconnect();
		return (count($this->_last_results)>0) ? ($single) ? $this->_last_results[0] : $this->_last_results : FALSE;
	}
	// inserts row as an array
	public function insert($table,$data,$close=TRUE) {
		$this->_connect();
		$q="INSERT INTO `".$table."` ";
	    $v=''; $n='';
	    foreach($data as $key=>$val) {
	        $n.="`$key`, ";
	        if(strtolower($val)=='null') $v.="NULL, ";
	        elseif(strtolower($val)=='now()') $v.="NOW(), ";
	        else $v.= "'".$this->escape($val)."', ";
	    }
	    $q .= "(". rtrim($n, ', ') .") VALUES (". rtrim($v, ', ') .");";
	    if($this->_query($q)) {
	        $this->_free_result();
	        return mysql_insert_id();
	    } else return FALSE;
		if($close) $this->_disconnect();
	}
	// updates row as an array
	public function update($table,$id,$data,$close=TRUE) {
		$this->_connect();
		$q="UPDATE `".$table."` SET ";
	    $v='';
	    foreach($data as $key=>$val) {
	        $v.="`$key`=";
	        if(strtolower($val)=='null') $v.="NULL, ";
	        elseif(strtolower($val)=='now()') $v.="NOW(), ";
	        else $v.= "'".$this->escape($val)."', ";
	    }
	    $q .= rtrim($v, ', ') ." WHERE ID='$id';";
	    if($this->_query($q)) {
	        $this->_free_result();
	        return TRUE;
	    } else return FALSE;
		if($close) $this->_disconnect();
	}
	// update a single column in a row
	public function updateCell($table,$value,$column,$row,$append=FALSE,$incr=FALSE) {
		$this->_connect();
		if($append) $q = "UPDATE ".$table." SET ".$column."=concat(".$column.",'".$this->escape($value)."') WHERE ID=".$row.";";
		else if($incr) $q = "UPDATE ".$table." SET ".$column."=".$column."+".$this->escape($value)." WHERE ID=".$row.";";
		else $q = "UPDATE ".$table." SET ".$column."='".$this->escape($value)."' WHERE ID=".$row.";";
		if($this->_query($q)) {
	        $this->_free_result();
	        return TRUE;
	    } else return FALSE;
		$this->_disconnect();
	}
	// delete a row
	public function delete($table,$data,$close=TRUE) {
		$this->_connect();
		$q="DELETE FROM `".$table."` ";
		$w='';
		foreach($data as $key=>$val) {
			$w.=$key."='".$this->escape($val)."'";
			$w.=" AND ";
		}
		$w=substr($w,0,strlen($w)-5);
		$q.="WHERE ".$w;
		if($this->_query($q)) {
	        $this->_free_result();
	        return TRUE;
	    } else return FALSE;
		if($close) $this->_disconnect();
	}
	// escapes characters for use in an sql statement
	public function escape($string) {
	    if(get_magic_quotes_gpc()) $string = stripslashes($string);
	    return trim(mysql_real_escape_string($string));
	}
	###################
	# PRIVATE METHODS #
	###################
	// do query
	private function _query($sql) {
	    $this->_query_id = @mysql_query($sql,$this->_db_link);
	    if (!$this->_query_id) {
	        $this->_oops("<b>MySQL Query fail:</b> $sql");
	    }
	    $this->_affected_rows = @mysql_affected_rows();
	    return $this->_query_id;
	}
	// makes db connection
	private function _connect() {
		$this->_db_link = @mysql_connect($this->_HOSTNAME,$this->_USERNAME,$this->_PASSWORD);
		if(!$this->_db_link) {
	        $this->_oops("Could not connect to server: <b>$this->_HOSTNAME</b>.");
	    }
	    if(!@mysql_select_db($this->_DB, $this->_db_link)) {
	        $this->_oops("Could not open database: <b>$this->_DB</b>.");
	    }
	}
	// close db connection
	private function _disconnect() {
		if(!@mysql_close($this->_db_link)) {
			$this->_oops("Connection close failed.");
		}
	}
	// flush local results
	private function _flush() {
		$this->_last_results = array();
	}
	// free the result set
	private function _free_result($query_id=-1) {
	    if($query_id!=-1) {
	        $this->_query_id=$query_id;
	    }
	    !@mysql_free_result($this->query_id);
	}
	// throws error message
	private function _oops($msg='') {
	    if($this->_db_link>0){
	        $this->_error=mysql_error($this->_db_link);
	        $this->_errno=mysql_errno($this->_db_link);
	    } else {
	        $this->_error=mysql_error();
	        $this->_errno=mysql_errno();
	    }
	    $email_body = '<table align="center" border="1" cellspacing="0" style="background:white;color:black;width:80%;">
	    			<tr><th colspan=2>Database Error</th></tr>
	    			<tr><td align="right" valign="top">Message:</td><td>' . $msg . '</tr></td>';

	    if(strlen($this->_error)>0)
			$email_body .= '<tr><td align="right" valign="top" nowrap>MySQL Error:</td><td>' . $this->_error . '</tr></td>';

	    $email_body .= '<tr><td align="right">Date:</td><td>' . date("l, F j, Y \a\\t g:i:s A") . '</tr></td>
	    			<tr><td align="right">Script:</td><td><a href="' . @$_SERVER['REQUEST_URI'] . '">' . @$_SERVER['REQUEST_URI'] . '</a></tr></td>';

		if(strlen(@$_SERVER['HTTP_REFERER'])>0)
			$email_body .= '<tr><td align="right">Referer:</td><td><a href="'.@$_SERVER['HTTP_REFERER'].'">'.@$_SERVER['HTTP_REFERER'].'</a></tr></td>';

	    $email_body .= '</table>';
		array_push($this->_errors, $email_body);
	}			
}#class
?>