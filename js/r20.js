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

function unescapeBlob(str){
  str = str.replace('%0C','');
  return unescape(str);
}

function encodeXML(str){
  return str.replace(/&/g, '&amp;')
    .replace(/</gm, '&lt;')
    .replace(/>/gm, '&gt;')
    .replace(/"/gm, '&quot;')
    .replace(/'/gm, '&apos;');
}

var json;
var fileName;
var hideCharacterObjects=true;
var hideMapsWithoutWalls=false;
var imageCount = 0;
var imagesLoaded = 0;

var maxZipWidth=4096.0;
var maxZipHeight=4096.0;

var debugSkipTiles = false;

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
  module.value = ' <name>'+encodeXML(moduleName)+'</name>'+"\n";
  module.value += ' <slug>'+encodeXML(moduleName.toLowerCase().replace(/ /g,'-'))+'</slug>'+"\n";
  module.value += ' <category>adventure</category>'+"\n";
  module.value += ' <author>Roll 20</author>'+"\n";
  
  //Maps
  for (var m = 0; m < json.maps.length; m++) {
    var hasWalls=false;
    if (json.maps[m].paths.length>0){
      hasWalls = true;
    }
    if (hideMapsWithoutWalls && !hasWalls){
      continue;
    }
    mapName = json.maps[m].attributes.name;
    
    var mapOffsetX=0.0;
    var mapOffsetY=0.0;

    //Map layer meta
    mapWidth =0.0;
    var mapG=-0;
    var mapClass='';
    for (var g=0;g<json.maps[m].graphics.length;g++){
      if (json.maps[m].graphics[g].layer=='map'){
        var tempWidth = json.maps[m].graphics[g].width;
        if (tempWidth>mapWidth){ //May be multiple map layers with thumbnails, take the largest
          mapWidth = json.maps[m].graphics[g].width;
          mapHeight = json.maps[m].graphics[g].height;
          mapImageSrc = json.maps[m].graphics[g].imgsrc.replace(/med.|thumb./,'original.');
          mapOffsetX = (json.maps[m].graphics[g].width/2.0)-json.maps[m].graphics[g].left;
          mapOffsetY = (json.maps[m].graphics[g].height/2.0)-json.maps[m].graphics[g].top;
          mapG = g;
          if (json.maps[m].graphics[g].rotation=='180'){
            mapClass+=' rotate180';
          }
        } 
      } 
    }
    
    console.log('--------------------------');
    console.log('Map [m:'+m+',g:'+mapG+'] - ' + mapName);
    
    /*if (mapOffsetX!=0 || mapOffsetY!=0){
      console.log('%cOffset '+ mapOffsetX + ' x '+mapOffsetY,'background:#ff06');
    }*/
          
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
    
    outDiv.innerHTML+='<div class="mapWrapper"><h4>'+mapName+'</h4><div id="map'+m+'" class="map"><img id="bgmap'+m+'" style="max-width:'+Math.round(mapWidth)+'px;max-height:'+Math.round(mapHeight)+'px;" class="background'+mapClass+'" alt="'+mapName+'" crossorigin="anonymous" src="'+mapImageSrc+'" width="'+Math.round(mapWidth*sfd)+'px" height="'+Math.round(mapHeight*sfd)+'px"/></div></div>';
    var mapDiv = document.getElementById('map'+m);      

    var moduleText = ' <map>'+"\n";
    moduleText += '  <name>'+encodeXML(mapName)+'</name>'+"\n";
    
    var feetPerGrid = json.maps[m].attributes.scale_number;
    var gridSize = (1.0/feetPerGrid)*350.0
    
    moduleText += '  <gridSize>'+Math.round(gridSize)+'</gridSize>'+"\n";
    if (sfz==1.0){
      moduleText += '  <image>'+encodeXML(mapName)+'.'+getExtn(mapImageSrc)+'</image>'+"\n";
    } else {
      moduleText += '  <image>'+encodeXML(mapName)+'.png</image>'+"\n";
    }
    if (hasWalls){
      moduleText += '  <canvas>'+encodeXML(mapName)+'.svg</canvas>'+"\n";
      moduleText += '  <lineOfSight>YES</lineOfSight>'+"\n";
    }
    moduleText += '  <gridVisible>'+(json.maps[m].attributes.showgrid?'YES':'NO')+'</gridVisible>'+"\n";
    moduleText += '  <gridOffsetX>'+Math.round(mapOffsetX)+'</gridOffsetX>'+"\n";
    moduleText += '  <gridOffsetY>'+Math.round(mapOffsetY)+'</gridOffsetY>'+"\n";
    
    //Graphic Objects
    if (!debugSkipTiles){
      for (var g=0;g<json.maps[m].graphics.length;g++){
        var layer = json.maps[m].graphics[g].layer;
        if (layer=='map' && g!=mapG){
          layer='objects';
        } 
        if (layer=='objects' || layer=='gmlayer' || layer=='walls'){
          var left = json.maps[m].graphics[g].left+mapOffsetX;
          var top = json.maps[m].graphics[g].top+mapOffsetY; 
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
            if (layer=='objects' || isLight ){
              cssClass += ' layer-objects';
            } else if (layer=='gmlayer'){
              cssClass += ' layer-dm';
            } else {
              cssClass += ' layer-misc';           
            }
            
            var style = 'position:absolute;left:'+(left-json.maps[m].graphics[g].width/2)*sfd+'px;top:'+(top-json.maps[m].graphics[g].height/2)*sfd+'px;width:'+width*sfd+'px;height:'+height*sfd+'px;';
            mapDiv.innerHTML += '<img style="'+style+'" id="'+id+'" class="'+cssClass+'" title="'+title+'" crossorigin="anonymous" src="'+tileSrc+'"/>';
            //Tile
            moduleText += '  <tile>'+"\n";
            moduleText += '   <x>'+Math.round(left*sfz)+'</x>'+"\n";
            moduleText += '   <y>'+Math.round(top*sfz)+'</y>'+"\n";
            moduleText += '   <width>'+Math.round(width*sfz)+'</width>'+"\n";
            moduleText += '   <height>'+Math.round(height*sfz)+'</height>'+"\n";
            moduleText += '   <opacity>1.0</opacity>'+"\n";
            
            if (json.maps[m].graphics[g].layer=='objects' || isLight){
              moduleText += '   <layer>object</layer>'+"\n";
            }
            if (json.maps[m].graphics[g].layer=='gmlayer'){
              moduleText += '   <layer>dm</layer>'+"\n";
            }
            /*
            if (isLight){
              moduleText += '<layer>object</layer>';
            } else {
              moduleText += '<layer>dm</layer>';
            }*/
            
            moduleText += '   <locked>YES</locked>'+"\n";
            moduleText += '   <asset>';
              moduleText += '<name>'+encodeXML(title)+'</name>';
              moduleText += '<type>image</type>';
              moduleText += '<resource>'+encodeXML(id)+'.'+getExtn(tileSrc)+'</resource>';
            moduleText += '</asset>'+"\n";
            if (hasLight){
              moduleText += '   <light>';
                moduleText += '<enabled>YES</enabled>';
                moduleText += '<radiusMin>'+Math.round(json.maps[m].graphics[g].light_dimradius)+'</radiusMin>';
                moduleText += '<radiusMax>'+Math.round(json.maps[m].graphics[g].light_radius)+'</radiusMax>';
                moduleText += '<alwaysVisible>NO</alwaysVisible>';
                moduleText += '<color>#ffffff</color>';
                moduleText += '<opacity>0.5</opacity>';
              moduleText += '</light>'+"\n";
            }
            moduleText += '  </tile>'+"\n";
          }
        } else {
          //console.log(g+' '+json.maps[m].graphics[g].layer);
        }
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
          var letter = jsonPath[i][0];
          if (letter=='M' || letter=='L'){ //Lines
            path += letter;
            path += ''+(jsonPath[i][1]+pLeft+mapOffsetX-pWidth/2)*sfz;
            path += ','+(jsonPath[i][2]+pTop+mapOffsetY-pHeight/2)*sfz;
          } else if (letter=='C'){ //Oval path
            path += letter;
            path += ''+(jsonPath[i][1]+pLeft+mapOffsetX-pWidth/2)*sfz;
            path += ','+(jsonPath[i][2]+pTop+mapOffsetY-pHeight/2)*sfz;
            path += ','+(jsonPath[i][3]+pLeft+mapOffsetX-pWidth/2)*sfz;
            path += ','+(jsonPath[i][4]+pTop+mapOffsetY-pHeight/2)*sfz;
            path += ','+(jsonPath[i][5]+pLeft+mapOffsetX-pWidth/2)*sfz;
            path += ','+(jsonPath[i][6]+pTop+mapOffsetY-pHeight/2)*sfz;          
          } else if (letter=='Q'){ //Freehand path (UNTESTED!)
            path += letter;
            path += ''+(jsonPath[i][1]+pLeft+mapOffsetX-pWidth/2)*sfz;
            path += ','+(jsonPath[i][2]+pTop+mapOffsetY-pHeight/2)*sfz;
            path += ','+(jsonPath[i][3]+pLeft+mapOffsetX-pWidth/2)*sfz;
            path += ','+(jsonPath[i][4]+pTop+mapOffsetY-pHeight/2)*sfz;
          } else {
            console.log('%cUnknown SVG Letter! '+letter+' in paths['+p+'].path['+i+']','background:#ff06');
          }
        }
        svgXML+='<path class="'+pClass+'" stroke="'+pStroke+'" stroke-opacity="1.0" stroke-width="'+pStrokeWidth+'" stroke-linejoin="round" stroke-linecap="round" fill="none" d="'+path+'" />';
      }
      svgXML+='</svg>';
      mapDiv.innerHTML+=svgXML;
    }
    
    moduleText += ' </map>'+"\n";
    module.value+=moduleText;
  }
  
  //Pages
  //Create groups from journal
  var groups = {};
  moduleText ='';
  
  for (var j=0;j<json.journal.length;j++){
    for (var p=0;p<json.journal[j].path.length;p++){
      var name = json.journal[j].path[p];
      var parentKey='';
      if (p==0){
        parentKey='';        
      } else {
        parentKey=json.journal[j].path[p-1];
      }
      if (groups[name]==undefined){
        groups[name]={"id":createUUID(),"parent":parentKey};
      }
    }
  }
    
  for (var key in groups){
    if (groups[key].parent==''){
      moduleText += ' <group id="'+groups[key].id+'">'+"\n";
    } else {
      moduleText += ' <group id="'+groups[key].id+'" parent="'+groups[groups[key].parent].id+'">'+"\n";
    }
    moduleText += '  <name>'+encodeXML(key)+'</name>'+"\n";
    moduleText += '  <slug>'+encodeXML(key.toLowerCase().replace(/ /g,'-'))+'</slug>'+"\n";
    moduleText += ' </group>'+"\n";   
  }
  
  //Handouts
  for (var h=0;h<json.handouts.length;h++){
    var pageId = json.handouts[h].attributes.id;
    var pageName = json.handouts[h].attributes.name;
    var avatar = json.handouts[h].attributes.avatar;
    var blobNotes = unescapeBlob(json.handouts[h].blobNotes);
    var blobGmNotes = unescapeBlob(json.handouts[h].blobGmNotes);
    var tempNotes = String;
    if (blobGmNotes!=''){
      if (blobNotes!=''){
        blobNotes+='<hr/>';
      }
      blobNotes+=blobGmNotes;
    }
    if (avatar!=''){
      blobNotes+='<img src="'+avatar+'"/>';
    }
    var parentKey = '';
    for (var j=0;j<json.journal.length;j++){
      if (json.journal[j].id==pageId){
        parentKey = json.journal[j].path[json.journal[j].path.length-1];
      }
    }
    
    moduleText += ' <page parent="'+groups[parentKey].id+'">'+"\n";
    moduleText += '  <name>'+encodeXML(pageName)+'</name>'+"\n";
    moduleText += '  <slug>'+encodeXML(pageName.toLowerCase().replace(/ /g,'-'))+'</slug>'+"\n";
	tempNotes=blobNotes;
	matchCharacter = tempNotes.match(/(http:\/\/journal\.roll20\.net\/character\/)(.+?)(?="|&|\))/);
	while (matchCharacter)
		{
		tempNotes=tempNotes.replace(/(http:\/\/journal\.roll20\.net\/character\/)(.+?)(?="|&|\))/, function (x, y, z) {
			for (var d=0;d<json.characters.length;d++){
				if (json.characters[d].attributes.id)
				{
				if (json.characters[d].attributes.id == z) {
					//console.log(json.characters[d].attributes.name)
					return "/monster/" + json.characters[d].attributes.name.toLowerCase().replace(/ /g,'-')
					}
					}
					else
					{
					return ""
					}
				}
			});
		matchCharacter = tempNotes.match(/(http:\/\/journal\.roll20\.net\/character\/)(.+?)(?="|&|\))/);
		}
	matchCharacter = tempNotes.match(/(http:\/\/journal\.roll20\.net\/handout\/)(.+?)(?="|&|\))/)
	while (matchCharacter)
		{
		tempNotes=tempNotes.replace(/(http:\/\/journal\.roll20\.net\/handout\/)(.+?)(?="|&|\))/, function (x, y, z, a) {
			for (var d=0;d<json.handouts.length;d++){
				if (json.handouts[d].attributes.id){
					if (json.handouts[d].attributes.id == z) {
						//console.log(json.handouts[d].attributes.name)
						return "/page/" + json.handouts[d].attributes.name.toLowerCase().replace(/ /g,'-')
						}
					}
					else
					{
						return ""
					}
				}
			});
		matchCharacter = tempNotes.match(/(http:\/\/journal\.roll20\.net\/handout\/)(.+?)(?="|&|\))/);
		}
	tempNotes=tempNotes.replace(/#content/g, "")
		.replace(/https:\/\/(app|journal)\.roll20\.net\/compendium\/dnd5e\/Items:/g, "/item/")
		.replace(/https:\/\/(app|journal)\.roll20\.net\/compendium\/monstermanual\/Monsters:/g, "/monster/")
		.replace(/https:\/\/(app|journal)\.roll20\.net\/compendium\/dnd5e\/Spells:/g, "/spell/")
		.replace(/https:\/\/roll20\.net\/compendium\/dnd5e\/Spells:/g, "/spell/")
		.replace(/https:\/\/(app|journal)\.roll20\.net\/compendium\/dnd5e\//g, "/monster/")
		.replace(/https:\/\/roll20\.net\/compendium\/dnd5e\//g, "/monster/");
    moduleText += '  <content sourceId="h'+h+'">'+encodeXML(tempNotes)+'</content>'+"\n";
    moduleText += ' </page>'+"\n";
  }
  
  //Characters
  for (var c=0;c<json.characters.length;c++){
    var charId = json.characters[c].attributes.id;
    var charName = json.characters[c].attributes.name;
    var avatar = json.characters[c].attributes.avatar;
    var blobBio = unescapeBlob(json.characters[c].blobBio);
    var blobGmNotes = unescapeBlob(json.characters[c].blobGmNotes);
    if (blobGmNotes!=''){
      if (blobBio!=''){
        blobBio+='<hr/>';
      }
      blobBio+=blobGmNotes;
    }
    if (avatar!=''){
      blobBio+='<img src="'+avatar+'"/>';
    }
    var parentKey = '';
    for (var j=0;j<json.journal.length;j++){
      if (json.journal[j].id==charId){
        parentKey = json.journal[j].path[json.journal[j].path.length-1];
      }
    }
    
    moduleText += ' <page parent="'+groups[parentKey].id+'">'+"\n"; 
    moduleText += '  <name>'+encodeXML(charName)+'</name>'+"\n";
    moduleText += '  <slug>'+encodeXML(charName.toLowerCase().replace(/ /g,'-'))+'</slug>'+"\n";
	tempNotes=blobBio;
	matchCharacter = tempNotes.match(/(http:\/\/journal\.roll20\.net\/character\/)(.+?)(?="|&|\))/)
	while (matchCharacter)
		{
		tempNotes=tempNotes.replace(/(http:\/\/journal\.roll20\.net\/character\/)(.+?)(?="|&|\))/, function (x, y, z) {
			for (var d=0;d<json.characters.length;d++){
				if (json.characters[d].attributes.id){
					if (json.characters[d].attributes.id == z) {
						//console.log(json.characters[d].attributes.name)
						return "/monster/" + json.characters[d].attributes.name.toLowerCase().replace(/ /g,'-')
						}
					}
					else
					{
						return ""
					}
				}
			});
		matchCharacter = tempNotes.match(/(http:\/\/journal\.roll20\.net\/character\/)(.+?)(?="|&|\))/);
		}
	matchCharacter = tempNotes.match(/(http:\/\/journal\.roll20\.net\/handout\/)(.+?)(?="|&|\))/)
	while (matchCharacter)
		{
		tempNotes=tempNotes.replace(/(http:\/\/journal\.roll20\.net\/handout\/)(.+?)(?="|&|\))/, function (x, y, z) {
			for (var d=0;d<json.handouts.length;d++){
				if (json.handouts[d].attributes.id){
					if (json.handouts[d].attributes.id == z) {
						//console.log(json.handouts[d].attributes.name)
						return "/page/" + json.handouts[d].attributes.name.toLowerCase().replace(/ /g,'-')
						}
					}
					else
					{
						return ""
					}
				}
			});
		matchCharacter = tempNotes.match(/(http:\/\/journal\.roll20\.net\/handout\/)(.+?)(?="|&|\))/);
		}
	tempNotes=tempNotes.replace(/#content/g, "")
		.replace(/https:\/\/(app|journal)\.roll20\.net\/compendium\/dnd5e\/Items:/g, "/item/")
		.replace(/https:\/\/(app|journal)\.roll20\.net\/compendium\/monstermanual\/Monsters:/g, "/monster/")
		.replace(/https:\/\/(app|journal)\.roll20\.net\/compendium\/dnd5e\/Spells:/g, "/spell/")
		.replace(/https:\/\/roll20\.net\/compendium\/dnd5e\/Spells:/g, "/spell/")
		.replace(/https:\/\/(app|journal)\.roll20\.net\/compendium\/dnd5e\//g, "/monster/")
		.replace(/https:\/\/roll20\.net\/compendium\/dnd5e\//g, "/monster/");
    moduleText += '  <content sourceId="c'+c+'">'+encodeXML(tempNotes)+'</content>'+"\n";
    moduleText += ' </page>'+"\n";
  }
  
  module.value+=moduleText;
  
  document.getElementById('downloadButton').style.display='block';
  document.getElementById('downloadButton').value='Loading Images...';
  document.getElementById('downloadButton').disabled='disabled';
    
  //Add image load check
  var images = document.images;
  imageCount = images.length;
  
  [].forEach.call(images, function(image){
    if(image.complete){
      imageLoaded();
    } else {
      image.addEventListener('load', imageLoaded, false);
      image.addEventListener('error', imageError, false);
    }
  });
}

function imageError(){
  console.log('Error with image '+this.id+' replacing with blank');
  this.className +=' bad';
  this.src='img/Trans1x1.png';
}

function imageLoaded(){
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
    
    //Check for size mismatch between json and image
    var resizeNeededFromJson=false;
    
    var jsonWidth = parseInt(mapImage.style.maxWidth.replace('px',''));
    var jsonHeight = parseInt(mapImage.style.maxHeight.replace('px',''));
    if (jsonWidth!=mapImage.naturalWidth || jsonHeight!=mapImage.naturalHeight){
      resizeNeededFromJson=true;
      console.log('json/image size mismatch - resize needed: '+mapImage.alt);
    }
    var rotate180Needed = (mapImage.className.indexOf('rotate180')!=-1)

    if (rotate180Needed || resizeNeededFromJson || mapImage.naturalWidth>maxZipWidth || mapImage.naturalHeight>maxZipHeight){
      var mapWidth=mapImage.naturalWidth;
      var mapHeight=mapImage.naturalHeight;
      if (resizeNeededFromJson){
        mapWidth=jsonWidth;
        mapHeight=jsonHeight;
      }
      if ((mapWidth>=mapHeight) && mapWidth>maxZipWidth){
        sfz=maxZipWidth/mapWidth;
      } else if ((mapHeight>mapWidth) && mapHeight>maxZipHeight) {
        sfz=maxZipHeight/mapHeight;
      } else {
        sfz=1.0;
      }
      console.log('Resizing: '+mapImage.alt);
      //Need to update module to force png extension.
      module.value = module.value.replace('  <image>'+mapName+'.'+mapImageExtension+'</image>'+"\n",'  <image>'+mapName+'.png</image>'+"\n");

      var mapData = getData(mapImage,mapWidth*sfz,mapHeight*sfz,rotate180Needed?Math.PI:0);
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
  
  zip.file('module.xml', '<?xml version="1.0" encoding="utf-8" standalone="no"?>'+"\n"+'<module>'+"\n"+module.value+'</module>');  
  zip.generateAsync({type:'blob'}).then(function(content) {
    saveAs(content, zipName);
    document.getElementById('downloadButton').value='Download Module';
    document.getElementById('downloadButton').disabled='';
  });
}

function getData(img,width,height,rotationRads) {
  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height
  ctx.translate(width/2, height/2);
  if (rotationRads!=0){
    ctx.rotate(rotationRads);
  }
  ctx.drawImage(img, -width/2, -height/2, width, height)
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

function createUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid.toUpperCase();
}
