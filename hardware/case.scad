include <./modules.scad>
include <./variables.scad>

module l289N_holes (r = 3/2 - .2) {
    $fn = 60;
    DISTANCE = 36.5;
    H = 50;
    translate([0, 0, 0]) cylinder(r = r, h = H * 5, center = true);
    translate([DISTANCE, 0, 0]) cylinder(r = r, h = H * 5, center = true);
    translate([DISTANCE, DISTANCE, 0]) cylinder(r = r, h = H * 5, center = true);
    translate([0, DISTANCE, 0]) cylinder(r = r, h = H * 5, center = true);
}

module l289N_hole_test () {
    $fn = 40;
    difference () {
        cube([140, 40, 3], center = true);
        cylinder(r = 3/2, h = 50, center = true);
        translate([7, 0, 0]) cylinder(r = 3/2, h = 50, center = true);
        translate([7 * 2, 0, 0]) cylinder(r = 3/2 - .1, h = 50, center = true);
        translate([7 * 3, 0, 0]) cylinder(r = 3/2 - .2, h = 50, center = true);
        translate([7 * 4, 0, 0]) cylinder(r = 3/2 - .3, h = 50, center = true);
    }
}

module intval_panel_laser () {
    $fn = 40;
	difference () {
		union () {
			difference () {
				translate ([0, 0, 8.5]) {
					union () {
						translate([12 - 10, , 0]) {
                            rotate([0, 0, -13]) {
                                rounded_cube([panel_2_x + 20 + 20, panel_2_y, 25.4/8], d = 20, center = true);
                            }
                        }
						//reinforces
						//translate([54, -12, -3]) rotate([0, 0, 89]) rounded_cube([110, 20, 4], 20, center = true);
						//translate([-17, 2, -3]) rotate([0, 0, 72]) rounded_cube([94, 13, 4], 13, center = true);
					}
				}
				for (i = [0 : len(xArray) - 1]) {
					bolex_pin_inner_laser(xArray[i], yArray[i]);
				}
			}
			//onetoone(26, 10, 4.5);
			//extends for onetoone
			

		}
		//onetoone(9, 14, 8.5);
		bearing_laser(54.5, 12, 6, width= 18, hole=false);
        translate([-38, -1, 0]) rotate([0, 0, -13]) l289N_holes();
        //translate ([6, -9, height + 3.5]) cylinder(r = bolt_inner, h = 50, center = true); //cover standoff hole
		//frame_counter_access(); //use the space
		m_p_access();
		remove_front();
		translate([6, 18, 0]) rotate([0, 0, -13]) cube([15, 25, 40], center=true); //motor wind key hole

		for (i = [0 : len(mm_x) - 1]) {
			translate([mm_x[i], mm_y[i], 0]) cylinder(r = bolt_inner, h = 100, center = true);
		}
        translate([0, 0, .25]) intval_laser_panel_cover();
            translate([-35, -24, 15]) rotate([0, 0, -13]) {
            translate([58 / 2, 23 / 2, 0]) cylinder(r = 3/2 - .2, h = 30, center = true, $fn = 20);
            translate([-58 / 2, 23 / 2, 0]) cylinder(r = 3/2 - .2, h = 30, center = true, $fn = 20);
            translate([58 / 2, -23 / 2, 0]) cylinder(r = 3/2 - .2, h = 30, center = true, $fn = 20);
            translate([-58 / 2, -23 / 2, 0]) cylinder(r = 3/2 - .2, h = 30, center = true, $fn = 20);
        }
	}

}

module intval_panel_laser_debug () {
    $fn = 40;
	difference () {
		union () {
			difference () {
				translate ([0, 0, 8.5]) {
					union () {
						translate([12 - 32.5, -5 + 9, 0]) {
                            rotate([0, 0, -13]) {
                                rounded_cube([panel_2_x + 20 + 65, panel_2_y, 25.4/8], d = 20, center = true);
                            }
                        }
						//reinforces
						//translate([54, -12, -3]) rotate([0, 0, 89]) rounded_cube([110, 20, 4], 20, center = true);
						//translate([-17, 2, -3]) rotate([0, 0, 72]) rounded_cube([94, 13, 4], 13, center = true);
					}
				}
				for (i = [0 : len(xArray) - 1]) {
					bolex_pin_inner_laser(xArray[i], yArray[i]);
				}
			}
			//onetoone(26, 10, 4.5);
			//extends for onetoone
			

		}
		//onetoone(9, 14, 8.5);
		bearing_laser(54.5, 12, 6, width= 18, hole=false);
        translate([-38, -1, 0]) rotate([0, 0, -13]) l289N_holes();
        //translate ([6, -9, height + 3.5]) cylinder(r = bolt_inner, h = 50, center = true); //cover standoff hole
		//frame_counter_access(); //use the space
		m_p_access();
		remove_front();
		translate([6, 18, 0]) rotate([0, 0, -13]) cube([15, 25, 40], center=true); //motor wind key hole

		for (i = [0 : len(mm_x) - 1]) {
			translate([mm_x[i], mm_y[i], 0]) cylinder(r = bolt_inner, h = 100, center = true);
		}
        intval_laser_panel_cover(DEBUG = true);
        translate ([4, 12, 0]) {
            translate([-51.5, -8.5, 0]) cylinder(r = 2.8/2, h = 100, center = true);
            translate([-51.5 - 66, -8.5 + 15, 0]) cylinder(r = 2.8/2, h = 100, center = true);
            translate([-51.5 + 11.5, -8 + 49, 0]) cylinder(r = 2.8/2, h = 100, center = true);
            translate([-51.5 - 54.5, -8.5 + 49 + 16, 0]) cylinder(r = 2.8/2, h = 100, center = true);
        }
	}
}

module bolex_pin_laser (x, y) {
	in = innerD;
    $fn = 120;
	translate ([x, y, 1]) {
		difference () {
			union () {
				translate([0, 0, (height / 2) - 3]) cylinder(r = (outerD + 5) / 2, h = 2, center = true);
				translate([0, 0, 1.175/2]) cylinder(r = outerD / 2, h = height + 1.175 , center = true);
			}
			cylinder(r = in / 2, h = height * 2, center = true);
			translate([0, 0, (height / 2) - 1.9]) cylinder(r1 =4.5 / 2, r2 = 6.7 / 2, h = 2, center = true);
            translate([0, 0, (height / 2) + 1]) cylinder(r = 6.7 / 2, h = 4, center = true);
		}
	}
}

module bolex_pin_laser_alt (x, y) {
    in = innerD;
    $fn = 120;
    translate ([x, y, 1]) {
        difference () {
            union () {
                translate([0, 0, (height / 2) + 1.5]) cylinder(r = (outerD + 1.5) / 2, h = 2, center = true);
                translate([0, 0, 1.175/2]) cylinder(r = outerD / 2, h = height + 1.175 - 1 , center = true);
            }
            cylinder(r = in / 2, h = height * 2, center = true);
            translate([0, 0, (height / 2) - 1.9]) cylinder(r1 =4.5 / 2, r2 = 6.7 / 2, h = 2, center = true);
            translate([0, 0, (height / 2) + 1]) cylinder(r = 6.7 / 2, h = 4, center = true);
        }
    }
}

module intval_laser_standoffs () {
    $fn = 40;
    for (i = [0 : len(xArray) - 1]) {
        bolex_pin_laser(xArray[i], yArray[i]);
	}
}

module intval_laser_standoffs_alt () {
    $fn = 40;
    for (i = [0 : len(xArray) - 1]) {
        bolex_pin_laser_alt(xArray[i], yArray[i]);
    }
}

module intval_laser_standoffs_plate () {
    $fn = 40;
    rotate ([0, 180, 0]) {
        bolex_pin_laser(0, 0);
        bolex_pin_laser(15, 0);
        bolex_pin_laser(0, 15);
        bolex_pin_laser(15, 15);
    }
    //decoys
    //translate([7, 7, 0]) decoys(23, 5.5, 6);
}

module intval_laser_standoffs_plate_alt () {
    $fn = 40;
    rotate ([0, 180, 0]) {
        bolex_pin_laser_alt(0, 0);
        bolex_pin_laser_alt(15, 0);
        bolex_pin_laser_alt(0, 15);
        bolex_pin_laser_alt(15, 15);
    }
    //decoys
    //translate([7, 7, 0]) decoys(23, 5.5, 6);
}

module bolex_pin_inner_laser (x, y) {
    $fn = 40;
    //innerD = 6.75;
    innerD = 9;
	translate ([x, y, 1]) {
		cylinder(r = innerD / 2, h = height * 2, center = true);
		//translate([0, 0, (height / 2) - 1]) cylinder(r1 =4.5 / 2, r2 = 6.5 / 2, h = 2, center = true);
	}
}

module bearing_laser (x, y, z, width= 8, hole = true) {
	innerD = 8.05;
	outerD = 22.1 - .4;
	fuzz = 0.1;
	translate ([x, y, z]) {
		difference () {
			cylinder(r = outerD / 2 + fuzz, h = width, center = true);
			if (hole) {
				cylinder(r = innerD / 2 - fuzz, h = width, center = true);
			}
		}
	}
}

module intval_laser_panel_cover (LASER = false, DEBUG = false, ALL_RED = false) {
    $fn = 60;
    cover_h = 16 + 3 + 4 + 10;
    MATERIAL = 25.4 / 8;

    module top () {
        difference () {
            rotate([0, 0, -13]) {
                translate([-10, 0, 0]) rounded_cube([120, panel_2_y, MATERIAL], d = 20, center = true);
            }
            translate([53, 12, 0]) cylinder(r = 30, h = 60, center = true); //hole for motor mount
            translate([22, 20, 0]) cylinder(r = 8, h = 60, center = true); // hole for moto mount bolt holder
            translate([53, 42, 0]) cylinder(r = 15, h = 60, center = true); //removes pointy part

            translate([-44 - 20, 8 + 5, -(cover_h / 2 ) - MATERIAL - 1])  rotate([0, 0, -13]) rotate([0, 90, 0]) back_side();
            translate([2, 49, -(cover_h / 2 ) - MATERIAL - 1]) rotate([0, 0, -13]) rotate([90, 0, 0]) top_side();
            translate([-22, -45, -(cover_h / 2 ) - MATERIAL - 1]) rotate([0, 0, -13]) rotate([90, 0, 0]) bottom_side();
            translate([xArray[0], yArray[0], 0]) cylinder(r = 7 / 2, h = height * 20, center = true); //top standoff access
            translate ([8, -9, height + 3.5]) cylinder(r = bolt_inner - .5, h = 50, center = true); //bottom mount attach
        } 
        
    }
    module back_side () {
        difference () {
            translate([0, 1.75, 0]) cube([cover_h + 2 + (MATERIAL * 2) + 1 + 3, panel_2_y - 10, MATERIAL], center = true);
            //top negatives (strange)
            translate([-(cover_h / 2) - (MATERIAL * 1.5), 20, 0]) cube([MATERIAL, 20, MATERIAL], center = true);
            translate([-(cover_h / 2) - (MATERIAL * 1.5), -20, 0]) cube([MATERIAL, 20, MATERIAL], center = true);
            
            translate([-(cover_h / 2) - (MATERIAL * 1.5), 47, 0]) cube([MATERIAL, 10, MATERIAL], center = true);
            translate([-(cover_h / 2) - (MATERIAL * 1.5), -47, 0]) cube([MATERIAL, 10, MATERIAL], center = true);

            //bottom negatives
            translate([(cover_h / 2) + (MATERIAL * 1.5), 20, 0]) cube([MATERIAL, 20, MATERIAL], center = true);
            translate([(cover_h / 2) + (MATERIAL * 1.5), -20 - 11, 0]) cube([MATERIAL, 35, MATERIAL], center = true);
            
            translate([18 , -30 , 0]) cube([10, 15, 30], center = true); //access for microSD
            
            translate([0, 50.5, 0]) cube([17.5, MATERIAL, MATERIAL], center = true);
            translate([0, -50.5 + (1.75 / 2) + MATERIAL - 0.25, 0]) cube([17.5, MATERIAL, MATERIAL], center = true);
        }
        
    }
    
    module top_side () {
        difference () {
            translate([-2.5 - 10 - 1, 0, 0]) cube([ panel_2_x - 41 + 20, cover_h + 2 + (MATERIAL * 2) + 1  + 3, MATERIAL], center = true);
            //top and bottom negatives
            translate([28 - 5, -(cover_h / 2) - (MATERIAL * 1.5), 0]) cube([35, MATERIAL, MATERIAL], center = true);
            translate([28 - 5, (cover_h / 2) + (MATERIAL * 1.5), 0]) cube([35, MATERIAL, MATERIAL], center = true);
            translate([-28 - 10 - 2, -(cover_h / 2) - (MATERIAL * 1.5), 0]) cube([30, MATERIAL, MATERIAL], center = true);
            translate([-28 - 10 - 2, (cover_h / 2) + (MATERIAL * 1.5), 0]) cube([30, MATERIAL, MATERIAL], center = true);
            //back side negatives
            translate([-35.5 - 20 - 1, -13 - 8.1, 0]) cube([MATERIAL, 25, MATERIAL], center = true); //side tabs
            translate([-35.5 - 20 - 1, 13 + 8.1, 0]) cube([MATERIAL, 25, MATERIAL], center = true); //side tabs
       }

    }
    
   module bottom_side () {
        difference () {
            //main piece
            translate([.25 - 10 - 1, 0, 0]) cube([ panel_2_x - 39.5 + 20, cover_h + 2 + (MATERIAL * 2) + 1  + 3, MATERIAL], center = true);
            //top and bottom negatives
            translate([25 - 27.5, -(cover_h / 2) - (MATERIAL * 1.5), 0]) cube([35, MATERIAL, MATERIAL], center = true);
            translate([-25 - 29, -(cover_h / 2) - (MATERIAL * 1.5), 0]) cube([30, MATERIAL, MATERIAL], center = true);
            translate([30, -(cover_h / 2) - (MATERIAL * 1.5), 0]) cube([15, MATERIAL, MATERIAL], center = true);
            //
            translate([30, (cover_h / 2) + (MATERIAL * 1.5), 0]) cube([35, MATERIAL, MATERIAL], center = true);
            translate([-30 - 10 - 2, (cover_h / 2) + (MATERIAL * 1.5), 0]) cube([30, MATERIAL, MATERIAL], center = true);
            
            //back side negatives
            translate([-33.5 - 20 - 1, 17.3, 0]) cube([MATERIAL, 17.5, MATERIAL], center = true);
            translate([-33.5 - 20 - 1, -17.3, 0]) cube([MATERIAL, 17.5, MATERIAL], center = true);
            
            //hole for audio jack -> add countersink
            translate([7, 10, 0]) cylinder(r = 6/2, h = 50, center = true);
            //hole for female DC power jack, 12vdc
            //translate([-15 - 20, 1 + 5, 0])  cylinder(r = 8/2, h = 20, center = true); //smaller DC jack
            translate([23, 8, 0])  cylinder(r = 12/2, h = 20, center = true); //larger DC jack

            //usb negative
            translate([0, -15, 0]) cube([30, 10, 20], center = true);

        }
        
        
    }
    
    if (LASER) {
        projection() top();
        if (!DEBUG) {
            translate([-95, 20, 0]) rotate([0, 0, -13]) projection() back_side();
        }
        translate([20, 80, 0]) rotate([0, 0, -13]) projection() top_side();
        translate([-20, -80, 0])  rotate([0, 0, -13]) projection() bottom_side();
    } else {
        //translate([0, 0, height + cover_h]) top();
        if (!DEBUG) {
            translate([-44 - 20, 8 + 5, height + (cover_h / 2 ) - 4.25]) rotate([0, 0, -13]) rotate([0, 90, 0]) back_side();
        }
        translate([2, 49, height + (cover_h / 2 ) - 4.25]) rotate([0, 0, -13]) rotate([90, 0, 0]) top_side();
        translate([-22, -45, height + (cover_h / 2 ) - 4.25]) rotate([0, 0, -13]) rotate([90, 0, 0]) bottom_side();
    }
} 

//DEP
module intval_laser_panel_cover_standoff (DECOYS = false) {
    tight = 0.2;
    cover_h = 21;
    $fn = 40;
    translate ([6, -9, height + 3.5]) {
        difference() {
            cylinder(r = bolt_inner + 1.4, h = cover_h - .5, center = true);
            cylinder(r = bolt_inner - tight, h = cover_h, center = true);
        }
        if (DECOYS) {
                decoys(12, -(cover_h / 2) + 2);
        }
    }
}

module remove_front () {

	translate([87, 0, 4]) rotate([0, 0, 89]) cube([170, 40, 40], center = true);
}
module onetoone (size, height, z) {
	translate ([one_to_one_x, one_to_one_y, z]) {
		cylinder(r = size / 2, h = height, center = true);
	}
}
module m_p_access () {
	translate ([18, -44, 0]) {
		rounded_cube([35, 17, 50], 17, true);
	}
}
module bolex_pin (x, y) {
	in = innerD;
	translate ([x, y, 1]) {
		difference () {
			union () {
				translate([0, 0, (height / 2) - 2]) cylinder(r = (outerD + 4) / 2, h = 4, center = true);
				cylinder(r = outerD / 2, h = height, center = true);
			}
			cylinder(r = in / 2, h = height, center = true);
			translate([0, 0, (height / 2) - 1]) cylinder(r1 =4.5 / 2, r2 = 6.5 / 2, h = 2, center = true);
		}
	}
}
module bolex_pin_inner (x, y) {
	translate ([x, y, 1]) {
		cylinder(r = innerD / 2, h = height * 2, center = true);
		translate([0, 0, (height / 2) - 1]) cylinder(r1 =4.5 / 2, r2 = 6.5 / 2, h = 2, center = true);
	}
}
module intval_pins () {
	for (i = [0 : len(xArray) - 1]) {
		bolex_pin(xArray[i], yArray[i]);
	}
}
module key () {
    tighten = 0.25;
	difference () {
		cylinder(r = 6.7 / 2, h = 5, center = true);
		cylinder(r = (4.76 -+ tighten) / 2, h = 5, center = true);
	}
	translate ([0, 0, -7.5]) {
		cylinder(r = 6.7 / 2, h = 10, center = true);
	}
}
module keyHole () {
	translate ([0, 0, 1.75]) {
		cube([10, 2, 3.5], center = true);
	}
}
module key_end (rotArr = [0, 0, 0], transArr = [0, 0, 0], ALT = false) {
	translate(transArr) {
		rotate (rotArr) {
			difference () {
				key();
				keyHole();
                if (ALT) {
                    translate([-2.5, 0, 1.75]) cube([5, 3, 3.5], center= true);
                }
			}

		}
	}
}
module frame_counter_access () {
	x = 37.5;
	y = 39;
	translate([x, y, 8.5]) {
		difference () {
			union () {
				rotate ([0, 0, 19]) {
					translate([0, 9, 0]) {
						cube([12, 16, 4], center = true);
					}
				}
				rotate ([0, 0, -19]) {
					translate([0, 9, 0]) {
						cube([12, 16, 4], center = true);
					}
				}
			}
			translate([0, 15.5, 0]) {
				cube([17, 6, 4], center = true);
			}
		}
		cylinder(r = 6.2, h = 4, center = true);
	}
}
module bearing (x, y, z, width= 8, hole = true, calval = 0) {
	innerD = 8.05;
	outerD = 22.1;
	fuzz = 0.1;
	translate ([x, y, z]) {
		difference () {
			cylinder(r = outerD / 2 + fuzz + calval, h = width, center = true);
			if (hole) {
				cylinder(r = innerD / 2 - fuzz, h = width, center = true);
			}
		}
	}
}

module key_cap () {
    $fn = 60;
    thickness = .75;
    innerD = 22.5;
	outerD = innerD + (thickness * 2);
    h = 18 - 2.5;
    
    difference () {
        cylinder(r = outerD / 2, h = h, center = true); 
        translate([0, 0, -1.01]) cylinder(r = innerD / 2, h = h - thickness, center = true); 
        //translate([100, 0, 0]) cube([200, 200, 200], center = true);
    }
    //decoys(23, 7);
}

module motor_cap_120 (HALF = false) {
    $fn = 60;
	base_d = 47;
    base_inner = 29;
    inner_h = 57;
    difference () {
        union () {
            translate([-6, 0, 24]) cylinder(r = base_d/2, h = 15, center = true);
            translate([0, 0, inner_h]) cylinder(r=(base_inner / 2) + 3, h=inner_h, center = true); 
        }
        translate([-6, 0, -5.75]) cylinder(r = base_d/2 - 1, h = 50, center = true); //to grip edge of 
        translate([-6, 0, 3]) cylinder(r = base_d/2 - 3, h = 50, center = true);
        translate([-25, 0, 19]) cube([10, 10, 15], center = true); //wire access
        
        //120 motor
        
        translate([0, 0, inner_h - 2]) cylinder(r=base_inner / 2, h=inner_h, center = true); //inner cylinder
        
        if (HALF){
            translate([100, 0, 0]) cube([200, 200, 200], center = true);
        }
    }
}

module bolt_guide () {
    $fn = 80;
    difference () {
        union () {
            cylinder(r = 10 /2, h = 38, center = true);
            translate([0, 0, -(38 / 2) + 1.5]) cylinder(r = 16 /2, h = 3, center = true);
        }
        cylinder(r = 7.5 / 2, h = 40, center = true);
        translate([0, -13, -(38 / 2) + 1.5]) cube([16, 16, 10], center = true);
    }
}

module bearing_calibrate (val = 0) {
    mat = 25.4/8;
    difference () {
        cube([40, 40, mat], center = true);
        bearing(0, 0, 0, hole = false, calval = val);
    }
}

/*
//rpi zero w
translate([-35, -24, 15]) rotate([0, 0, -13]) {
    difference () {
        cube([67, 31, 3], center = true);
        translate([58 / 2, 23 / 2, 0]) cylinder(r = 1.6, h = 3 + 1, center = true, $fn = 20);
        translate([-58 / 2, 23 / 2, 0]) cylinder(r = 1.6, h = 3 + 1, center = true, $fn = 20);
        translate([58 / 2, -23 / 2, 0]) cylinder(r = 1.6, h = 3 + 1, center = true, $fn = 20);
        translate([-58 / 2, -23 / 2, 0]) cylinder(r = 1.6, h = 3 + 1, center = true, $fn = 20);
    }
}
*/