module tube(o = 1, i = 0, h = 1, center = false, $fn = 12) {
	$fn = $fn;
	union () {
		difference () {
			cylinder(r = o, h = h, center = center);
			cylinder(r = i,  h = h, center = center);
		}
	}
}

module rounded_cube (cube_arr = [1, 1, 1], d = 0, center = false) {
	off_x = 0;
	off_y = 0;
	r = d/2;
	union () {
		cube([cube_arr[0] - d, cube_arr[1], cube_arr[2]], center = center);
		cube([cube_arr[0], cube_arr[1] - d, cube_arr[2]], center = center);
		translate ([1 * (cube_arr[0] / 2) - r , 1 * (cube_arr[1] / 2)- r, 0]) cylinder(r = r, h = cube_arr[2], center = center);
		translate ([-1 * (cube_arr[0] / 2) + r, -1 * (cube_arr[1] / 2) + r, 0]) cylinder(r = r, h = cube_arr[2], center = center);
		translate ([1 * (cube_arr[0] / 2) - r, -1 * (cube_arr[1] / 2) + r, 0]) cylinder(r = r, h = cube_arr[2], center = center);
		translate ([-1 * (cube_arr[0] / 2) + r, 1 * (cube_arr[1] / 2)- r, 0]) cylinder(r = r, h = cube_arr[2], center = center);
	}
}

module c_battery () {
	/* C Cell battery, 26.1 × 50 */
	x = 26.1;
	x_fuzz = .3;
	y = 50;
	y_fuzz = 2;
	cylinder(r = (x + x_fuzz) / 2, h = y + y_fuzz, center = true);
}

module sub_c_battery () {
	/* Sub C Cell battery, 22.2 × 42.9 */
	x = 22.2;
	x_fuzz = .3;
	y = 42.9;
	y_fuzz = 2;
	cylinder(r = (x + x_fuzz) / 2, h = y + y_fuzz, center = true);
}

module hex (r = 1, h = 1, center = false) {
	cylinder(r = r, h = h, center = center, $fn = 6);
}

module triangle (a = 1, b = 1, c = 1, h = 1, center = false) {
	
}

module cone_45 (d = 1, center = false) {
	cylinder(r1 = d/2, r2 = 0, h = d, center = center);
}

module decoys (d = 10, z = 0, number = 4, cube_size = 4, debug = false) {
        for (i = [0: number]) {
            rotate([0, 0, (360/number) * i]) translate([d, 0, z]) cube([cube_size, cube_size, cube_size], center = true);
            if (debug && i == 0) {
                rotate([0, 0, (360/number) * i]) translate([d, 0, z]) cube([cube_size * 5, cube_size* 5, cube_size], center = true);
            }
        }
}

//////////////////////////////////////////////////////////////////////////////////////////////
// Paraboloid module for OpenScad
//
// Copyright (C) 2013  Lochner, Juergen
// http://www.thingiverse.com/Ablapo/designs
//
// This program is free software. It is 
// licensed under the Attribution - Creative Commons license.
// http://creativecommons.org/licenses/by/3.0/
//////////////////////////////////////////////////////////////////////////////////////////////

module paraboloid (y=10, f=5, rfa=0, fc=1, detail=44){
	// y = height of paraboloid
	// f = focus distance 
	// fc : 1 = center paraboloid in focus point(x=0, y=f); 0 = center paraboloid on top (x=0, y=0)
	// rfa = radius of the focus area : 0 = point focus
	// detail = $fn of cone

	hi = (y+2*f)/sqrt(2); // height and radius of the cone -> alpha = 45° -> sin(45°)=1/sqrt(2)
	x =2*f*sqrt(y/f); // x  = half size of parabola
	
   translate([0,0,-f*fc]) // center on focus 
	rotate_extrude(convexity = 10,$fn=detail ) // extrude paraboild
	translate([rfa,0,0]) // translate for fokus area	 
	difference(){
		union(){ // adding square for focal area
			projection(cut = true) // reduce from 3D cone to 2D parabola
				translate([0,0,f*2]) rotate([45,0,0]) // rotate cone 45° and translate for cutting
				translate([0,0,-hi/2])cylinder(h= hi, r1=hi, r2=0, center=true, $fn=detail); // center cone on tip
			translate([-(rfa+x ),0]) square ([rfa+x , y ]); // focal area square
		}
		translate([-(2*rfa+x ), -1/2]) square ([rfa+x ,y +1] ); 					// cut of half at rotation center 
	}
}

//Spiral Notes
//-------------------------------------------------------------------
//Height = center to center height of the end spheres which form the spirals.  Ends will need to be flattened by the user as desired.  Actual height of the rendering is Height+2*baseRadius
//Radius = the maximum distance from the axis of the spiral (the z axis) to the center of the sphere(s) forming the spiral
//baseRadius = cross sectional radius of the spiral
//frequency = the number of complete revolutions about the axis made by the spiral, whole numbers will result in spirals whose tops end directly above their bases
//resolution = integer number of spheres, not to be confused with $fn.  The greater the number of spheres, the smoother the spiral will be (also longer render times!).  Recommended that this number be 8*frequency or greater.
//numSpirals = integer number of spirals used in the spiralMulti modules spaced evenly around the axis (3 spirals are spaced 120 degrees apart, 4 spirals: 90 degrees apart, etc.) 

//Instructions
//------------------------------------------------------------------
//1. Place spiral.scad in the "libraries" folder of your openscad installation.  Find the libraries folder by File -> Show Library Folder...
//2. Then create a new or open one of your existing scad files and include spiral.scad with the following code:  
//use<spiral.scad>;
//3. Then call the modules in your files with code similar to the following:
//spiral(20,20,3,1,25);
//spiralCone(20,20,3,1,25);
//spiralEllipse(20,20,3,1,25);
//spiralMulti(20,20,3,1,25,3);
//spiralMultiCone(20,20,3,1,25,3);
//spiralMultiEllipse(40,60,3,1,32,3);

//-------------------------------------------------------------
//simple spiral
module spiral (height = 20, Radius = 20, baseRadius = 3, frequency = 1, resolution = 25, $fn=50) {
	union(){
		translate ([0,0,-(height/2)]) {
				for(i=[0:resolution-2]){
					hull(){
						rotate ([0,0,frequency*360/(resolution-1)*i]) translate ([Radius,0,i*height/(resolution-1)]) sphere(r=baseRadius, center=true);
						rotate ([0,0,frequency*360/(resolution-1)*(i+1)]) translate ([Radius,0,(i+1)*height/(resolution-1)]) sphere(r=baseRadius,center=true);
					}
				}
		}
	}
}

//cone spiral
module spiralCone(height=20,Radius=20,baseRadius=3,frequency=1,resolution=25, $fn=50) {
	union(){
		translate ([0,0,-(height/2)]) {
				for(i=[0:resolution-2]){
					hull(){
						rotate ([0,0,frequency*360/(resolution-1)*i]) translate ([Radius-(i-1)*Radius/resolution,0,i*height/(resolution-1)]) sphere(r=baseRadius, center=true);
						rotate ([0,0,frequency*360/(resolution-1)*(i+1)]) translate ([Radius-i*Radius/resolution,0,(i+1)*height/(resolution-1)]) sphere(r=baseRadius,center=true);
					}
				}
		}
	}
}

//ellipse spiral
module spiralEllipse(height=20,Radius=20,baseRadius=3,frequency=1,resolution=25, $fn=50) {
	union(){
		translate ([0,0,-(height/2)]) {
				for(i=[0:resolution-2]){
					hull(){
						rotate ([0,0,frequency*360/(resolution-1)*i]) translate ([Radius*sqrt(1-(i/(resolution-1)*(i/(resolution-1)))),0,i*height/(resolution-1)]) sphere(r=baseRadius, center=true);
						rotate ([0,0,frequency*360/(resolution-1)*(i+1)]) translate ([Radius*sqrt(1-((i+1)/(resolution-1)*((i+1)/(resolution-1)))),0,(i+1)*height/(resolution-1)]) sphere(r=baseRadius,center=true);
					}
				}
		}
	}
}

// Multiple spirals arranged radially around the axis
module spiralMulti(height=20,Radius=20,baseRadius=3,frequency=1,resolution=25,numSpirals=3,$fn=50) {
	shiftAngle=360/numSpirals;
	for(total=[0:numSpirals-1]) {
		union(){
		translate ([0,0,-(height/2)]) {
					for(i=[0:resolution-2]){
						hull(){
							rotate ([0,0,frequency*360/(resolution-1)*i+shiftAngle*total]) translate ([Radius,0,i*height/(resolution-1)]) sphere(r=baseRadius, center=true);
							rotate ([0,0,frequency*360/(resolution-1)*(i+1)+shiftAngle*total]) translate ([Radius,0,(i+1)*height/(resolution-1)]) sphere(r=baseRadius,center=true);
						}
					}
			}
		}
	}
}

// Multiple spirals arranged radially around the axis tapering in towards the axis
module spiralMultiCone(height=20,Radius=20,baseRadius=3,frequency=1,resolution=25,numSpirals=3,$fn=50) {
	shiftAngle=360/numSpirals;
	for(total=[0:numSpirals-1]) {
		union(){
			translate ([0,0,-(height/2)]) {
					for(i=[0:resolution-2]){
						hull(){
							rotate ([0,0,frequency*360/(resolution-1)*i+shiftAngle*total]) translate ([Radius-(i-1)*Radius/resolution,0,i*height/(resolution-1)]) sphere(r=baseRadius, center=true);
							rotate ([0,0,frequency*360/(resolution-1)*(i+1)+shiftAngle*total]) translate ([Radius-i*Radius/resolution,0,(i+1)*height/(resolution-1)]) sphere(r=baseRadius,center=true);
						}
					}
			}
		}
	}
}

//multiple ellipse spiral
module spiralMultiEllipse(height=20,Radius=20,baseRadius=3,frequency=1,resolution=25,numSpirals=3,$fn=50) {
	shiftAngle=360/numSpirals;
	for(total=[0:numSpirals-1]) {
		union(){
			translate ([0,0,-(height/2)]) {
					for(i=[0:resolution-2]){
						hull(){
							rotate ([0,0,frequency*360/(resolution-1)*i+shiftAngle*total]) translate ([Radius*sqrt(1-(i/(resolution-1)*(i/(resolution-1)))),0,i*height/(resolution-1)]) sphere(r=baseRadius, center=true);
							rotate ([0,0,frequency*360/(resolution-1)*(i+1)+shiftAngle*total]) translate ([Radius*sqrt(1-((i+1)/(resolution-1)*((i+1)/(resolution-1)))),0,(i+1)*height/(resolution-1)]) sphere(r=baseRadius,center=true);
						}
					}
			}
		}
	}
} 