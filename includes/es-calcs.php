<?php
//////////////////////////////////////////////////// DO THE ESTIMATE
function estimate($pro) {
	global $m;
	// get the office info
	$m->getRow('es_offices',$pro->pro_officeID);
	$off = $m->lastData();
	// get the rep info
	$m->getRow('es_reps',$pro->pro_repID);
	$rep = $m->lastData();
	// get the customer info
	$m->getRow('es_customers',$pro->pro_customerID);
	$cus = $m->lastData();
	// get the jobs info
	$m->getRow('es_jobs',$pro->pro_jobID);
	$job = $m->lastData();
	// get the zones
	$zoneIDs = explode(",",substr($pro->pro_zones,0,-1));
	$pro_num_zones = count($zoneIDs);
	$zones = array();
	foreach($zoneIDs as $zoneID) {
		$m->getRow('es_zones',$zoneID);
		$zones[] = $m->lastData();
	}
	// pro vars
	$pro_size = 0;
	$pro_production = 0;
	$pro_racking_length = 0;
	$pro_install_labor_hrs = 0;
	$pro_install_labor_cost = 0;
	$pro_install_labor_price = 0;
	$pro_module_cost = 0;
	$pro_module_price = 0;
	$pro_mounting_cost = 0;
	$pro_mounting_price = 0;
	$pro_rebate_bbl = 0;
	$pro_rebate_abl = 0;
	foreach($zones as $zone) {
		$pro_size += $zone->zon_size;
		$pro_production += $zone->zon_production;
		$pro_racking_length += $zone->zon_racking_length;
		$pro_install_labor_hrs += $zone->zon_install_labor_hrs;
		$pro_install_labor_cost += $zone->zon_install_labor_cost;
		$pro_install_labor_price += $zone->zon_install_labor_price;
		$pro_module_cost += $zone->zon_module_cost;
		$pro_module_price += $zone->zon_module_price;
		$pro_mounting_cost += $zone->zon_racking_cost+$zone->zon_connection_cost;
		$pro_mounting_price += $zone->zon_racking_price+$zone->zon_connection_price;
		$pro_rebate_bbl += $zone->zon_rebate;
	}
	// make calcs
	$labor_unit_cost = $off->off_labor_cost;
	$labor_unit_price = $off->off_labor_price;
	// inter method
	$inter_methods = explode(",",substr($pro->pro_inter_method,0,-1));
	$inter_labor_hrs = 0;
	foreach($inter_methods as $im) {
		$m->getRow('es_inter_comps',$im,'int_model_num');
		$inter_labor_hrs += $m->lastData()->int_labor;
	}
	// outside coduit
	$m->getRow('es_conn_comps','1');
	$conduit_labor_hrs = $m->lastData()->con_labor*$pro->pro_conduit_out/20;
	$conduit_cost = $m->lastData()->con_cost*$pro->pro_conduit_out;
	$conduit_price = $m->lastData()->con_price*$pro->pro_conduit_out;
	// inside coduit
	$m->getRow('es_conn_comps','2');
	$conduit_labor_hrs += $m->lastData()->con_labor*$pro->pro_conduit_in/20;
	$conduit_cost += $m->lastData()->con_cost*$pro->pro_conduit_in;
	$conduit_price += $m->lastData()->con_price*$pro->pro_conduit_in;
	// underground coduit
	$m->getRow('es_conn_comps','3');
	$conduit_labor_hrs += $m->lastData()->con_labor*$pro->pro_conduit_under/20;
	$conduit_cost += $m->lastData()->con_cost*$pro->pro_conduit_under;
	$conduit_price += $m->lastData()->con_price*$pro->pro_conduit_under;
	// zones labor add
	$zones_labor_hrs = ($pro_num_zones*0.25)-0.25;
	// driving labor hours
	$drive_labor_hrs = 2*($job->job_drive_time/60)*$pro->pro_num_trips*$pro->pro_num_installers;
	// add up
	$add_labor_hrs = $inter_labor_hrs+$conduit_labor_hrs+$zones_labor_hrs+$drive_labor_hrs;
	$add_labor_cost = ($add_labor_hrs*$labor_unit_cost);
	$add_labor_price = ($add_labor_hrs*$labor_unit_price)+$pro->pro_fluctuation;
	// account for off season
	$winter_labor_cost = ($pro->pro_winter==1) ? ($pro_install_labor_cost+$add_labor_cost)*$off->off_winter_up*0.01 : 0;
	$winter_labor_price = ($pro->pro_winter==1) ? ($pro_install_labor_price+$add_labor_price)*$off->off_winter_up*0.01 : 0;
	// account for others involved
	$others_labor_cost = ($pro->pro_others_involved==1) ? ($pro_install_labor_cost+$add_labor_cost)*$off->off_others_up*0.01 : 0;
	$others_labor_price = ($pro->pro_others_involved==1) ? ($pro_install_labor_price+$add_labor_price)*$off->off_others_up*0.01 : 0;
	// inverters
	$inverters = explode(",",substr($pro->pro_inverter,0,-1));
	$inverter_cost = 0;
	$inverter_price = 0;
	foreach($inverters as $in) {
		if(strpos($in,"_g_")!==FALSE) $in = substr($in,0,strpos($in,"_g_"));
		$m->getRow('es_inverters',$in,'inv_model_num');
		$inverter_cost += $m->lastData()->inv_cost;
		$inverter_price += $m->lastData()->inv_price;
	}
	///////////////////////////////////////////////////////// TOTALS
	// install labor
	$install_labor_total_cost = $pro_install_labor_cost+$add_labor_cost+$winter_labor_cost+$others_labor_cost;
	$install_labor_total_price = $pro_install_labor_price+$add_labor_price+$winter_labor_price+$others_labor_price;
	// inventory items
	$inventory_cost = ($pro_module_cost+$pro_mounting_cost)+($inverter_cost+$inverter_cost*$off->off_inventory_up*0.01);
	$inventory_price = ($pro_module_price+$pro_mounting_price)+($inverter_price+$inverter_price*$off->off_inventory_up*0.01);
	$inventory_price += $inventory_price*$off->off_inventory_margin*0.01;
	// non-inventory items
	$non_inventory_cost = $conduit_cost + $conduit_cost*$off->off_non_inventory_up*0.01;
	$non_inventory_price = $conduit_price + $conduit_price*$off->off_non_inventory_up*0.01;
	$non_inventory_price += $non_inventory_price*$off->off_non_inventory_margin*0.01;
	// fees
	$permit_cost = $pro->pro_permit_fee; // not included in total
	$permit_price = $permit_cost + $permit_cost*$off->off_permit_up*0.01;
	$sub_cost = $pro->pro_extra_fee+$pro->pro_engin_fee;
	$sub_price = $sub_cost + $sub_cost*$off->off_sub_up*0.01;
	$equip_cost = $pro->pro_equip_rental;
	$equip_price = $equip_cost + $equip_cost*$off->off_equip_up*0.01;
	// tax
	$tax_cost = ceil($pro->pro_taxrate*($inventory_cost+$non_inventory_cost+$pro->pro_misc_materials))/100;
	$tax_price = ceil($pro->pro_taxrate*($inventory_price+$non_inventory_price+$pro->pro_misc_materials+($pro->pro_misc_materials*$pro->pro_misc_materials_up*0.01)))/100;
	// total -- does not include permit or tax
	$cost = $install_labor_total_cost+$inventory_cost+$non_inventory_cost+$sub_cost+$equip_cost+$pro->pro_misc_materials;
	$price = $install_labor_total_price+$inventory_price+$non_inventory_price+$sub_price+$equip_price+$pro->pro_inspection+$pro->pro_misc_materials+($pro->pro_misc_materials*$pro->pro_misc_materials_up*0.01)-$pro->pro_discount;
	// parse additional rebates
	$add_rebate_types = explode(",",substr($pro->pro_rebate_type,0,-1));
	$add_rebate_amnts = explode(",",substr($pro->pro_rebate_amnt,0,-1));
	$add_rebate_order = explode(",",substr($pro->pro_rebate_display_weight,0,-1));
	for($i=0;$i<count($add_rebate_types);$i++) {
		if($add_rebate_amnts[$i]!="") {
			switch($add_rebate_types[$i]) {
				case 0 :
					$pr = $add_rebate_amnts[$i]*$pro_size*1000;
					break;
				case 1 :
					$pr = $add_rebate_amnts[$i]*$price*0.01;
					break;
				case 2 :
					$pr = $add_rebate_amnts[$i];
					break;
			}
			if($add_rebate_order[$i]==0) $pro_rebate_bbl += $pr;
			else $pro_rebate_abl += $pr;
		}
	}
	// credit
	$credit = ($pro->pro_credit==1) ? ($price+$tax_price+$permit_price-$pro_rebate_bbl)*0.30 : 0;
	// set margins
	$permit_margin = ($permit_price!=0) ? ($permit_price-$permit_cost) / $permit_price : 0;
	$sub_margin = ($sub_price!=0) ? ($sub_price-$sub_cost) / $sub_price : 0;
	$equip_margin = ($equip_price!=0) ? ($equip_price-$equip_cost) / $equip_price : 0;
	// calculated margins
	$install_labor_margin = ($install_labor_total_price-$install_labor_total_cost) / $install_labor_total_price;
	$inventory_margin = ($inventory_price!=0) ? ($inventory_price-$inventory_cost) / $inventory_price : 0;
	$non_inventory_margin = ($non_inventory_price!=0) ? ($non_inventory_price-$non_inventory_cost) / $non_inventory_price : 0;
	$total_margin = ($price-$cost) / $price;
	// price per watt
	$ppw_gross = $price / $pro_size / 1000;
	$ppw_net = ($price-$pro_rebate_bbl-$pro_rebate_abl) / $pro_size / 1000;
	// for customer
	$cus_price = $price+$tax_price+$permit_price-$pro_rebate_bbl;
	$ppw_cus_net = $cus_price / $pro_size / 1000;
	// send back info
	$vars = array(
		// figures
		'size'=>$pro_size,
		'production'=>$pro_production,
		'install_labor'=>number_format($install_labor_total_price),
		'install_labor_nf'=>$install_labor_total_price,
		'install_labor_hrs'=>($pro_install_labor_hrs+$add_labor_hrs),
		'inventory'=>number_format($inventory_price),
		'non_inventory'=>number_format($non_inventory_price),
		'permit'=>number_format($permit_price),
		'sub'=>number_format($sub_price),
		'equip'=>number_format($equip_price),
		'tax'=>number_format($tax_price),
		'tax_nf'=>$tax_price,
		'credit'=>number_format($credit),
		'credit_nf'=>$credit,
		'price'=>number_format($price),
		'price_nf'=>$price,
		// margins
		'permit_margin'=>round($permit_margin*10000)/100,
		'sub_margin'=>round($sub_margin*10000)/100,
		'equip_margin'=>round($equip_margin*10000)/100,
		'install_labor_margin'=>round($install_labor_margin*10000)/100,
		'inventory_margin'=>round($inventory_margin*10000)/100,
		'non_inventory_margin'=>round($non_inventory_margin*10000)/100,
		'total_margin'=>round($total_margin*10000)/100,
		// prices per watt
		'ppw_gross'=>round($ppw_gross*100)/100,
		'ppw_net'=>round($ppw_net*100)/100,
		// for display only
		'misc_materials'=>($non_inventory_price+$pro->pro_misc_materials+($pro->pro_misc_materials*$pro->pro_misc_materials_up*0.01)),
		'comp_total'=>$inventory_price+$non_inventory_price+$pro->pro_misc_materials+($pro->pro_misc_materials*$pro->pro_misc_materials_up*0.01),
		'subtotal'=>number_format($cus_price-$tax_price),
		'cus_price'=>number_format($cus_price),
		'cus_price_nf'=>$cus_price,
		'cus_after_credit'=>number_format($cus_price-$credit-$pro_rebate_abl),
		'cus_after_credit_nf'=>$cus_price-$credit-$pro_rebate_abl,
		'ppw_cus_net'=>round($ppw_cus_net*100)/100,
		'credits_total'=>$pro_rebate_bbl+$pro_rebate_abl+$pro->pro_discount,
		'fees_total'=>$permit_price+$sub_price+$equip_price+$pro->pro_inspection
	);
	return $vars;
}
?>