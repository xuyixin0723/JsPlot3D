import * as THREE from "three"
import * as NORMLIB from "../NormalizationLib.js"


/**
 * called from within JsPlot3D.js class plot
 * @param {object} parent this
 * @param {object} df df
 * @param {object} colors {dfColors, hueOffset}
 * @param {object} columns {x1col, x2col, x3col}
 * @param {object} normalization {normalizeX1, normalizeX2, normalizeX3, x1frac, x2frac, x3frac, minX1, minX2, minX3, maxX1, maxX2, maxX3}
 * @param {object} appearance {keepOldPlot, barchartPadding, barSizeThreshold, dataPointSize}
 * @param {object} dimensions {xLen, yLen, zLen}
 * @private
 */
export default function scatterplot(parent, df, colors, columns, normalization, appearance, dimensions)
{

    //---------------------//
    //      parameters     //
    //---------------------//

    let dfColors = colors.dfColors
    
    let x1col = columns.x1col
    let x2col = columns.x2col
    let x3col = columns.x3col
    
    let x1frac = normalization.x1frac
    let x2frac = normalization.x2frac
    let x3frac = normalization.x3frac
    
    let minX1 = normalization.minX1
    let minX2 = normalization.minX2
    let minX3 = normalization.minX3

    let maxX1 = normalization.maxX1
    let maxX2 = normalization.maxX2
    let maxX3 = normalization.maxX3

    let normalizeX1 = normalization.normalizeX1
    let normalizeX2 = normalization.normalizeX2
    let normalizeX3 = normalization.normalizeX3
    
    let keepOldPlot = appearance.keepOldPlot
    let dataPointSize = appearance.dataPointSize

    let xLen = dimensions.xLen
    let yLen = dimensions.yLen
    let zLen = dimensions.zLen



    //--------------------//
    //      Recycling     //
    //--------------------//

    // dispose the old mesh if it is not used/valid anymore
    let isItValid = parent.IsPlotmeshValid("scatterplot")
    if(!keepOldPlot || !isItValid)
    {
        parent.disposePlotMesh()
        parent.plotmesh = new THREE.Group()
        parent.plotmesh.name = "scatterplot"
        parent.SceneHelper.scene.add(parent.plotmesh)
    }



    // laod the recently used material from the cache. Maybe that's already enough
    // if not, make a copy and modify it (happens later)
    let material = parent.oldData.scatterMaterial
    // if the material is not yet existant, create from scratch
    // no need to check if it is the right material, because it was lodaded from oldData.scatterMaterial
    if(!material)
    {
        // base64 created using tools/getBase64.html and tools/sprite.png
        let circle = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAQMAAACQp+OdAAAABlBMVEUAAAD///+l2Z/"+
        "dAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfhChkUDA4mTwuUAAAAHWlUWHR"+
        "Db21tZW50AAAAAABDcmVhdGVkIHdpdGggR0lNUGQuZQcAAACJSURBVCjPvZK7DcAgDESJUlAyAqMwGhktozACJUWEE+fQORJSlCp"+
        "ueJI/wnd27hHpwLuK7DcEkYqMCHJyxShBkVcoqEV1VGhoQltW6KNb+xfAhjE6iOABxSAAqkEENIMEON4gA/of8OU/8xbzprMas2I"+
        "Uk/Ka4LSAptAmGkcraa7ZzQPgSfBIECf/CnPyltYpaAAAAABJRU5ErkJggg=="

        let datapointSprite = new THREE.TextureLoader().load(circle)
        datapointSprite.needsUpdate = true
        datapointSprite.magFilter = THREE.NearestFilter
        datapointSprite.minFilter = THREE.NearestFilter

        material = new THREE.PointsMaterial({
            size: dataPointSize,
            map: datapointSprite,
            transparent: true,
            alphaTest: 0.5,
            vertexColors: THREE.VertexColors,
            sizeAttenuation: true,
        })

        parent.oldData.scatterMaterial = material
    }



    // group is parent.plotmesh, which is of type group
    // it contains all the meshes that are being displayed using sprites
    let group = parent.plotmesh
    let newestChildren = group.children[parent.plotmesh.children.length-1]
    let geometry, position, color
    // is the buffer of the most recently used object full?
    let isBufferFull = newestChildren && newestChildren.geometry.attributes.position.realCount >= newestChildren.geometry.attributes.position.count

    // but if an attribute of the material has to be differnet for the new dataframe, it has to be recreated
    if(isBufferFull || !newestChildren || material.size != dataPointSize)
    {
        // updated the size first (which modifies the material in parent.oldData.scatterMaterial),
        // so that next time the material in parent.oldData might be reused
        material.size = dataPointSize
        // now create a copy so that when the size in parent.oldData.scatterMaterial is changed the previously created sprites are not affected
        material = material.clone()
        
        // create a new geometry
        let buffer = createBuffer(df.length * 10)
        geometry = buffer.geometry
        color = buffer.color
        position = buffer.position
        geometry.addAttribute("position", position)
        geometry.addAttribute("color", color)
        group.add(new THREE.Points(geometry, material))

    }
    else
    {

        // bufferedGeometrys (which is how geometries work internally)
        // can only be updated but not changed in size. Or they can be created from scratch and added to the overall group
        // https://threejs.org/docs/#manual/introduction/How-to-update-things

        // it's not clear to this point if there even is a mesh available
        // the code might be at this place because the material seemed to be valid. but the meshes might have been disposed and an empty group was created
        if(group.children.length != 0)
        {
            // both material and plotmesh are valid, just use the recently created material
            geometry = group.children[group.children.length-1].geometry
            color = geometry.attributes.color
            position = geometry.attributes.position
        }
        else
        {
            // created the plotmesh and the material is valid, but no children have been appended yet?
            let buffer = createBuffer(df.length * 10)
            geometry = buffer.geometry
            color = buffer.color
            position = buffer.position
            geometry.addAttribute("position", position)
            geometry.addAttribute("color", color)
            group.add(new THREE.Points(geometry, material))
        }

    }



    //-------------------//
    //      Filling      //
    //-------------------//

    // add the dataframe to the positions and colors
    for(let i = 0; i < df.length; i ++)
    {
        // todo what about invalid vertex in buffer geometries?
        let j = i + position.realCount

        position.array[j*3] = df[i][x1col]
        position.array[j*3+1] = df[i][x2col]
        position.array[j*3+2] = df[i][x3col]

        color.array[j*3] = dfColors[i].r
        color.array[j*3+1] = dfColors[i].g
        color.array[j*3+2] = dfColors[i].b
    }
    // write down where the overwriting of the buffer can continue
    position.realCount += df.length

    // finish
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true




    //--------------------//
    //     Normalizing    //
    //--------------------//

    if(normalizeX1)
    {
        let newDataMax = NORMLIB.getMinMax(df, x1col, parent.oldData, keepOldPlot, minX1, maxX1)
        minX1 = newDataMax.min
        maxX1 = newDataMax.max
    }

    if(normalizeX2)
    {
        let newDataMax = NORMLIB.getMinMax(df, x2col, parent.oldData, keepOldPlot, minX2, maxX2)
        minX2 = newDataMax.min
        maxX2 = newDataMax.max
    }

    if(normalizeX3)
    {
        let newDataMax = NORMLIB.getMinMax(df, x3col, parent.oldData, keepOldPlot, minX3, maxX3)
        minX3 = newDataMax.min
        maxX3 = newDataMax.max
    }

    x1frac = Math.abs(maxX1-minX1)
    if(x1frac === 0) x1frac = 1 // prevent division by zero

    x2frac = Math.abs(maxX2-minX2)
    if(x2frac === 0) x2frac = 1

    x3frac = Math.abs(maxX3-minX3)
    if(x3frac === 0) x3frac = 1
    
    parent.plotmesh.scale.set(xLen/x1frac,yLen/x2frac,zLen/x3frac)
    parent.plotmesh.position.set(-minX1/x1frac*xLen,-minX2/x2frac*yLen,-minX3/x3frac*zLen)



    //-------------------//
    //     Returning     //
    //-------------------//

    // return by using pointers
    normalization.minX1 = minX1
    normalization.maxX1 = maxX1

    normalization.minX2 = minX2
    normalization.maxX2 = maxX2

    normalization.minX3 = minX3
    normalization.maxX3 = maxX3
        
    normalization.x1frac = x1frac
    normalization.x2frac = x2frac
    normalization.x3frac = x3frac
    
    parent.benchmarkStamp("made a scatterplot")
}



/**
 * @param {number} size of the buffer
 * @return {object} {geometry, color, position}. color and position are both of type THREE.Float32BufferAttribute
 */
function createBuffer(size)
{
    let geometry = new THREE.BufferGeometry()
    // initialize with a larger size than neccessarry at this point so that i can add new vertices to the geometry
    let position = new THREE.Float32BufferAttribute(new Float32Array(size * 3), 3)
    for(let i = 0;i < position.array.length; i++)
    {
        // move it out of the viewport
        position.array[i] = Number.MAX_SAFE_INTEGER
    }
    position.realCount = 0
    let color = new THREE.Float32BufferAttribute(new Float32Array(size * 3), 3)
    position.dynamic = true
    color.dynamic = true
    return {geometry, color, position}
}