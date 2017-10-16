/* live example */

var plot = new JSPLOT3D.Plot(document.getElementById("threecanvas"), {
    backgroundColor:"#293542",
    axesColor:"#ffffff"
})
plot.createLegend(document.getElementById("Legend"))

var data = ""
var cached = false
var fname = ""
var recentplot = function(){} //stores the event that was used recently to plot (formula or csv)
var recentplote = null //so that it can be easily repeated


main()




/**
 * returns the value of a settings input
 * @param {string} id id of the input element that contains a value
 */
function getVal(id)
{
    var elem = document.getElementById(id)

    var value = elem.value

    //boolean
    if(value == "true")
        value = true
    if(value == "false")
        value = false
    
    //undefined by default
    if(value === "")
        value = undefined

    //0xhex
    if(!isNaN(parseFloat(value)))
        if(value.indexOf("0x") == 0)
            value = parseInt(value)

    return value
}



/**
 * returns a json object that contains all the settings. compatible to JsPlot3D
 */
function getOptions()
{

    var mode = getVal("mode")
    var normalizeX1 = getVal("normalizeX1")
    var normalizeX2 = getVal("normalizeX2")
    var normalizeX3 = getVal("normalizeX3")
    var xRes = getVal("xRes")
    var zRes = getVal("zRes")
    var barchartPadding = getVal("barchartPadding")
    var barSizeThreshold = getVal("barSizeThreshold")
    var defaultColor = getVal("defaultColor")
    var hueOffset = getVal("hueOffset")

    var title = getVal("title")
    if(title == undefined)
        title = fname

    var x1title = getVal("x1title")
    var x2title = getVal("x2title")
    var x3title = getVal("x3title")
    var fraction = getVal("fraction")
    var keepOldPlot = getVal("keepOldPlot")
    var colorCol = getVal("colorCol")
    var dataPointSize = getVal("dataPointSize")
    var header = getVal("header")
    var separator = getVal("separator")
    var labeled = getVal("labeled")
    
    return {
        mode,normalizeX1,normalizeX2,
        normalizeX3,xRes,zRes,barchartPadding,
        barSizeThreshold,defaultColor,
        hueOffset,title,x1title,x2title,
        x3title,fraction,keepOldPlot,colorCol,
        dataPointSize,header,separator,
        labeled
    }
}



/**
 * plots a .csv file using the contents of the decodedData variable
 */
//calling it plot() throws an error
function plotcsv()
{
    let x1 = document.getElementById("x1").value
    let x2 = document.getElementById("x2").value
    let x3 = document.getElementById("x3").value
    plot.plotCsvString(data,x1,x2,x3,getOptions())

    //display the dataframes head
    if(plot.getCache().dataframe != undefined)
    {
        let table = plot.getCache().dataframe.slice(0,32)
        for(var i = 0;i < table.length; i++)
        {
            table[i] = "<td>"+table[i].join("</td><td>")+"</td>"
        }
        table = "<tr>"+table.join("</tr><tr>")+"</tr>"
        table = "<table>"+table+"</table>"

        document.getElementById("csvhead").innerHTML = "head of dataframe:<br/><br/>"+table
    }
}



/**
 * entrypoint
 */
function main()
{
    //plot the formula
    var formulaFormSubmit = function(e)
    {
        e.preventDefault()
        cached = false
        recentplot = formulaFormSubmit
        recentplote = e
        var formula = document.getElementById("formulaText").value
        plot.plotFormula(formula, getOptions())
    }


    //plot the csv
    var csvFormSubmit = function(e)
    {
        e.preventDefault()
        recentplot = csvFormSubmit
        recentplote = e
        //read file only if it has changed (event on fileup "change")
        if(!cached)
        {
            let reader = new FileReader()
            let file = document.getElementById("fileup").files[0]
            reader.readAsText(file)
            reader.onload = function(e)
            {
                data = e.target.result
                fname = file.name
                cached = true
                plotcsv()
            }
        }
        else
        {
            console.log("using cached data")
        }
        plotcsv()
    }



    //add those two functions to the event listeners
    //I'm doing this because i want to keep track of the recently used function using recentplot and recentplote
    document.getElementById("formulaForm").addEventListener("submit",function(e){formulaFormSubmit(e)})
    document.getElementById("csvform").addEventListener("submit",function(e){csvFormSubmit(e)})


    document.getElementById("setDimensions").addEventListener("submit",function(e)
    {
        e.preventDefault()
        plot.setDimensions({
            xRes: getVal("xRes"),
            zRes: getVal("zRes"),
            xLen: getVal("xLen"),
            yLen: getVal("yLen"),
            zLen: getVal("zLen")
        })
        recentplot(recentplote)
    })


    document.getElementById("setBackgroundColor").addEventListener("submit",function(e)
    {
        e.preventDefault()
        plot.setBackgroundColor(getVal("backgroundColor"))
    })
    
    
    document.getElementById("setAxesColor").addEventListener("submit",function(e)
    {
        e.preventDefault()
        plot.setAxesColor(getVal("axesColor"))
    })


    //add the filename as string next to the button
    document.getElementById("fileup").addEventListener("change",function(e)
    {
        cached = false
        data = ""
        document.getElementById("fileuplabel").innerHTML = e.target.files[0].name
        document.getElementById("submitcsv").style.display = "inline"
    })



    //repeat the recent plot when hitting enter in the settings form
    document.getElementById("settings").addEventListener("submit",function(e)
    {
        e.preventDefault()
        recentplot(recentplote)
    })
}
