# 3D-Plot-Js

**Please note that this is not something stable**

Plots functions and .csv files. Scatterplot is also supported. It will plot using babylon.js. Processing happens client side.

It is written in ES6 syntax and compiled using webpack.

<p align="center">
  <img width="45%" src="https://raw.githubusercontent.com/sezanzeb/3D-Plot-Js/master/scatterplot.png"/>
  <img width="45%" src="https://raw.githubusercontent.com/sezanzeb/3D-Plot-Js/master/planeplot.png"/>
</p>


## Building 3DPlotBundle.js

    npm install
    npm start
    #3DPlotBundle.js is now created in public/3DPlotBundle.js
    firefox public/index.html


## How to Use

first, you need to build. In a console, cd to the project root and use

    npm install
    npm start
    
**Plotting Formulas**

Save the following to a .html file and open it in your browser.

This example is animated because of the interval.

    <canvas id="canvas" style="width:500px; height:500px;"></canvas>
    <script type="text/javascript" src="3DPlotBundle.js"></script>
    <script>
        var plot = new JSPLOT3D.Plot(document.getElementById("canvas"))
        plot.res = 10
        plot.plotFormula("sin(2*x1)*sin(2*x2)")
        var i = 0;
        window.setInterval(function() {
            plot.plotFormula("sin(2*x1+i)*sin(2*x2-i)")
            i += 0.01
        },41.667)
    </script>

**Plotting .csv Files**

Save the following to a .html file and open it in your browser.

Configure the 2nd, 3th, 4th and 5th parameter of plot.plotsvString() to your needs. 2-4 are the three columns from the csv file that serve as dimensions of the datapoints. the 5th parameter is the separator of the .csv file format. Very often it's "," or ";".

    <canvas id="canvas" style="width:500px; height:500px;"></canvas>
    <input id="fileup" type="file"></input>
    <script type="text/javascript" src="3DPlotBundle.js"></script>
    <script>
        var plot = new JSPLOT3D.Plot(document.getElementById("canvas"))
        document.getElementById("fileup").addEventListener("change",function(e)
        {
            let file = e.target.files[0]
            let reader = new FileReader()
            reader.readAsDataURL(file)
            let data = ""

            reader.onload = (function(theFile)
            {
                return function(e)
                {
                    let data = atob(e.target.result.split("base64,")[1])
                    plot.plotCsvString(data,0,1,2,";",true)
                }
            })(file)
        })
    </script>


## Live Example

first, you need to build. In a console, cd to the project root and use

    npm install
    npm start

open public/index.html in your browser for a live example.

Example for f(x1,x2):

    (cos(x1*10+sin(x2*10)))*0.3

    (Math.cos(x1*10)+Math.sin(x2*10))*0.2

    tanh(x1)! ^ (x2 + sqrt(2))*2 + ln(sin(x2) + e)*2 - π*1.1
    //which is converted to:
    Math2.factorial(Math.tanh(x1))**(x2+Math.sqrt(2))*2+Math2.log2(Math.E,Math.sin(x2)+Math.E)*2-Math.PI*1.1

It has to be in JavaScript syntax, but some common functions are also supported in regular mathematical syntax. the ^ XOR Operator does not work anymore this way though

Take "example.csv" in the root directory of this repository or get a .csv dataset (for example on kaggle.com) and upload it to the upload button of the live example. Type in the indices of the .csv file columns that are used as datapoint dimensions. In the last input field that says "sep" type in the .csv separator. e.g. ; or ,

You have to upload the .csv file **afterwards** you typed in the configuration at the moment.

## Todo

- try to do the same in three.js and see what is better suited
- csvplot: interpolate the datapoints for 3D Plane based plots
- csvplot: for missing datapoints in the plane, remove the vertex
- heatmapcolor it according to .csv column or height (for functions)
- make it easy to use as a framework and make a doku for it
- csvplot: display the colums that the csv contains in index.html to make selecting the column indices easier
- add some type checking for the functions to make debugging easier
- create setters and maybe move some of the constructor parameters to those (e.g. colors)
- increase redrawing performance, e.g. by not recreating the basic mesh everytime but rather manipulating the vertices (important for animations by doing timed redraws)
- add axis title and numbers
- on submit csvform plot the scatterplot

**maybe:**
- for recursive formulas, use scatterplot and plot a datapoint everytime f(x1,x2) gets called. Datapoints, that have been calculated already at some point, are already cached (helps to stop recursion overflows and increases performance)
- for recursive formulas, offer some start value setter