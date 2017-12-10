THREADED_R = 12 / 2;
ROD_R = 13 / 2;

module threaded_rod () {
    $fn = 60;
    length = 30 * 10;
    cylinder(r = THREADED_R, h = length, center = true);
}

translate([45, 0, 0]) rotate([90, 0, 0]) threaded_rod();