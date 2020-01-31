$(function() {
  $("input:file").change(function (event){
    console.log("Got a file");
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    fileName = event.target.files[0].name;
    reader.readAsText(event.target.files[0]);
    reader = null;
  });
});

/*
function getData(img,format) {  
  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')
  canvas.width = img.width
  canvas.height = img.height
  ctx.drawImage(img, 0, 0)
  var data = canvas.toDataURL('image/'+format,1)
  return data.substr(data.indexOf(',')+1);
}
*/

function getExtn(src){
  var extn='png';
  if (src.indexOf('.png')==-1){
    extn='jpg';    
  }
  return extn;
}

var json;
var fileName;
function onReaderLoad(event){
  json = JSON.parse(event.target.result);
  console.log("JSON Loaded");
  
  //Scaling
  var maxWidth=1000.0;
  var sf=1.0;
  
  var mapWidth=0.0;
  var mapHeight=0.0;
  var mapName='';
  var mapImageSrc='';
  var outDiv = document.getElementById('output');
  var doorColour = '';
  
  outDiv.innerHTML='';
  var module = document.getElementById('module');
  
  var moduleName = fileName.replace(/.json/,'');
  module.value = '<name>'+moduleName+'</name>';
  module.value += '<slug>'+moduleName.toLowerCase().replace(/ /g,'-')+'</slug>';
  module.value += '<category>adventure</category>';
  module.value += '<author>Roll 20</author>';
  
  for (var m = 0; m < json.maps.length; m++) {
    if (json.maps[m].paths.length>0){
      mapName = json.maps[m].attributes.name;
      console.log('Map '+m+ ' has paths - ' + mapName);

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
            
      if (mapWidth>maxWidth){
        sf=maxWidth/mapWidth;
        console.log('scaling by '+sf);
      }
      
      outDiv.innerHTML+='<div class="mapWrapper"><h4>'+mapName+'</h4><div id="map'+m+'" class="map"><img class="background" crossorigin="anonymous" src="'+mapImageSrc+'" width="'+mapWidth*sf+'px" height="'+mapHeight*sf+'px"/></div></div>';
      var mapDiv = document.getElementById('map'+m);
            
      console.log('Map Image Size: '+mapWidth+' x '+mapHeight);
      
      var moduleText = '<map>';
      moduleText += '<name>'+mapName+'</name>';
      moduleText += '<gridSize>70</gridSize>';
      moduleText += '<image>'+mapName+'.'+getExtn(mapImageSrc)+'</image>';
      moduleText += '<canvas>'+mapName+'.svg</canvas>';
      
      //Graphic Objects
      for (var g=0;g<json.maps[m].graphics.length;g++){
        if (json.maps[m].graphics[g].layer=='objects' || json.maps[m].graphics[g].layer=='gmlayer'){
          var left = json.maps[m].graphics[g].left-json.maps[m].graphics[g].width/2;
          var top = json.maps[m].graphics[g].top-json.maps[m].graphics[g].height/2; 
          var width = json.maps[m].graphics[g].width;
          var height = json.maps[m].graphics[g].height;
          var title = json.maps[m].graphics[g].name;
          var id = 'graphic_m'+m+'_'+json.maps[m].graphics[g].layer+'_g'+g;
          if (title==''){
            title = id;
          }
          var tileSrc = json.maps[m].graphics[g].imgsrc.replace(/med.|thumb./,'original.');
          var style = 'position:absolute;left:'+left*sf+'px;top:'+top*sf+'px;width:'+width*sf+'px;height:'+height*sf+'px;';
          mapDiv.innerHTML += '<img style="'+style+'" id="'+id+'" class="tile" title="'+title+'" crossorigin="anonymous" src="'+tileSrc+'"/>';
          //Tile
          moduleText += '<tile>';
          moduleText += '<x>'+left+'</x>';
          moduleText += '<y>'+top+'</y>';
          moduleText += '<width>'+width+'</width>';
          moduleText += '<height>'+height+'</height>';
          moduleText += '<opacity>1.0</opacity>';
          moduleText += '<layer>dm</layer>';
          moduleText += '<locked>YES</locked>';
          moduleText += '<asset>';
            moduleText += '<name>'+title+'</name>';
            moduleText += '<type>image</type>';
            moduleText += '<resource>'+id+'.'+getExtn(tileSrc)+'</resource>';
          moduleText += '</asset>';
          moduleText += '</tile>';
        } else {
          console.log(g+' '+json.maps[m].graphics[g].layer);
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
      var svgXML='<svg id="svg'+m+'" xmlns="http://www.w3.org/2000/svg" version="1.0" width="'+mapWidth*sf+'" height="'+mapHeight*sf+'" viewBox="0 0 '+mapWidth+' '+mapHeight+'">';
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
          path += ''+(jsonPath[i][1]+pLeft-pWidth/2);
          path += ','+(jsonPath[i][2]+pTop-pHeight/2);
        }
        svgXML+='<path class="'+pClass+'" stroke="'+pStroke+'" stroke-opacity="1.0" stroke-width="'+pStrokeWidth+'" stroke-linejoin="round" stroke-linecap="round" fill="none" d="'+path+'" />';
      }
      svgXML+='</svg>';
      
      mapDiv.innerHTML+=svgXML;
      moduleText += '</map>';
      module.value+=moduleText;
    }
  }
  
  document.getElementById('downloadButton').style.display='block';
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

    var svg = map.getElementsByTagName('svg')[0];   
    zip.file(mapName+'.svg', document.getElementById(svg.id).outerHTML);
    //var mapData = getData(mapImage,mapImageExtension);
    //zip.file(mapName+'.'+mapImageExtension, mapData, {base64: true});    
    zip.file(mapName+'.'+mapImageExtension, urlToPromise(mapImage.src), {binary:true});
    
    var tiles = map.getElementsByClassName('tile');
    for (var t=0;t<tiles.length;t++){
      var tileId = tiles[t].id;
      var tileSrc = tiles[t].src;
      var tileExtension=getExtn(tileSrc);

      //var tileData = getData(tiles[t],tileExtension);
      //zip.file(tileId+'.'+tileExtension, tileData, {base64: true});
      zip.file(tileId+'.'+tileExtension, urlToPromise(tileSrc), {binary:true});
    }
  }  
  zip.generateAsync({type:'blob'}).then(function(content) {
    saveAs(content, zipName);
    document.getElementById('downloadButton').value='Download Module';
    document.getElementById('downloadButton').disabled='';
  });
}