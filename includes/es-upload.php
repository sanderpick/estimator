<?php
#——————————————————————————————–—————————————————————–––––– INCLUDES
require_once("es-manager.class.php");
require("es-media_functions.php");
$m = new EstimatorManager();
// ensure universal time
date_default_timezone_set("UTC");
#——————————————————————————————–—————————————————————––––– INIT VARS
$IMG_WIDTHS = array('thumb'=>210, 'big'=>800);
$IMG_HEIGHTS = array('thumb'=>118);
$IMG_CORNER_RADIUS = 5;
$up['up_caption'] = (isset($_POST['up_caption'])) ? $_POST['up_caption'] : "";
$up['up_officeID'] = $_POST['up_officeID'];
$up['up_repID'] = $_POST['up_repID'];
$up['up_customerID'] = $_POST['up_customerID'];
$up['up_jobID'] = $_POST['up_jobID'];
$up['up_zoneID'] = $_POST['up_zoneID'];
#——————————————————————————————–—————————————————————––– CREATE DIRS
$up_tree = "../uploads";
$this_office = "office".$up['up_officeID'];
$up_dir_office = $up_tree."/".$this_office;
$up_dir_office_img = $up_dir_office."/img";
$up_dir_office_vid = $up_dir_office."/vid";
$up_dir_office_doc = $up_dir_office."/doc";
$up_dir_office_pdf = $up_dir_office."/pdf";
if(!file_exists($up_dir_office)) {
	mkdir($up_dir_office);
	mkdir($up_dir_office_img);
	mkdir($up_dir_office_vid);
	mkdir($up_dir_office_doc);
	mkdir($up_dir_office_pdf);
}
$this_year = date("Y"); $this_month = date("m");
#——————————————————————————————–—————————————————————–– PROCESS FILE
if(isset($_FILES['Filedata']) && is_uploaded_file($_FILES['Filedata']['tmp_name']) && $_FILES['Filedata']['error']==0) {
	// get file data
	$fileinfo = pathinfo($_FILES['Filedata']['name']);
	// avoid hidden files
	if(substr($fileinfo['filename'],0,1)!=".") {
		// what kind of object?
	    $file_extension = strtolower($fileinfo['extension']);
		// vars
		$widths_str = ""; $heights_str = ""; $file_handle = ""; $width_orig = ""; $height_orig = "";
		// ensure this is an image
		if($file_extension=="jpg" || $file_extension=="jpeg" || $file_extension=="png" || $file_extension=="gif") {
			$up['up_type'] = "img";
			// determine location and move file
			$up_dir_year = $up_dir_office_img."/".$this_year;
			if(!file_exists($up_dir_year)) mkdir($up_dir_year);
			$up_dir_month = $up_dir_year."/".$this_month;
			if(!file_exists($up_dir_month)) mkdir($up_dir_month);
			// for db
			$up_root = $up_dir_month;
			// generate unique file id
			$file_id = uniqid(md5(rand()));
			$up_dir = $up_root."/".$file_id;
			$file = $up_dir."/".$file_id.".".$file_extension;
			mkdir($up_dir);
			move_uploaded_file($_FILES['Filedata']['tmp_name'],$file);
			// determine file size
			$size = filesize($file);
			// create grid images
			list($width_orig,$height_orig) = getimagesize($file);
			$asp = $width_orig/$height_orig;
			switch($file_extension) {
				case "jpg" : case "jpeg" : $image_orig = imagecreatefromjpeg($file); break;
				case "png" : $image_orig = imagecreatefrompng($file); break;
				case "gif" : $image_orig = imagecreatefromgif($file); break;
			}
			$widths_str = $heights_str = "";
			foreach($IMG_WIDTHS as $k=>$width) {
				if($k=="thumb") {
					$height = $IMG_HEIGHTS['thumb'];
					$image = imagecreatetruecolor($width,$height);
					if($width_orig > $height_orig) {
						$width_orig_slice = $height_orig * (16/9);
						$x_off = ($width_orig - $width_orig_slice) / 2;
						$y_off = 0;
						imagecopyresampled($image,$image_orig,0,0,$x_off,$y_off,$width,$height,$width_orig_slice,$height_orig);
					} else {
						$height_orig_slice = $width_orig / (16/9);
						$x_off = 0;
						$y_off = ($height_orig - $height_orig_slice) / 2;
						imagecopyresampled($image,$image_orig,0,0,$x_off,$y_off,$width,$height,$width_orig,$height_orig_slice);
					}
					//imageroundcorners($image,$width,$height,$IMG_CORNER_RADIUS);
					imagejpeg($image,$up_dir."/".$file_id."_thumb.jpg");
				} else {
					$height = round(1000*$width/$asp)/1000;
					$image = imagecreatetruecolor($width,$height);
					imagecopyresampled($image,$image_orig,0,0,0,0,$width,$height,$width_orig,$height_orig);
					imagejpeg($image,$up_dir."/".$file_id."_sized_".$width.".jpg");
				}
				$widths_str .= (string)$width.","; $heights_str .= (string)$height.",";
				imagedestroy($image);
			}
			// clean up
			imagedestroy($image_orig);
			unlink($file);
		}
		// clean up
		$widths_str = substr($widths_str,0,-1);
		$heights_str = substr($heights_str,0,-1);
		// create the upload relative to root		
		$up['up_handle'] = $file_id;
		$up['up_root'] = substr($up_root,3)."/";
		$up['up_width_orig'] = $width_orig;
		$up['up_height_orig'] = $height_orig;
		$up['up_widths'] = $widths_str;
		$up['up_heights'] = $heights_str;
		$up['up_time'] = date("y-m-d H:i:s");
		$up['active'] = 1;
		$insertID = $m->addRow("es_uploads",$up);
	}
	// set old upload for zone to inactive
	$m->getRow("es_zones",$up['up_zoneID']);
	$m->editCell("es_uploads","0","active",$m->lastData()->zon_layout);
	// add upload id to zone
	if($m->editCell("es_zones",$insertID,"zon_layout",$up['up_zoneID']))
		echo $up['up_root'].$up['up_handle']."/".$up['up_handle'];
	else echo "upload failed";
}
?>