/*
  Data structure notes
  --------------------
  Map:
  * json.maps[m].graphics[g].layer=='map'
  Map Graphics:
  * json.maps[m].graphics[g].layer=='objects'
  * json.maps[m].graphics[g].layer=='gmlayer'
  
  Characters (Monsters):
  * json.maps[m].graphics[g].represents!=''

*/

$(function() {
  $("input:file").change(function (event){
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    fileName = event.target.files[0].name;
    reader.readAsText(event.target.files[0]);
    reader = null;
  });
});

function getExtn(src){
  var extn='png';
  if (src.indexOf('.png')==-1){
    extn='jpg';    
  }
  return extn;
}

function encodeXML(str){
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

var json;
var fileName;
var hideCharacterObjects=true;
var hideMapsWithoutWalls=false;
var imageCount = 0;
var imagesLoaded = 0;

var maxZipWidth=4096.0;
var maxZipHeight=4096.0;

function onReaderLoad(event){
  json = JSON.parse(event.target.result);
  console.log("JSON Loaded");
  
  hideCharacterObjects = (document.getElementById('hideCharacterObjects').checked==true);
  hideMapsWithoutWalls = (document.getElementById('hideMapsWithoutWalls').checked==true);
  
  //Reset image count
  imageCount = 0;
  imagesLoaded = 0;
  
  //Scaling (Display)
  var maxDisplayWidth=1000.0;
  var sfd=1.0;

  //Scaling (Zip)
  var sfz=1.0;
  
  var mapWidth=0.0;
  var mapHeight=0.0;
  var mapName='';
  var mapImageSrc='';
  var outDiv = document.getElementById('output');
  var doorColour = '';
  
  outDiv.innerHTML='';
  var module = document.getElementById('module');
  
  var moduleName = fileName.replace(/.json/,'');
  module.value = '<name>'+encodeXML(moduleName)+'</name>';
  module.value += '<slug>'+encodeXML(moduleName.toLowerCase().replace(/ /g,'-'))+'</slug>';
  module.value += '<category>adventure</category>';
  module.value += '<author>Roll 20</author>';
  
  for (var m = 0; m < json.maps.length; m++) {
    var hasWalls=false;
    if (json.maps[m].paths.length>0){
      hasWalls = true;
    }
    if (hideMapsWithoutWalls && !hasWalls){
      continue;
    }
    mapName = json.maps[m].attributes.name;
    console.log('--------------------------');
    console.log('Map [id:'+m+'] - ' + mapName);

    //Map layer meta
    mapWidth =0.0;      
    for (var g=0;g<json.maps[m].graphics.length;g++){
      if (json.maps[m].graphics[g].layer=='map'){
        var tempWidth = json.maps[m].graphics[g].width;
        if (tempWidth>mapWidth){ //May be multiple map layers with thumbnails, take the largest
          mapWidth = json.maps[m].graphics[g].width;
          mapHeight = json.maps[m].graphics[g].height;
          mapImageSrc = json.maps[m].graphics[g].imgsrc.replace(/med.|thumb./,'original.');
        } 
      } 
    }
          
    if (mapWidth>maxDisplayWidth){
      sfd=maxDisplayWidth/mapWidth;
    } else {
      sfd=1.0;
    }
    
    if ((mapWidth>=mapHeight) && mapWidth>maxZipWidth){
      sfz=maxZipWidth/mapWidth;
    } else if ((mapHeight>mapWidth) && mapHeight>maxZipHeight) {
      sfz=maxZipHeight/mapHeight;
    } else {
      sfz=1.0;
    }
    
    outDiv.innerHTML+='<div class="mapWrapper"><h4>'+mapName+'</h4><div id="map'+m+'" class="map"><img id="bgmap'+m+'" class="background" alt="'+mapName+'" crossorigin="anonymous" src="'+mapImageSrc+'" width="'+mapWidth*sfd+'px" height="'+mapHeight*sfd+'px"/></div></div>';
    var mapDiv = document.getElementById('map'+m);      

    var moduleText = '<map>';
    moduleText += '<name>'+encodeXML(mapName)+'</name>';
    
    var feetPerGrid = json.maps[m].attributes.scale_number;
    var gridSize = (1.0/feetPerGrid)*350.0
    
    moduleText += '<gridSize>'+Math.round(gridSize)+'</gridSize>';
    if (sfz==1.0){
      moduleText += '<image>'+encodeXML(mapName)+'.'+getExtn(mapImageSrc)+'</image>';
    } else {
      moduleText += '<image>'+encodeXML(mapName)+'.png</image>';
    }
    if (hasWalls){
      moduleText += '<canvas>'+encodeXML(mapName)+'.svg</canvas>';
      moduleText += '<lineOfSight>YES</lineOfSight>';
    }
    
    //Graphic Objects
    for (var g=0;g<json.maps[m].graphics.length;g++){
      if (json.maps[m].graphics[g].layer=='objects' || json.maps[m].graphics[g].layer=='gmlayer' || json.maps[m].graphics[g].layer=='walls'){
        var left = json.maps[m].graphics[g].left;
        var top = json.maps[m].graphics[g].top; 
        var width = json.maps[m].graphics[g].width;
        var height = json.maps[m].graphics[g].height;
        var title = json.maps[m].graphics[g].name;
        var id = 'graphic_m'+m+'_'+json.maps[m].graphics[g].layer+'_g'+g;
        var isCharacter = json.maps[m].graphics[g].represents!='';
        var tileSrc = json.maps[m].graphics[g].imgsrc.replace(/med.|thumb./,'original.'); 
        
        var isLight=false;
        if (json.maps[m].graphics[g].light_otherplayers==true && !isCharacter){
          isLight=true;
        }
        
        if (json.maps[m].graphics[g].layer=='walls' && hasLight){
          isLight = true;
          tileSrc = 'img/Trans1x1.png';
        }
        
        if (!isLight && (json.maps[m].graphics[g].light_otherplayers==true)){
          console.log('%cLight? :'+title +' - '+ id,'background:#ff06');
        }
        
        if (hideCharacterObjects && isCharacter){
          //Probably a character/monster. Ignore.            
        } else {
          if (title==''){
            title = id;
          }
          var hasLight=false;
          
          if (json.maps[m].graphics[g].light_radius!=''){
            hasLight=true;
          }
          
          var cssClass='tile';
          if (hasLight){
            cssClass += ' light';
          }
          if (json.maps[m].graphics[g].layer=='objects' || isLight ){
            cssClass += ' layer-objects';
          } else if (json.maps[m].graphics[g].layer=='gmlayer'){
            cssClass += ' layer-dm';
          } else {
            cssClass += ' layer-misc';           
          }
          
          var style = 'position:absolute;left:'+(left-json.maps[m].graphics[g].width/2)*sfd+'px;top:'+(top-json.maps[m].graphics[g].height/2)*sfd+'px;width:'+width*sfd+'px;height:'+height*sfd+'px;';
          mapDiv.innerHTML += '<img style="'+style+'" id="'+id+'" class="'+cssClass+'" title="'+title+'" crossorigin="anonymous" src="'+tileSrc+'"/>';
          //Tile
          moduleText += '<tile>';
          moduleText += '<x>'+Math.round(left*sfz)+'</x>';
          moduleText += '<y>'+Math.round(top*sfz)+'</y>';
          moduleText += '<width>'+Math.round(width*sfz)+'</width>';
          moduleText += '<height>'+Math.round(height*sfz)+'</height>';
          moduleText += '<opacity>1.0</opacity>';
          
          if (json.maps[m].graphics[g].layer=='objects' || isLight){
            moduleText += '<layer>object</layer>';
          }
          if (json.maps[m].graphics[g].layer=='gmlayer'){
            moduleText += '<layer>dm</layer>';
          }
          /*
          if (isLight){
            moduleText += '<layer>object</layer>';
          } else {
            moduleText += '<layer>dm</layer>';
          }*/
          
          moduleText += '<locked>YES</locked>';
          moduleText += '<asset>';
            moduleText += '<name>'+encodeXML(title)+'</name>';
            moduleText += '<type>image</type>';
            moduleText += '<resource>'+encodeXML(id)+'.'+getExtn(tileSrc)+'</resource>';
          moduleText += '</asset>';
          if (hasLight){
            moduleText += '<light>';
              moduleText += '<enabled>YES</enabled>';
              moduleText += '<radiusMin>'+Math.round(json.maps[m].graphics[g].light_dimradius)+'</radiusMin>';
              moduleText += '<radiusMax>'+Math.round(json.maps[m].graphics[g].light_radius)+'</radiusMax>';
              moduleText += '<alwaysVisible>NO</alwaysVisible>';
              moduleText += '<color>#ffffff</color>';
              moduleText += '<opacity>0.5</opacity>';
            moduleText += '</light>';
          }
          moduleText += '</tile>';
        }
      } else {
        //console.log(g+' '+json.maps[m].graphics[g].layer);
      }
    }
    
    //Assume door colour is the least used line colour
    var lineColours = {}
    for (var p=0;p<json.maps[m].paths.length;p++){
      var colour = json.maps[m].paths[p].stroke;
      if (lineColours[colour]==null){
        lineColours[colour]=1;
      } else {
        lineColours[colour]=lineColours[colour]+1;
      }
    }
    
    if (Object.keys(lineColours).length>1){
      var lineCount=Number.MAX_SAFE_INTEGER; 
      for (var colour in lineColours){
        if (lineColours[colour]<lineCount){
          doorColour=colour;
          lineCount = lineColours[colour]; 
        }
      }
      console.log('Auto door colour: '+doorColour+' - Line Count:'+lineColours[doorColour]);
    }
    
    //Paths
    if (hasWalls){
      var svgXML='<svg id="svg'+m+'" xmlns="http://www.w3.org/2000/svg" version="1.0" width="'+mapWidth*sfd+'" height="'+mapHeight*sfd+'" viewBox="0 0 '+(mapWidth*sfz)+' '+(mapHeight*sfz)+'">';
      for (var p=0;p<json.maps[m].paths.length;p++){
        var pLeft = json.maps[m].paths[p].left;
        var pTop = json.maps[m].paths[p].top;
        var pWidth = json.maps[m].paths[p].width;
        var pHeight = json.maps[m].paths[p].height; 
        var pClass = json.maps[m].paths[p].layer;
        if (pClass=='walls'){pClass='wall';}
        var pStroke = json.maps[m].paths[p].stroke;
        if (pStroke==doorColour){
          pStroke='#00ffff'; //E+ Door Colour
        } else {
          pStroke='#ff7f00'; //E+ Orange Wall Colour
        }
        var pStrokeWidth = json.maps[m].paths[p].stroke_width;
        
        var jsonPath = JSON.parse(json.maps[m].paths[p].path);
        var path = '';
        for (var i=0;i<jsonPath.length;i++){
          path += ''+jsonPath[i][0];
          path += ''+(jsonPath[i][1]+pLeft-pWidth/2)*sfz;
          path += ','+(jsonPath[i][2]+pTop-pHeight/2)*sfz;
        }
        svgXML+='<path class="'+pClass+'" stroke="'+pStroke+'" stroke-opacity="1.0" stroke-width="'+pStrokeWidth+'" stroke-linejoin="round" stroke-linecap="round" fill="none" d="'+path+'" />';
      }
      svgXML+='</svg>';
      mapDiv.innerHTML+=svgXML;
    }
    
    moduleText += '</map>';
    module.value+=moduleText;
  }
  
  document.getElementById('downloadButton').style.display='block';
  document.getElementById('downloadButton').value='Loading Images...';
  document.getElementById('downloadButton').disabled='disabled';
    
  //Add image load check
  var images = document.images;
  imageCount = images.length;
  
  [].forEach.call(images, function(image){
    if(image.complete){
      incrementImageCounter();
    } else {
      image.addEventListener('load', incrementImageCounter, false);
      image.addEventListener('error', imageError, false);
    }
  });
}

function imageError(){
  console.log('Error with image '+this.id+' replacing with blank');
  this.className +=' bad';
  this.src='img/Trans1x1.png';
}

function incrementImageCounter(){
  imagesLoaded++;
  if (this.naturalWidth>4096 || this.naturalHeight>4096){
    console.log('%cImage too big! '+this.id+' - '+this.alt,'background:#ff06');
  }
  
  if (imagesLoaded==imageCount){
    console.log('All images loaded!');
    document.getElementById('downloadButton').value='Download Module';
    document.getElementById('downloadButton').disabled='';
  }
}

function urlToPromise(url) {
  return new Promise(function(resolve, reject) {
    JSZipUtils.getBinaryContent(url, function (err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}


function downloadModule(){
  console.log('Download');
  
  document.getElementById('downloadButton').disabled='disabled';
  document.getElementById('downloadButton').value='Please Wait...';
  
  if (!preCheck()){
    document.getElementById('downloadButton').value='Download Module';
    document.getElementById('downloadButton').disabled='';
    return false;
  }
    
  var zipName = fileName.replace(/.json/,'')+'.module';
  var zip = new JSZip();
  var module = document.getElementById('module');
  zip.file('module.xml', '<?xml version="1.0" encoding="utf-8" standalone="no"?><module>'+module.value+'</module>');

  var mapWrappers = document.getElementsByClassName('mapWrapper');
  for (var mw=0;mw<mapWrappers.length;mw++){
    var mapName = mapWrappers[mw].getElementsByTagName('h4')[0].innerText
    var map = mapWrappers[mw].getElementsByClassName('map')[0];    
    var mapImage = map.getElementsByClassName('background')[0];
    var mapImageExtension=getExtn(mapImage.src);
    
    if (map.getElementsByTagName('svg').length>0){
      var svg = map.getElementsByTagName('svg')[0];   
      zip.file(mapName+'.svg', document.getElementById(svg.id).outerHTML);
    }

    if (mapImage.naturalWidth>maxZipWidth || mapImage.naturalHeight>maxZipHeight){
      var mapWidth=mapImage.naturalWidth;
      var mapHeight=mapImage.naturalHeight;
      if ((mapWidth>=mapHeight) && mapWidth>maxZipWidth){
        sfz=maxZipWidth/mapWidth;
      } else if ((mapHeight>mapWidth) && mapHeight>maxZipHeight) {
        sfz=maxZipHeight/mapHeight;
      } else {
        sfz=1.0;
      }
      console.log('Resizing: '+mapImage.alt);
      var mapData = getData(mapImage,mapWidth*sfz,mapHeight*sfz);
      zip.file(mapName+'.png', mapData, {base64: true});
    } else {
      zip.file(mapName+'.'+mapImageExtension, urlToPromise(mapImage.src), {binary:true});
    }
    
    var tiles = map.getElementsByClassName('tile');
    for (var t=0;t<tiles.length;t++){
      var tileId = tiles[t].id;
      var tileSrc = tiles[t].src;
      var tileExtension=getExtn(tileSrc);
      if (tiles[t].naturalWidth==0){
        console.log('%cImg failed to load :'+tileId,'background:#ff00');
      } else {
        zip.file(tileId+'.'+tileExtension, urlToPromise(tileSrc), {binary:true});
      }
    }
  }  
  zip.generateAsync({type:'blob'}).then(function(content) {
    saveAs(content, zipName);
    document.getElementById('downloadButton').value='Download Module';
    document.getElementById('downloadButton').disabled='';
  });
}

function getData(img,width,height) {
  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height
  ctx.drawImage(img, 0, 0, width, height)
  var data = canvas.toDataURL('image/png',1)
  return data.substr(data.indexOf(',')+1);
}

function preCheck(){
  var foundBad = false;
  var mapWrappers = document.getElementsByClassName('mapWrapper');
  for (var mw=0;mw<mapWrappers.length;mw++){
    var map = mapWrappers[mw].getElementsByClassName('map')[0];
    var tiles = map.getElementsByClassName('tile');    
    for (var t=0;t<tiles.length;t++){
      if (tiles[t].naturalWidth==0){
        foundBad=true;
        console.log('%cImg failed to load :'+tiles[t].id,'background:#ff06');
      }
    }
  }
  
  if (foundBad){
    console.log('%cDownload Aborted','background:#ff06');
    return false;
  }
  return true;
}