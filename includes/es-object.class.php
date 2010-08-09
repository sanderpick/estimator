<?php
###############
# DECLARATION #
###############
class Object {
	##################
	# PUBLIC METHODS #
	##################
	// constructor
	public function Object() {}
	// dynamicly creeate properties
	public function push($k, $v) {
		$this->{$k} = $v;
	}
}#class
?>