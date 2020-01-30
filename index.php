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
  </style>
  <script type="text/javascript" src="js/jquery-3.4.1.min.js"></script>
  <script type="text/javascript" src="js/jszip.min.js"></script>
  <script type="text/javascript" src="js/FileSaver.min.js"></script>
  <script type="text/javascript" src="js/jszip-utils.min.js"></script>
  <script type="text/javascript" src="js/r20.js"></script>
</head>
<body>
  <p>Select Roll 20 module json: <input id="JSONFile" type="file" class="btn-outline" name="Roll 20 JSON File"/></p>
  <p><input id="downloadButton" style="display:none;" type="button" value="Download Module" onClick="downloadModule();"/></p>
  <textarea id="module"></textarea>
  <div id="output"></div>
</body>
</html>