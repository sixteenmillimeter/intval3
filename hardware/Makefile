###################
#
#  intval3 OpenSCAD Makefile
#  
#  Permission is hereby granted, free of charge, to any person obtaining a copy
#  of this software and associated documentation files (the "Software"), to deal
#  in the Software without restriction, including without limitation the rights
#  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#  copies of the Software, and to permit persons to whom the Software is
#  furnished to do so, subject to the following conditions:
#  
#  The above copyright notice and this permission notice shall be included in all
#  copies or substantial portions of the Software.
#  
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
#  SOFTWARE.
#
###################

PREFIX=intval3

OPENSCAD=openscad
OPENSCAD_OPTIONS_STL=--enable sort-stl -D VERBOSE=false
OPENSCAD_OPTIONS_DXF=-D VERBOSE=false

STL=./stl
DXF=./dxf
MODELS=$(shell bash ./parseVars.sh MODEL)
LASER=$(shell bash ./parseVars.sh LASER)

all:	directories models

directories:
	mkdir -p $(STL) $(DXF)

models: directories $(MODELS) $(LASER)

clean:
	rm -f $(STL)/$(PREFIX)_*

cleanall:
	rm -rf $(STL)

# Dependencies for models

$(MODELS) : $(STL)/$(PREFIX)_%.stl : $(PREFIX).scad
	$(OPENSCAD) $(OPENSCAD_OPTIONS_STL) -o $@ -D MODEL=\"$(subst $(PREFIX)_,,$(subst .stl,,$(@F)))\" $<

$(LASER) : $(DXF)/$(PREFIX)_%.dxf : $(PREFIX).scad
	$(OPENSCAD) $(OPENSCAD_OPTIONS_DXF) -o $@ -D LASER=\"$(subst $(PREFIX)_,,$(subst .dxf,,$(@F)))\" $<