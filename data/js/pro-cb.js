/* Copyright (c) 2012-2016 The TagSpaces Authors. All rights reserved.
 * Use of this source code is governed by a AGPL3 license that
 * can be found gin the LICENSE file. */
//const fs = require('fs-extra');  
define(function(require, exports, module) {
  'use strict';
	
	  var TSCORE = require("tscore");
      var tsMeta = require("tsmeta");
	  var saveAs = require('libs/filesaver.js/FileSaver.min.js');
	  var tsIOApi = require('tsioapi');
	  require('libs/pdfjs/build/pdf.js');
	  var supportedThumbExtensions = ["jpg", "jpeg", "png", "gif", "pdf", "bmp"];
	 // var PDFJS.workerSrc = require("libs/pdfjs/build/pdf.worker.js");	
	
	var maxTmbSize = 300;
	
  //console.log("Pro not available");
	console.log("Pro being emjulated!");

  //exports.available = false;
	exports.available = true;

	function supportedThumbFileExt(filePath){
		try {
			var fileTypeExt = TSCORE.TagUtils.extractFileExtension(filePath);
			console.log("fileTypeExt: " + fileTypeExt);
			return (supportedThumbExtensions.indexOf(fileTypeExt) >= 0) ? fileTypeExt : false;		
		} catch(e) {
			console.log("isSupportedThumbFile("+ filePath + ") caught error: " + e);
			return false;
		}
	}
	
	function getThumbnailURLPromise(filePath) {
		return new Promise(function(resolve, reject) {
			var supportedExt = supportedThumbFileExt(filePath);
			var filename = TSCORE.TagUtils.extractFileName(filePath) + TSCORE.thumbFileExt;
			var thumbFilePath = TSCORE.currentPath + TSCORE.dirSeparator + TSCORE.metaFolder + TSCORE.dirSeparator + filename;
			
			
			if (supportedExt) { // legit file for thumbnail
				console.log("Supported (" + supportedExt + ") file-type for thumb : " + filePath);	
				
				try {
				 	if (fs.existsSync(thumbFilePath))
					{
						console.log("File exists; about to call getbase64image(" + thumbFilePath + ")");
						var dataURL = TSCORE.Utils.getBase64Image(thumbFilePath);
						var rawData = dataURL.replace(/^data:image\/png;base64,/, "");
						console.log("extracted data from thumbfile at " + thumbFilePath + "; data is: " + dataURL + "; raw data is: " + rawData);
						if (dataURL) resolve(dataURL);
						else resolve(filePath);
					} else if (supportedExt === "pdf") { // need to make thumb for pdf:
						console.log("need to make thumb for pdf");
						generatePDFThumbnailPromise(filePath).then(function(dataURL) {
							saveDataURLtoImagefile(dataURL, thumbFilePath);
							resolve(dataURL);
							
						});
					} else { //supported image, need to generate thumb:
						console.log("supported image, need to generate thumb for " + filePath + " at: " + thumbFilePath);
						TSCORE.Meta.generateImageThumbnail(filePath).then(function(dataURL) {
							saveDataURLtoImagefile(dataURL, thumbFilePath); 
							resolve(dataURL);
						});
					}	
									
				} catch(e) { //file doesn't exist?
					console.log("file doesn't exist? " + filePath + " error: " + e);
				}
				
			} else {
				console.log("Not a thumb-supported file-type (" + supportedExt + ") found in " + filePath);
				reject("Not a thumb-supported file-type (" + supportedExt + ") found in " + filePath);
				
			}			
		});
	}
	
	function saveDataURLtoImagefile(dataURL, filePath) 
	{
		console.log("saveDataURLtoImageFile(" + dataURL.slice(0,50) +"..., " + filePath + ")");
		var buffer= TSCORE.Utils.base64ToArrayBuffer(dataURL.replace(/^data:image\/png;base64,/, ""));
		console.log("called base64-AB for " + filePath + " going to save file...");
		try {
			tsIOApi.saveBinaryFilePromise(filePath, buffer, false).then(function(isNewFile) {
				console.log("Successfully " + (isNewFile ? "saved new " : "overwrote ") + "file: " + filePath);
			});
		} catch (e) {
			console.log("Could not save thumbnail at " + filePath + ": " + e);
		}
	}
	
	function generatePDFThumbnailPromise(filePath) {
		return new Promise(function(resolve, reject) {
			function genPage(page) {
				var viewport = page.getViewport(1);
				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext('2d');

				if (viewport.width >= viewport.height) {
					canvas.width = maxTmbSize;
					canvas.height = (maxTmbSize * viewport.height) / viewport.width;
				} else {
					canvas.height = maxTmbSize;
					canvas.width = (maxTmbSize * viewport.width) / viewport.height;
			  	}
				
				canvas.width / page.getViewport(1.0).width;
				viewport = page.getViewport(canvas.width / page.getViewport(1.0).width);
				
				//canvas.height = viewport.height;
				//canvas.width = viewport.width;

				var renderContext = {
					canvasContext: ctx,
					viewport: viewport
				};
				//ctx.globalCompositeOperation = "destination-over";
				//set background color
				//ctx.fillStyle = "#ffffff";
				//draw background / rect on entire canvas
				//ctx.fillRect(0, 0, canvas.width, canvas.height);
				page.render(renderContext).then(function() { 
					var data = canvas.toDataURL("image/png");
					if ((data != null) && data != undefined)
						resolve(data);                
					else
						reject("Cannot get dataURL for " + filePath);
				});
			}

			function grabPage(pdf) {
				//var mypage = pdf.getPage(1);
				//mypage.then(genPage);
				pdf.getPage(1).then(genPage);
			}

			//promDoc = PDFJS.getDocument(filePath);
			//ret = promDoc.then(grabPage);
			return PDFJS.getDocument(filePath).then(grabPage);
		});
		return null;
	
	}
		
		
	function generateImageThumbnailPromise(filePath) {
		return null;
	}
	
	exports.getThumbnailURLPromise = getThumbnailURLPromise;
});

