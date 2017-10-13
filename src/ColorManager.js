export default class ColorManager
{
    /**
     * handles a few color related tasks
     * @param {object} THREE three.js framework object. TODO make a better description on how to get this object 
     */
    constructor(THREE)
    {
        this.THREE = THREE
    }


    /**
     * converts a number to a heat color
     * @param {number} value the value that should be converted to a heat color
     * @param {number} min maximum value present in your dataframe. Default -1
     * @param {number} max minimum value present in your dataframe. Default 1
     * @return THREE.Color object
     */
    convertToHeat(value,min=-1,max=1)
    {
        //set color boundaries so that the colors are heatmap like
        let upperColorBoundary = 0 //equals red //what the highest value will get
        let lowerColorBoundary = 0.7 //equals blue with a faint purple tone //what the lowest value will get

        value = parseFloat(value)
        value = (value-min)/(max-min) //normalize

        //heatmap
        //make sure all the colors are within the defined range
        value = value * (1 - lowerColorBoundary - (1-upperColorBoundary)) + lowerColorBoundary
        
        //return that color
        return new this.THREE.Color(0).setHSL(value,0.95,0.55)
    }

    
    /**
     * returns dfColors. An array, indexes are the same as the vertices of the
     * scatterplot in the geometry.vertices array. dfColors contains this.THREE.Color objects
     * (supports numbers or color strings (0x...,"#...","rgb(...)","hsl(...)"))
     * The parameters have the same names as in JsPlot3D.js. Just forward them to this function
     * @param {boolean} filterColor wether or not numbers should be filtered to a headmap
     * @return An array, indexes are the same as the vertices of the scatterplot in the geometry.vertices array. it contains this.THREE.Color objects
     */
    getColorMap(df,colorCol,defaultColor,labeled,header,filterColor=true)
    {
        let numberOfLabels = 0
        //let numberOfLabels = df.length
        //the color gets divided by (1-1/numberOfLabels) so that red does not appear twice.
        //e.g. 3 labels would be red, turqoise, red. if numberOfLabels would get initialized with 0, that formula would diverge to -inf
        //1 would make that term zero, so that the color would diverge to inf. a high number converges that term to 1, so the color won't be touched

        //take care that all the labels are numbers
        let map = {}
        let labelColorMap = {} //store label names together with the used color
        let dfColors = new Array(df.length) //array of numbers that contain the individual color information of the datapoint as a number (which is going to be normalized later)

        //also normalize the colors so that I can do hsl(clr/clrMax,100%,100%)
        //no need to check if it's numbers or not, because dfColors carries only numbers
        //Assume the first value. No worries about wether or not those are actually numbers, because if not the script below will take care
        let clrMax
        let clrMin
        //the following function just updates clrMax and clrMin, only available within the function that wraps this (getColorMap(...))
        let findHighestAndLowest = (value) =>
        {
            if(filterColor && colorCol != -1)
            {
                if(value > clrMax)
                    clrMax = value
                if(value < clrMin)
                    clrMin = value
            }
        }

        //now take care about if the user says it's labeled or not, if it's numbers, hex, rgb, hsl or strings
        //store it inside dfColors[i] if it (can be converted to a number)||(is already a number)

        //parameter. Does the dataset hold classes/labels?
        if(colorCol != -1) //does the user even want colors?
        {
            if(labeled) //get 0.6315 from 2.6351 or 0 from 2. this way check if there are comma values
            {

                //------------------------//
                //     string labeled     //
                //------------------------//
                //e.g. "group1" "group2" "tall" "small" "0" "1" "flower" "tree"

                if(df[0][colorCol].indexOf("rgb") == 0 ||
                df[0][colorCol].indexOf("hsl") == 0 ||
                (df[0][colorCol].indexOf("#") == 0 && df[0][colorCol].length == 7))
                {
                    console.warn(df[0][colorCol]+" might be a color. \"labeled\" is set true. For the stored colors to show up, try \"labeled=false\"")
                }
                clrMax = 0 //assume 0
                clrMin = 0 //assume 0
                //count to ammount of labels here
                let label = ""
                for(let i = 0; i < df.length; i++)
                {
                    label = df[i][colorCol] //read the label/classification
                    if(map[label] == undefined) //is this label still unknown?
                    {
                        map[label] = numberOfLabels //map it to a unique number
                        numberOfLabels ++ //make sure the next label gets a different number
                    }
                    //copy the labels to dfColors as numbers
                    dfColors[i] = parseFloat(map[label])
                    findHighestAndLowest(dfColors[i]) //update clrMin and clrMax
                }

                //how much distance between each hue:
                let hueDistance = 1/(numberOfLabels)
                for(let i = 0; i < dfColors.length; i++)
                {
                    dfColors[i] = new this.THREE.Color(0).setHSL(dfColors[i]*hueDistance,0.95,0.55)
                    labelColorMap[df[i][colorCol]] = dfColors[i] //store the label name together with the color
                }

                //CASE 1 dfColors now contains labels
                return {labelColorMap,dfColors}
            }
            else
            {

                //------------------------//
                //       color code       //
                //------------------------//
                //#, rgb and hex

                //if it is a string value
                if(isNaN(parseInt(df[0][colorCol])))
                {
                    filterColor = false //don't apply normalization and heatmapfilters to it

                    //try to extract color information from the string
                    if(df[0][colorCol].toLowerCase().indexOf("rgb") == 0)
                    {
                        for(let i = 0; i < df.length; i++)
                        {
                            //remove "rgb", brackets and split it into an array of [r,g,b]
                            let rgb = df[i][colorCol].substring(4,df[i][colorCol].length-1).split(",")
                            dfColors[i] = new this.THREE.Color(0).setRGB(rgb[0],rgb[1],rgb[2])
                        }
                    }
                    else if(df[0][colorCol].toLowerCase().indexOf("#") == 0)
                    {
                        //hex strings are supported by three.js right away
                        for(let i = 0; i < df.length; i++)
                            dfColors[i] =  new this.THREE.Color(df[i][colorCol])
                    }
                    else if(df[0][colorCol].toLowerCase().indexOf("hsl") == 0) 
                    {
                        for(let i = 0; i < df.length; i++)
                        {
                            //remove "hsl", brackets and split it into an array of [r,g,b]
                            let hsl = df[i][colorCol].substring(4,df[i][colorCol].length-1).split(",")
                            dfColors[i] = new this.THREE.Color(0).setHSL(hsl[0],hsl[1],hsl[2])
                        }
                    }
                    else
                    {
                        //nothing worked, print a warning

                        console.warn("the column that is supposed to hold the color information (index "+colorCol+") contained an unrecognized "+
                            "string (\""+df[0][colorCol]+"\"). \"labeled\" is set to "+labeled+", \"header\" is set to "+header+" (might be false "+
                            "because plotCsvString() already removed the headers). Possible formats for this column are numbers, hex values "+
                            "\"#123abc\", rgb values \"rgb(r,g,b)\", hsl values \"hsl(h,s,l)\". Now assuming labeled = true and restarting.")

                        //restart. Tell the Plot class to restart
                        return -1
                    }

                    //CASE 2 dfColors now contains colors created from RGB, # and HSL strings
                    return {labelColorMap,dfColors}
                }
                else
                {
                    //------------------------//
                    //         number         //
                    //------------------------//
                    //examples: 0x3a96cd (3839693) 0xffffff (16777215) 0x000000 (0)

                    //it's a number. just copy it over and filter it to a heatmap
                    clrMax = df[0][colorCol] //assume the first value
                    clrMin = df[0][colorCol] //assume the first value
                    for(let i = 0; i < df.length; i++)
                    {
                        dfColors[i] = parseFloat(df[i][colorCol])
                        if(!filterColor)
                            dfColors[i] = parseInt(df[i][colorCol])
                        else
                            findHighestAndLowest(dfColors[i]) //update clrMin and clrMax
                    }

                    //This is just a preparation for CASE 3 and CASE 4
                }
            }

            //manipulate the color
            if(filterColor) //if filtering is allowed (not the case for rgb, hsl and #hex values)
            {
                //now apply the filters and create a THREE color from the information stored in dfColors
                for(let i = 0;i < df.length; i++)
                {
                    let color = dfColors[i]
                    //store that color
                    dfColors[i] = this.convertToHeat(color,clrMin,clrMax)
                }
                
                //CASE 3 dfColors now contains a heatmap
                return {labelColorMap,dfColors}
            }
            else
            {
                for(let i = 0;i < df.length; i++)
                {
                    let color = dfColors[i]
                    //store that color
                    dfColors[i] = this.getColorObjectFromAnyString(color)
                }

                //CASE 4 dfColors now contains many colors, copied from the dataframe
                return {labelColorMap,dfColors}
            }
        }
        else
        {
            //colorCol is -1
            for(let i = 0; i < df.length; i++)
                dfColors[i] = this.getColorObjectFromAnyString(defaultColor)
                
            //CASE 5 dfColors now contains all the same color
            return {labelColorMap,dfColors}
        }
    }



    /**
     * converts the param color to a this.THREE.Color object
     * @param {any} color examples: "rgb(0,0.5,1)" "hsl(0.3,0.4,0.7)" 0xff6600 "#72825a" 
     */
    getColorObjectFromAnyString(color)
    {
        if(typeof(color) == "number")
            return new this.THREE.Color(color) //number work like this: 0xffffff = 16777215 = white. 0x000000 = 0 = black
            //numbers are supported by three.js by default

        if(typeof(color) != "number" && typeof(color) != "string")
            return console.error("getColorObjectFromAnyString expected String or Number as parameter but got "+typeof(color))

        if(color.toLowerCase().indexOf("rgb") == 0)
        {
            //remove "rgb", brackets and split it into an array of [r,g,b]
            let rgb = color.substring(4,color.length-1).split(",")
            return new this.THREE.Color(0).setRGB(rgb[0],rgb[1],rgb[2])
        }
        else if(color.toLowerCase().indexOf("#") == 0)
        {
            //hex strings are supported by three.js right away
            return new this.THREE.Color(color)
        }
        else if(color.toLowerCase().indexOf("hsl") == 0) 
        {
            //remove "hsl", brackets and split it into an array of [r,g,b]
            let hsl = color.substring(4,color.length-1).split(",")
            return new this.THREE.Color(0).setHSL(hsl[0],hsl[1],hsl[2])
        }
        return undefined
    }
}