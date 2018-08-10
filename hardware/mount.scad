include <./modules.scad>
include <./variables.scad>

module motor_key_120 (half = false, DECOYS = false, sides = 1, ALT = false) {
    innerD = 7.85;
	outer_d = 27.5 + 2;
	notch_d = 10;
	height = 7 + 5 + 4;
	diff = 14 + 2.5 + 2;
    $fn = 60;
	difference () {
		union () {
			translate([one_to_one_x, one_to_one_y, 12.1]) cylinder(r1 = 12 / 2, r2 = 12/2 + 4, h = 5, center = true);// padding against bearing
			translate([one_to_one_x, one_to_one_y, diff + 1]) cylinder(r=outer_d/2, h= height -2, center= true, $fn=200); //large cylinder
			translate([one_to_one_x, one_to_one_y, 6]) cylinder(r=innerD/2, h= 10, center= true);
			//key_end([0, 180, 0], [one_to_one_x, one_to_one_y, -2.5]); //thicker-than-key_end cylinder for inner bearing
            key_end([0, 180, -20], [one_to_one_x, one_to_one_y, -3.5], ALT = ALT); // longer for laser cut board
            //key_end([0, 180, 0], [one_to_one_x, one_to_one_y, -4.5]); //experimental length
		}
        //1 notch
		translate([one_to_one_x, one_to_one_y, diff]) {
			translate ([-outer_d/2 - 2.5, 0, 0]) cylinder(r=notch_d/2, h= height, center= true); //notch
		}
		translate([one_to_one_x, one_to_one_y, diff]) {
			translate ([-outer_d/2  -.5, -3.5 , 0]) rotate([0, 0, 100]) cube([15, 5, height], center = true); // smooth notch
			translate ([-outer_d/2  -.5, 3.5, 0]) rotate([0, 0, -100]) cube([15, 5, height], center = true); // smooth notch
		}
        
        if (sides == 2) {
            //2 notch
            translate([one_to_one_x, one_to_one_y, diff]) {
                translate ([outer_d/2 + 2.5, 0, 0]) cylinder(r=notch_d/2, h= height, center= true); //notch
            }
            translate([one_to_one_x, one_to_one_y, diff]) {
                translate ([outer_d/2  +.5, -3.5, 0]) rotate([0, 0, -100]) cube([15, 5, height], center = true); // smooth notch
                translate ([outer_d/2  +.5, 3.5, 0]) rotate([0, 0, 100]) cube([15, 5, height], center = true); // smooth notch
            }
        }
        
		//slot for hobbled(?) end
        translate([one_to_one_x, one_to_one_y, 17 + 2]) {
             translate([0, 0, 6.5]) hobbled_rod_120(12);
            //translate([6.42, 0, 6 - 1.7]) motor_set_screw_120();
            translate([6.42 - .2, 0, 4.3 - 1]) rotate([0, 90, 0]) motor_set_screw_120_alt();
            translate([14, 0, 4.3 - 1]) rotate([0, 90, 0]) cylinder(r2 = 6 / 2, r1 = 5.8 / 2, h = 6, center = true); //extension
            
        }
		//translate([one_to_one_x, one_to_one_y, 20.5]) cylinder(r = 11.5/2, h = 10, center = true);

		translate([one_to_one_x, one_to_one_y, 17.5]) {
			difference() {
				//cylinder(r = 7.5/2, h = 2, center = true);
				//translate([5, 0, 0]) cube([10, 10, 10], center = true);
			}
		}
		if (half) {
			translate([one_to_one_x - 50 , one_to_one_y, -50]) cube([100, 100, 200]);
		}
	}
  // translate([one_to_one_x, one_to_one_y, 17]) translate([6.42 - .2, 0, 6 - 1.7]) rotate([0, 90, 0]) motor_set_screw_120_alt();
    if (DECOYS) {
        translate([one_to_one_x, one_to_one_y, 20.5]) decoys(24);
    }
}


module motor_key_120_reinforced () {
    motor_key_120();

}

module motor_key_120_master_mold () {
    $fn = 200;
    translate([54, -12, 26.4]) rotate([0, 180, 0]) motor_key_120();
    difference() {
        translate([0, 0, 16]) cylinder(r1= 30, r2 = 30, h = 42,  center = true);
        translate([0, 0, 21]) cylinder(r1= 26, r2 = 26, h = 42,  center = true);
    //translate([50, 0, 0]) cube([100, 100, 100], center = true);
        }
}

module motor_set_screw_120 () {
    cube([10.19, 2.95, 2.95], center = true);
    translate([(10.19 / 2) - (2.56 / 2), 0, 0]) cube([2.56, 5.8, 5.8], center = true);    
}

module motor_set_screw_120_alt () {
    $fn = 60;
    cylinder(r = 2.95 / 2, h = 10.19, center= true);
    translate([0, 0, (10.19 / 2) - (2.56 / 2)]) cylinder(r = 5.8 / 2, h = 2.56, center = true);
}

module hobbled_rod_120 (h = 10) {
            d = 4.00;
        diff = 3.33;
    difference () {
        
        cylinder(r = d/2, h = h, center = true, $fn = 60);
        translate([d/2 + ((d/2) - (d - diff)), 0, 0]) cube([d, d, h + 1], center = true);
    }
}

module motor_12v () {
	motor_d = 37;
	motor_h = 63;
	end = 11.5;
	len = 17;
	cylinder(r = motor_d/2, h = motor_h, center=true);
	translate([0, 0, (motor_h / 2) + (len / 2)]) cylinder(r = end/2, h = len, center=true);
}

module geared_motor_mount_120 (DECOYS = false) {
    $fn = 160;
	base_d = 45;
	base_inner = 25.2;
	base_thickness = 3;
	hole_d = 7;
	screw_d = 3.2;
    bolt_end = 5.4;
	height = 6;
    screw_distance = 17;
	difference () {
		difference () {
			translate([-6, 0, 2.5]) cylinder(r=base_d/2, h=height + 5, center = true); //outer cylinder
			//translate([-6, 0, base_thickness + 2.5]) cylinder(r=base_inner/2, h=height + 5, center = true); //inner cylinder
            translate([0, 0, base_thickness + 1.5]) cylinder(r=base_inner/2, h=height + 5, center = true); //inner cylinder
		}
		cylinder(r=hole_d/2, h=29, center = true); //center hole
		//screw holes
        translate([0, 0, 0]) {
            translate([0, screw_distance/2, 0]) cylinder(r=screw_d/2, h=29, center = true);
            translate([0, -screw_distance/2, 0]) cylinder(r=screw_d/2, h=29, center = true);
            
            //bolt ends
            translate([0, screw_distance/2, -3]) cylinder(r=bolt_end/2, h=2, center = true);
            translate([0, -screw_distance/2, -3]) cylinder(r=bolt_end/2, h=2, center = true);
        }
        translate([2, 19, 0]) cylinder(r=5, h = 100, center = true); //hole for panel bolt access
    }
	//wings
	translate ([-one_to_one_x, -one_to_one_y, 0]) bolt_holder([mm_x[0], mm_y[0], 0], mm_r[0], height, mm_l[0]);
	translate ([-one_to_one_x, -one_to_one_y, 0]) bolt_holder([mm_x[1], mm_y[1], 0], mm_r[1], height, mm_l[1]);
    //translate ([-one_to_one_x, -one_to_one_y, 0]) bolt_holder([mm_x[5] , mm_y[5], 0], mm_r[5], height, mm_l[5] - 1);
    if (DECOYS) {
        translate([-7, -6, 0]) decoys(40, -1, 4);
        translate([-9, -2, 0]) rotate([0, 0, 49]) decoys(37, -1, 4);
    }
}


module motor_mount_bottom () {
    $fn = 60;
	mount_d = 45;
	base_d = 45;
	outer_d = 28 + 2.3 + 4;
	height = 19 + 3.5 + 4;
	bolt_h = 22.3;
	shelf_h = 6; //match to motor_mount
    screw_d = 4;
	module motor_mount_core () {
		translate ([one_to_one_x, one_to_one_y, (height / 2 ) + 5.75]) {
			difference() {
				translate([-6, 0, 0]) cylinder(r = mount_d / 2, h = height, center = true); //main block
				translate([0, 0, (height / 2) - (shelf_h / 2)]) cylinder(r = base_d / 2 + 7, h = shelf_h, center = true); //shelf for motor_mount
				cylinder(r = outer_d / 2, h = 50, center = true); //space for spinning
				translate ([-one_to_one_x, -one_to_one_y, 0]) remove_front(); //flatten side
				translate([-32, -17, -19]) cube([40, 40, 40], center= true); //hole for notch
				translate([-42, 0, -19]) rotate([0, 0, -39]) cube([40, 40, 40], center= true); //hole for notch
				translate([2.5, 19.5, 0]) cylinder(r=10/2, h = 60, center=true); // hole for panel bolt
				translate([22.5, 19.5, 0]) cube([40, 40, 60], center = true); //remove front entirely
                translate([-6.5, 0, 7.5]) {
                    translate([0, screw_distance/2, 0]) sphere(r=screw_d, center = true);
                    translate([0, -screw_distance/2, 0]) sphere(r=screw_d,  center = true);
                }
			}
			translate ([-one_to_one_x, -one_to_one_y, 0]) bolt_holder([mm_x[0], mm_y[0], -shelf_h / 2], mm_r[0], height - shelf_h, mm_l[0], tight = 0.2); //Bottom bolt holder
			translate ([-one_to_one_x, -one_to_one_y, 0]) bolt_holder([mm_x[1] , mm_y[1], -shelf_h / 2], mm_r[1], height - shelf_h, mm_l[1], tight = 0.2); //Left bolt holder
            
			translate ([-one_to_one_x, -one_to_one_y, -2]) bolt_holder([mm_x[5] , mm_y[5], -shelf_h / 2], mm_r[5], height - shelf_h - 4, mm_l[5]); //Top bolt holder
		}
	}
	module microswitch_holder () {
		difference () {
			translate([29, -1, 14]) cube([36, 65, height - shelf_h - 4], center = true);//Base shape
			translate ([25.5, -14, 15]) {
				cube([17, 28, 39.5], center = true); //rectangle hole for center
				translate([4.5, 5.6, 0]) rotate([0, 0, -23]) cube([17, 25, 39.5], center = true); //bottom right inner
				translate([-2, -18, -3.5]) cube([7, 11, 12], center = true); // hole for bottom pins
				translate([-9.5, -1, -3.5]) cube([30, 4, 12], center = true); //hole for side pin
			}
			translate ([14, 37.5, 15]) rotate([0, 0, 44]) cube([55, 30, 30], center= true); //top left outer
			translate ([one_to_one_x, one_to_one_y, 18]) {
				cylinder(r = outer_d / 2, h = 50, center = true); //space for spinning
			}
			translate ([32, 6, 15]) {
				difference () {
					translate([3, 0, 0]) rotate([0, 0, 0]) cube([20, 25, 39.5], center = true); //removes area for microswitch arm
					translate([-2, 16, 0]) rotate([0, 0, -55]) cube([20, 50, 39.5], center = true);
				}
			}
			translate ([58, -25, 15]) {
				rotate([0, 0, 75]) cube([45, 30, 30], center= true); //bottom right outer
			}
			translate([mm_x[4], mm_y[4], 0]) cylinder(r = bolt_inner, h = 100, center = true); // extra bolt hole
			translate([mm_x[1], mm_y[1], 0]) cylinder(r = 4, h = 100, center = true); //clear out top left bolt hole
		}
	}
	module panel_attachment () {
            difference () {
                union() {
                    translate([0, 0, 7.75 + 3]) cylinder(r = 10/2, h = 44 - shelf_h, center = true);
                    translate([3.5, 0, 0]) cube([7, 7, height - shelf_h - 4], center = true);
                }
                translate([0, 0, 25]) cylinder(r = 3.2/2, h = 50, center = true);
            }
    }
    translate([8, -9, (height - shelf_h) / 2 + 3.75]) panel_attachment();
	motor_mount_core();
	microswitch_holder();
	bolt_holder([mm_x[2], mm_y[2], ((height - shelf_h)/ 2) + 3.75], 0, height - shelf_h - 4, 6); //bottom left mount
	bolt_holder([mm_x[3], mm_y[3], ((height - shelf_h)/ 2) + 3.75], 180, height - shelf_h - 4, 6); //bottom right mount
	if (DECOYS) {
		difference () {
			translate([35, 0 , 0]) decoys(44, 8, 6);
		}
		translate([0, 0, 8]) cube([4, 4, 4], center = true);
		translate([40, 55, 8]) cube([4, 4, 4], center = true);
	}
}
module bolt_holder (position = [0, 0, 0], rotate_z = 0, h = 17, length = 4.5, hole = true, tight = 0) {
    bolt_r = 6; 
	
	translate (position) {
		difference () {
			union() {
				cylinder(r = bolt_r + 0, h = h, center = true);
				rotate([0, 0, rotate_z]) translate([length/2, 0, 0]) cube([length, bolt_r * 2, h], center=true);
			}
			if (hole) {
				cylinder(r = bolt_inner - tight, h = h + 2, center = true);
			}
		}
	}
}
module microswitch (position = [0, 0, 0], rotation = [0, 0, 0]) {
	translate(position) {
		rotate(rotation) {
			cube([16, 28, 9.5], center = true);
			translate([10, 8, 0]) rotate([0, 0, -7]) cube([1, 28, 4], center = true);
			translate([8 + 7, 14 + 8, 0]) cylinder(r = 2.5, h = 4, center = true);
			translate([0, -19, 0]) cube([6, 11, 9.5], center = true);
		}
	}
}
module l289N_mount () {
    $fn = 60;
	DISTANCE = 36.5;
	H = 4;
    THICKNESS = 3;
	module stand () {
		difference () {
			cylinder(r1 = 4, r2 = 3, h = H, center = true);
			cylinder(r = 1.5, h = H, center = true);
		}
	}
	translate([0, 0, 0]) stand();
	translate([DISTANCE, 0, 0]) stand();
	translate([DISTANCE, DISTANCE, 0]) stand();
	translate([0, DISTANCE, 0]) stand();
    difference () {
        translate([DISTANCE/2, DISTANCE/2, -3]) rounded_cube([DISTANCE + 8, DISTANCE + 8, THICKNESS], 8, center = true); //base
        translate([DISTANCE/2, DISTANCE/2, -3]) rounded_cube([DISTANCE - 5, DISTANCE - 5, THICKNESS], 10, center = true); //base
        translate([0, 0, 0]) cylinder(r = 1.5, h = H * 5, center = true);
        translate([DISTANCE, 0, 0]) cylinder(r = 1.5, h = H * 5, center = true);
        translate([DISTANCE, DISTANCE, 0]) cylinder(r = 1.5, h = H * 5, center = true);
        translate([0, DISTANCE, 0]) cylinder(r = 1.5, h = H * 5, center = true);
    }
}
module pcb_mount () {
	DISTANCE_X = 41;
	DISTANCE_Y = 66;
	OUTER = 10;
	H = 8;

	module stand () {
		difference () {
			cylinder(r1 = 5, r2 = 4, h = H, center = true);
			cylinder(r = 1.75, h = H, center = true);
		}
	}
	translate([0, 0, 0]) stand();
	translate([DISTANCE_X, 0, 0]) stand();
	translate([DISTANCE_X, DISTANCE_Y, 0]) stand();
	translate([0, DISTANCE_Y, 0]) stand();
	translate([DISTANCE_X/2, DISTANCE_Y/2, -4]) rounded_cube([DISTANCE_X + OUTER, DISTANCE_Y + OUTER, 4], OUTER, center = true);
}

module bolt_guide () {
	$fn = 60;
	H = 39;
	difference () {
		union() {
			cylinder(r = 10 / 2, h = H, center = true);
			translate([0, 0, -(H / 2) + 1]) cylinder(r = 14 / 2, h = 2, center = true);
		}
		cylinder(r = 7 / 2, h = H + 1, center = true);
		translate([12, 0, -(H / 2) + 1]) cube([14, 14, 3], center = true);
	}
}