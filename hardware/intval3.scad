include <./case.scad>
include <./mount.scad>
include <./plunger.scad>
/*

 INTVAL 3 

*/

module stl_plate () {
    //translate([0, 0, -0.5]) cube([150, 150, 1], center = true);
    translate([-60, 10, 7.5]) rotate([0, 180, 0]) intval_laser_standoffs_plate();
    translate([-27, 50, -9.5]) rotate([0, 0, 13]) translate([-40 + 2, -1, 14]) rotate([0, 0, -13]) l289N_mount();
    
    translate([23, 1, -5.75]) rotate([0, 0, 90]) motor_mount_bottom();
    translate([48, -13, 9]) rotate([0, 180, 0]) key_cap();
    translate([-5, -11, 3]) rotate([0, 0, 190]) geared_motor_mount_120();
    translate([65, 44, 26.5]) rotate([0, 180, 0]) motor_key_120();
    translate([15, -42, 15]) plunger_plate();
    translate([-52, -20, 85.5]) rotate([0, 180, -90]) motor_cap_120(false);
};

module dxf_plate () {
    translate([125, 0, 0]) rotate([0, 0, 13]) projection() intval_panel_laser();
    rotate([0, 0, 13]) intval_laser_panel_cover(LASER=true, ALL_RED=true);
};

module exploded_view () {
    intval_panel_laser();
    translate([0, 0, 5]) translate([-40 + 2, -1, 14]) rotate([0, 0, -13]) l289N_mount();
    translate([0, 0, 5]) motor_mount_bottom();
    translate([0, 0, 20]) motor_key_120();
    translate([one_to_one_x, one_to_one_y, 50]) geared_motor_mount_120();
    translate([one_to_one_x, one_to_one_y, 50]) motor_cap_120(false);
    translate([0, 0, 60]) intval_laser_panel_cover(false, ALL_RED=true);
}


//bolex_pin_laser(0, 0);
//intval_laser_standoffs_plate();
//intval_electronics_mount("METRO");
//motor_mount_bottom();
//projection () intval_panel_laser();
//intval_laser_panel_cover(true, ALL_RED=true);
//rotate([0, 0, 13]) intval_panel_laser();
//rotate([0, 0, 13]) intval_laser_panel_cover();
//key_cap();
//geared_motor_mount_120();
//motor_key();
//motor_key_120();
//plunger_plate();
//plunger();
//rotate([0, 180, 0]) plunger_top();
//motor_cap(false);
//rotate([0, 180, 0]) motor_cap_120(false);
//translate([0, 0, 39 / 2 + 5.75]) bolt_guide();

//exploded_view();
stl_plate();
//dxf_plate();