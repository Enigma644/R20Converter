<?php header('Access-Control-Allow-Origin: *'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Roll 20 Converter</title>
  <style>
    .btn-outline{
      border:1px solid #aaa;
      padding: 10px;
      border-radius:10px;
    }
    #output {
      border:1px solid #aaa;
      border-radius:10px;
      padding: 10px;
    }
    .map {
      /*max-width:100%;*/
      position:relative;
    }
    .map img, .map svg {
      /*max-width:100%;*/      
    }
    .map svg{
      /*border:1px dashed red;*/
      height:auto;
      position:absolute;
      top:0px;
      left:0px;
    }
    #module {
      display:none;    
    }
    .light {
      border:1px dashed red;
      border-radius: 45px;
    }
    .key span {
      margin-left:10px;
    }
    .key .wall {
      border-left:3px solid #ff7f00;
      padding-left:5px;
    }
    .key .door {
      border-left:3px solid #00ffff;
      padding-left:5px;
    }
    .key .light {
      padding-left:5px;
      padding-right:5px;
    }

    .layer-dm {
      border: 1px solid #00f;
      background: #00f5;
    }
    
    .layer-misc {
      border: 1px solid #0f0;
      background: #0f05;
    }
    /*
    .layer-objects {
      border:1px solid blue;
    }
    */
    .tile.bad {
      border:2px solid #f00;
      background-color: #f009;
    }
  </style>
  <script type="text/javascript" src="js/jquery-3.4.1.min.js"></script>
  <script type="text/javascript" src="js/jszip.min.js"></script>
  <script type="text/javascript" src="js/FileSaver.min.js"></script>
  <script type="text/javascript" src="js/jszip-utils.min.js"></script>
  <script type="text/javascript" src="js/r20.js"></script>
</head>
<body>
  <p>Select Roll 20 module json: <input id="JSONFile" type="file" class="btn-outline" name="Roll 20 JSON File"/>
    <br/>Hide character images:<input type="checkbox" id="hideCharacterObjects" checked="checked"/>
    <br/>Hide maps without walls:<input type="checkbox" id="hideMapsWithoutWalls" checked="checked"/>
    <br/>Key: <span class="key"><span class="wall">Wall</span><span class="door">Door</span><span class="light">Light source</span><span class="layer-dm">DM Layer Objects</span><span class="tile bad">Missing Image</span></span>
  </p>
  <p><input id="downloadButton" style="display:none;" type="button" value="Download Module" onClick="downloadModule();"/></p>
  <textarea id="module"></textarea>
  <div id="output"></div>
</body>
</html>