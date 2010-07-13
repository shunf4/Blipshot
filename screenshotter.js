var Screenshotter = {
  
  imageDataURL: [],
  
  shared: {
    imageDataURLPartial: [],
    imageDirtyCutAt: 0,
    
    originalScrollTop: 0,
    
    tab: {
      id: 0,
      url: "",
      title: ""
    }
  },
  
  grab: function(e) {
    /****************************************************************************************************
     * It's a chaos: the ball must bounce between background and script content since the first
     * can grab and the second can access the DOM (scroll)
     *
     * So the call stack is:
     *    grab (bg)
     *      screenshotBegin (script)
     *      loop {
     *        screenshotVisibleArea (bg)
     *        screenshotScroll (script)
     *      }
     *      screenshotEnd (bg)
     *      screenshotReturn (script)
     */ 
    var self = this;
    
    // ****** Reset screenshot container
    this.imageDataURLPartial = [];
    
    // ****** Get tab data
    chrome.windows.getCurrent(function(win) {
      chrome.tabs.getSelected(win.id, function(tab) {
        self.shared.tab = tab;
      });
    });
    
    // ****** Begin!
    this.screenshotBegin(this.shared);
  },
  
  // 1
  screenshotBegin: function(shared) { chrome.tabs.sendRequest(this.shared.tab.id, { action: 'screenshotBegin', shared: shared }); },
  
  // 2
  screenshotVisibleArea: function(shared) {
    var self = this;
    chrome.tabs.captureVisibleTab(null, { format: "png" /* png, jpeg */, quality: 80 }, function(dataUrl) { self.imageDataURLPartial.push(dataUrl); });
    self.screenshotScroll(shared);
  },
  
  // 3
  screenshotScroll: function(shared) { chrome.tabs.sendRequest(this.shared.tab.id, { action: 'screenshotScroll', shared: shared }); },
  
  // 4
  screenshotEnd: function(shared) {
    var self = this;
    
    this.recursiveImageMerge(this.imageDataURLPartial, shared.imageDirtyCutAt, function(image) {
      shared.imageDataURL = image;
      self.screenshotReturn(shared);
    });
  },
  
  // 5
  screenshotReturn: function(shared) { chrome.tabs.sendRequest(this.shared.tab.id, { action: 'screenshotReturn', shared: shared }); },
  
  eventManagerInit: function() {
    var self = this;
    chrome.extension.onRequest.addListener(function(e) {
        switch (e.action) {
          case "grab": self.grab(); break;
          case "screenshotVisibleArea": self.screenshotVisibleArea(e.shared); break;
          case "screenshotEnd": self.screenshotEnd(e.shared); break;
        }
    });
  },
  
  recursiveImageMerge: function(imageDataURLs, imageDirtyCutAt, callback, images, i) {
    var fx = arguments.callee;
    i = i || 0;
    images = images || [];
    
    if (i < imageDataURLs.length) {
      images[i] = new Image();
      images[i].onload = function() {
        imageDataURLs[i] = null; // clear for optimize memory consumption (not sure)
        if (i == imageDataURLs.length - 1) {
          // ****** We're at the end of the chain, let's have fun with canvas.
          var canvas = window.document.createElement('canvas');
          
          // NOTE: Resizing a canvas is destructive, we can do it just now before stictching
          canvas.width = images[0].width - 20; //TODO: fix toolbar evaluation
          canvas.height = imageDataURLs.length * images[0].height; //TODO: fix
          //canvas.height = (imageDataURLs.length - 1) * images[0].height + imageDirtyCutAt; //TODO: fix
          alert(imageDirtyCutAt)
          for (var j = 0; j < images.length; j++) {
            if (j == images.length - 1) {
              //TODO: last image must be cut when scrolled
            }
            //canvas.getContext("2d").drawImage(images[j], 0, 0, images[j].width, images[j].height, 0, j * images[0].height, images[j].width, images[j].height);
            canvas.getContext("2d").drawImage(images[j], 0, j * images[0].height);
          }
          
          callback(canvas.toDataURL("image/png")); // --> CALLBACK
        } else {
          // ****** Down!
          fx(imageDataURLs, imageDirtyCutAt, callback, images, ++i);
        }
      }
      images[i].src = imageDataURLs[i]; // Load!
    }
  }
}

/* \/ Initialize callback listeners */
Screenshotter.eventManagerInit();
/* /\ Initialize callback listeners */