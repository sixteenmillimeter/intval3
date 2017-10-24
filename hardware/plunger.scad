include <./modules.scad>
include <./variables.scad>

module plunger () {
        $fn = 60;
        FINGER = 39;
        CYL_D = 9;
        WALL = 3;
    difference () {
        union () {
            cylinder(r1 = CYL_D, r2 = CYL_D - 1, h = 30, center = true); //outer cylinder
            difference () {
                translate([0, 0, -9]) rotate([90, 0, 0]) rounded_cube([50, 12, 10], d = 5, center = true);
                translate([23, 0, 9]) rotate([90, 0, 0]) cylinder(r = FINGER/2, h = 20, center = true);
                translate([-23, 0, 9]) rotate([90, 0, 0]) cylinder(r = FINGER/2, h = 20, center = true);
            }
        }
        translate([0, 0, 2]) cylinder( r = CYL_D - WALL,  h = 30, center = true); //inner cylinder
        cylinder(r = 7/2, h = 50, center = true); // button hole
        
    }
    
    //cylinder(r= 5, h = 50, center = true); button
}

module plunger_top () {
    $fn = 60;
    CYL_D = 9;
    WALL = 3;
    
    difference () {
        union () {
            cylinder(r = CYL_D - WALL - 0.015, h =6, center = true);
            translate([0, 0, 2]) cylinder (r = CYL_D - 1, h = 2, center = true);
        }
        translate([0, 0, -2]) cylinder(r = CYL_D - WALL - 0.015 - 1, h =6, center = true);
        //cylinder(r = 3/2, h = 50, center = true); // wire
        cylinder(r = 3.9/2, h = 50, center = true); //3.5mm wire
    }
}

module plunger_plate () {
    translate([40, 0, -12]) rotate([180, 0, 0]) plunger_top();
    plunger();
        
    //decoys
    /*translate([44,20,-13]) cube([4, 4, 4], center = true);
    translate([44,-20,-13]) cube([4, 4, 4], center = true);
    translate([-23,20,-13]) cube([4, 4, 4], center = true);
    translate([-23,-20,-13]) cube([4, 4, 4], center = true);*/
}